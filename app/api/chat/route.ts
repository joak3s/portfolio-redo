import { NextResponse } from 'next/server';
import { formatContext } from '@/lib/rag-utils';
import { hybridSearch, recordChatInteraction } from '@/lib/hybrid-search';
import { OpenAI } from 'openai';
import { createClient } from '@supabase/supabase-js';
import { 
  saveChatMessage, 
  getOrCreateSession as getOrCreateSessionDb, 
  getSessionMessages as getSessionMessagesDb,
  updateSessionTitle
} from '@/lib/chat-db';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Enable edge runtime for better performance
export const runtime = 'edge';

// Initialize OpenAI client
const openAI = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Define timeout for API requests
const TIMEOUT_MS = 10000;
const PROJECT_TIMEOUT_MS = 12000;  // Longer timeout for project-specific queries
const GENERAL_TIMEOUT_MS = 8000;   // Increased timeout for general queries

// Constants for the new streaming functionality
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Converts an AsyncIterable to a ReadableStream
 */
function iterableToStream(iterable: AsyncIterable<any>): ReadableStream {
  const iterator = iterable[Symbol.asyncIterator]();
  return new ReadableStream({
    async pull(controller) {
      try {
        const { value, done } = await iterator.next();
        if (done) {
          controller.close();
        } else {
          controller.enqueue(value);
        }
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

/**
 * Get or create a conversation session
 */
async function getOrCreateSession(sessionKey: string): Promise<string | null> {
  try {
    return await getOrCreateSessionDb(sessionKey);
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

/**
 * Retrieve recent messages for a session
 */
async function getSessionMessages(sessionId: string, limit = 5): Promise<any[]> {
  try {
    return await getSessionMessagesDb(sessionId, limit);
  } catch (error) {
    console.error('Error getting messages:', error);
    return [];
  }
}

/**
 * Analyze query intent to determine if it's about a specific project
 */
export function analyzeQueryIntent(query: string): { isProjectQuery: boolean; projectName: string | null; confidence: number; pattern?: string } {
  // Clean the query
  const cleanQuery = query.toLowerCase().trim();
  
  // Check for general information patterns first
  const generalPatterns = [
    /what (tech(nical)?|programming|coding|development) (skills|technologies|tools|stack|languages)/i,
    /what (is|are) (your|jordan'?s) (tech(nical)?|programming|coding|development) (skills|technologies|tools|stack|languages)/i,
    /tell me about (your|jordan'?s) (skills|background|experience|education|design approach|approach)/i,
    /what (is|are) (your|jordan'?s) (background|experience|education|design approach|approach|skills|vision|philosophy)/i,
    /what skills (does|has) jordan/i,
    /jordan'?s (skills|background|experience|education|vision|philosophy|toolkit|expertise)/i,
    /portfolio|resume|cv|qualifications|expertise|proficiency/i,
    /(who is|about) jordan/i
  ];
  
  // If any general pattern matches, return immediately with isProjectQuery false
  for (const pattern of generalPatterns) {
    if (pattern.test(cleanQuery)) {
      console.log(`General intent detected: "${cleanQuery}" (pattern: ${pattern})`);
      return { isProjectQuery: false, projectName: null, confidence: 0.9, pattern: 'general_info' };
    }
  }
  
  // Direct pattern match for project requests
  const projectPatterns = [
    /tell me about (the )?([a-z0-9\s\-]+) project/i,
    /what (is|was) (the )?([a-z0-9\s\-]+) project/i,
    /explain (the )?([a-z0-9\s\-]+) project/i,
    /describe (the )?([a-z0-9\s\-]+) project/i,
    /information (about|on) (the )?([a-z0-9\s\-]+) project/i,
    /tell me about ([a-z0-9\s\-]+)/i,
  ];
  
  // Check for direct pattern matches
  for (const pattern of projectPatterns) {
    const match = cleanQuery.match(pattern);
    if (match) {
      const projectName = match[match.length - 1].trim();
      // Skip if the "project" is actually about Jordan or skills
      if (['jordan', 'you', 'your', 'skills', 'experience', 'background'].includes(projectName)) {
        console.log(`Skipping false positive project match for "${projectName}"`);
        return { isProjectQuery: false, projectName: null, confidence: 0, pattern: 'false_positive' };
      }
      console.log(`Project intent analysis: {"isProjectQuery":true,"projectName":"${projectName}","confidence":1,"pattern":"direct_match"}`);
      return { isProjectQuery: true, projectName, confidence: 1, pattern: 'direct_match' };
    }
  }
  
  // Check for direct project name in query without patterns
  if (cleanQuery.length > 3 && !cleanQuery.includes('skill') && !cleanQuery.includes('experience') && 
      !cleanQuery.includes('jordan') && !cleanQuery.includes('you') && !cleanQuery.includes('about') && 
      cleanQuery.split(' ').length < 4) {
    console.log(`Project intent analysis: {"isProjectQuery":true,"projectName":"${cleanQuery}","confidence":0.8,"pattern":"name_only"}`);
    return { isProjectQuery: true, projectName: cleanQuery, confidence: 0.8, pattern: 'name_only' };
  }
  
  // Default to not being a project query
  console.log(`Project intent analysis: {"isProjectQuery":false,"projectName":null,"confidence":0}`);
  return { isProjectQuery: false, projectName: null, confidence: 0 };
}

/**
 * Get project by slug from the database
 */
async function getProjectBySlug(slug: string): Promise<any | null> {
  if (!slug) return null;
  
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, title, slug')
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('Error fetching project by slug:', error);
      return null;
    }
    
    if (data) {
      console.log(`Found project by slug: ${slug}, ID: ${data.id}`);
      return data;
    }
    
    return null;
  } catch (error) {
    console.error('Exception in getProjectBySlug:', error);
    return null;
  }
}

/**
 * Extract the most relevant project from search results
 */
function findMostRelevantProject(searchResults: any[], queryIntent: { isProjectQuery: boolean, projectName: string | null } = { isProjectQuery: false, projectName: null }) {
  // Skip project lookup for non-project queries to improve performance
  if (!queryIntent.isProjectQuery && !searchResults.some(result => result.content_type === 'project' && result.similarity > 0.85)) {
    return null;
  }
  
  // First look for direct project matches which have highest confidence
  const directMatch = searchResults.find(result => 
    result.content_type === 'project' && result.match_type === 'direct_project_match'
  );
  
  if (directMatch) {
    // Normalize the project data to ensure we have name field
    const project = directMatch.content;
    if (project.title && !project.name) {
      project.name = project.title;
    }
    
    // Use content_id from the search result instead of looking for metadata.id
    if (!project.id && directMatch.content_id) {
      project.id = directMatch.content_id;
      console.log(`Set project ID from content_id: ${project.id}`);
    } else if (!project.id && project.slug) {
      console.log(`Project ID missing for "${project.name}". Attempting to find by slug: ${project.slug}`);
    }
    
    return project;
  }
  
  // Then look for any project with high similarity
  const highConfidenceMatch = searchResults.find(result => 
    result.content_type === 'project' && result.similarity > 0.8
  );
  
  if (highConfidenceMatch) {
    // Normalize the project data to ensure we have name field
    const project = highConfidenceMatch.content;
    if (project.title && !project.name) {
      project.name = project.title;
    }
    
    // Use content_id from the search result instead of looking for metadata.id
    if (!project.id && highConfidenceMatch.content_id) {
      project.id = highConfidenceMatch.content_id;
      console.log(`Set project ID from content_id: ${project.id}`);
    } else if (!project.id && project.slug) {
      console.log(`Project ID missing for "${project.name}". Attempting to find by slug: ${project.slug}`);
    }
    
    return project;
  }
  
  // Finally, just return the first project found if any
  const firstProjectResult = searchResults.find(result => result.content_type === 'project');
  if (firstProjectResult) {
    // Normalize the project data to ensure we have name field
    const firstProject = firstProjectResult.content;
    if (firstProject.title && !firstProject.name) {
      firstProject.name = firstProject.title;
    }
    
    // Use content_id from the search result instead of looking for metadata.id
    if (!firstProject.id && firstProjectResult.content_id) {
      firstProject.id = firstProjectResult.content_id;
      console.log(`Set project ID from content_id: ${firstProject.id}`);
    }
    
    return firstProject;
  }
  
  return null;
}

/**
 * Retrieve the first image for a project
 */
async function getProjectFirstImage(projectId: string): Promise<string | null> {
  if (!projectId) return null;
  
  try {
    // Query to get the first project image ordered by order_index
    const { data, error } = await supabase
      .from('project_images')
      .select('url')
      .eq('project_id', projectId)
      .order('order_index', { ascending: true })
      .limit(1);
    
    if (error) {
      console.error('Error fetching project image:', error);
      return null;
    }
    
    return data && data.length > 0 ? data[0].url : null;
  } catch (error) {
    console.error('Exception in getProjectFirstImage:', error);
    return null;
  }
}

export async function POST(request: Request) {
  // Start the timer for the request
  const startTime = Date.now();
  
  try {
    // Parse request body with additional fields for session management
    const { prompt, sessionKey, includeHistory = true, streaming = false } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    console.log('Received prompt:', prompt);
    
    // Analyze query intent
    console.log('Analyzing query intent:', JSON.stringify(prompt));
    const queryIntent = analyzeQueryIntent(prompt);
    
    // Set timeout based on query intent
    const requestTimeout = queryIntent.isProjectQuery ? PROJECT_TIMEOUT_MS : GENERAL_TIMEOUT_MS;
    console.log(`Using ${requestTimeout}ms timeout for ${queryIntent.isProjectQuery ? 'project' : 'general'} query`);
    
    // Optimize search based on intent
    let searchQuery = prompt;
    let matchThreshold = 0.4;
    let matchCount = 5;
    
    if (queryIntent.isProjectQuery && queryIntent.projectName) {
      console.log(`Detected specific project request: "${queryIntent.projectName}"`);
      // Refocus search query to just the project name for better results
      searchQuery = queryIntent.projectName;
      console.log(`Refocusing search query to: "${searchQuery}"`);
      matchThreshold = 0.3; // Lower threshold for project names
      matchCount = 3; // Fewer matches needed for specific project
    } else {
      // For non-project queries, focus on general info
      matchThreshold = 0.6; // Higher threshold for general queries
      matchCount = 3; // Fewer matches to speed up response
      
      // For general queries, we can often bypass the hybrid search and just retrieve general info
      if (queryIntent.pattern === 'general_info') {
        console.log('Optimizing general info query with direct lookup');
        
        try {
          // First try to find category-specific information
          let categoryMatch = null;
          
          // Look for category indicators in the query
          const categoryKeywords = {
            'Skills': ['skills', 'technologies', 'tech stack', 'languages', 'frameworks', 'toolkit', 'expertise'],
            'Background': ['background', 'history', 'professional', 'career'],
            'Education': ['education', 'degree', 'university', 'study', 'academic'],
            'Philosophy': ['philosophy', 'approach', 'principles', 'believes', 'design thinking'],
            'Experience': ['experience', 'work history', 'professional', 'projects'],
            'Vision': ['vision', 'future', 'ai', 'artificial intelligence'],
            'Values': ['values', 'accessibility', 'commitment', 'priorities'],
            'Methodology': ['methodology', 'workflow', 'process', 'approach'],
            'Career': ['career', 'work', 'professional'],
            'Personal Interests': ['interests', 'personal', 'hobbies', 'rugby', 'sports']
          };
          
          // Debug the current query
          console.log(`Parsing query for category: "${prompt}"`);
          
          // Check for category matches in the query
          for (const [category, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => prompt.toLowerCase().includes(keyword.toLowerCase()))) {
              categoryMatch = category;
              console.log(`Found category match: ${category} (matched keyword in: ${keywords})`);
              break;
            }
          }
          
          // If no specific category match but we have a general query, try to infer category
          if (!categoryMatch) {
            // Common general queries to map to categories
            if (prompt.toLowerCase().includes('vision') || 
                prompt.toLowerCase().includes('ai') || 
                prompt.toLowerCase().includes('artificial intelligence')) {
              categoryMatch = 'Vision';
              console.log('Inferred Vision category from query keywords');
            } else if (prompt.toLowerCase().includes('skill') || 
                      prompt.toLowerCase().includes('can do') || 
                      prompt.toLowerCase().includes('expertise')) {
              categoryMatch = 'Skills';
              console.log('Inferred Skills category from query keywords');
            }
          }
          
          let queryBuilder = supabase
            .from('general_info')
            .select('*');
            
          // If we found a category match, prioritize that category
          if (categoryMatch) {
            console.log(`Using category match: ${categoryMatch}`);
            queryBuilder = queryBuilder
              .eq('category', categoryMatch)
              .limit(5);
          } else {
            // Otherwise, do a more general search
            console.log('No specific category match found, using general search');
            queryBuilder = queryBuilder
              .limit(5);
          }
          
          const { data: generalInfo, error } = await queryBuilder;
            
          if (error) {
            console.error('Error in direct general_info lookup:', error);
            // Fall back to hybrid search if direct lookup fails
          } else if (generalInfo && generalInfo.length > 0) {
            console.log(`Found ${generalInfo.length} general info entries directly`);
            // Log what was found for debugging
            generalInfo.forEach(info => {
              console.log(`- ${info.title} (${info.category}): ${info.content.substring(0, 30)}...`);
            });
            
            // Format the general info as search results
            const directResults = generalInfo.map(info => ({
              content: {
                id: info.id,
                title: info.title,
                type: 'general_info',
                content: info.content,
                category: info.category,
                published: true
              },
              content_type: 'general_info',
              similarity: 0.9, // High confidence for direct matches
              metadata: { 
                id: info.id,
                category: info.category 
              }
            }));
            
            // Continue processing with these direct results
            return await continueWithSearchResults(directResults, prompt, sessionKey, includeHistory, requestTimeout, queryIntent, startTime);
          } else {
            console.log('No matching general_info records found, falling back to hybrid search');
          }
        } catch (err) {
          console.error('Error in direct general_info lookup:', err);
          // Fall back to hybrid search if direct lookup fails
        }
      }
    }
    
    // Get or create conversation session if sessionKey is provided
    let sessionId: string | null = null;
    let previousMessages: any[] = [];
    
    if (sessionKey) {
      sessionId = await getOrCreateSession(sessionKey);
      
      // Retrieve conversation history if requested
      if (includeHistory && sessionId) {
        previousMessages = await getSessionMessages(sessionId, 5);
        console.log(`Retrieved ${previousMessages.length} previous messages for context`);
      }
    }
    
    // Create a timeout promise to abort long-running requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timed out after ${requestTimeout}ms`)), requestTimeout);
    });
    
    // If streaming mode is requested, use streaming API for response
    if (streaming) {
      // Run hybrid search with a timeout for streaming case
      const searchResultsPromise = hybridSearch(searchQuery, {
        matchThreshold,  
        matchCount,
      });
      
      // Race the search against the timeout
      const searchResults = await Promise.race([
        searchResultsPromise,
        timeoutPromise
      ]) as Awaited<typeof searchResultsPromise>;
      
      console.log(`Found ${searchResults.length} relevant documents`);
      console.log('Search execution time:', Date.now() - startTime, 'ms');
      
      return await streamResponse(searchResults, prompt, sessionKey, includeHistory, requestTimeout, queryIntent, startTime);
    }
    
    // Run hybrid search with a timeout for non-streaming case (existing code)
    const searchResultsPromise = hybridSearch(searchQuery, {
      matchThreshold,  
      matchCount,
    });
    
    // Race the search against the timeout
    const searchResults = await Promise.race([
      searchResultsPromise,
      timeoutPromise
    ]) as Awaited<typeof searchResultsPromise>;
    
    console.log(`Found ${searchResults.length} relevant documents`);
    console.log('Search execution time:', Date.now() - startTime, 'ms');
    
    return await continueWithSearchResults(searchResults, prompt, sessionKey, includeHistory, requestTimeout, queryIntent, startTime);
    
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`Error in chat API (${executionTime}ms):`, error);
    
    // Different error responses based on the error type
    if (error.message?.includes('timed out')) {
      return NextResponse.json(
        { 
          error: 'The request took too long to process',
          response: "I'm sorry, but your request is taking longer than expected to process. Could you try a simpler question or try again in a moment?"
        },
        { status: 504 }
      );
    } else if (error.message?.includes('fetch failed')) {
      return NextResponse.json(
        {
          error: 'Network connectivity issue',
          response: "I'm having trouble connecting to the knowledge base right now. This could be due to a temporary network issue. Please try again shortly."
        },
        { status: 502 }
      );
    } else {
      return NextResponse.json(
        {
          error: 'Failed to process request',
          response: "I apologize, but something went wrong processing your request. Please try again."
        },
        { status: 500 }
      );
    }
  }
}

/**
 * Continue processing after search results are obtained
 */
async function continueWithSearchResults(
  searchResults: any[], 
  prompt: string, 
  sessionKey: string | null, 
  includeHistory: boolean, 
  requestTimeout: number,
  queryIntent: ReturnType<typeof analyzeQueryIntent>,
  startTime: number
) {
  try {
    // Get session id if needed
    let sessionId: string | null = null;
    let previousMessages: any[] = [];
    
    if (sessionKey) {
      sessionId = await getOrCreateSession(sessionKey);
      
      // Retrieve conversation history if requested
      if (includeHistory && sessionId) {
        previousMessages = await getSessionMessages(sessionId, 5);
        console.log(`Retrieved ${previousMessages.length} previous messages for context`);
      }
    }
    
    // Create a timeout promise for the remaining process
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timed out after ${requestTimeout}ms`)), requestTimeout);
    });
    
    // Format response context
    const responseContext = formatContext(searchResults);
    
    // Only find relevant project for project queries or if there's a high confidence match
    const mostRelevantProject = queryIntent.isProjectQuery || 
                               searchResults.some((r: any) => r.content_type === 'project' && r.similarity > 0.85) 
                               ? findMostRelevantProject(searchResults, queryIntent) 
                               : null;

    // Variable to store the project image URL
    let projectImage: string | null = null;
    
    // Only process project image for project-related queries
    if (mostRelevantProject) {
      console.log('Found relevant project:', {
        id: mostRelevantProject.id,
        name: mostRelevantProject.name || mostRelevantProject.title,
        slug: mostRelevantProject.slug
      });
      
      // Function to validate image URL
      const isValidImageUrl = (url: string | null | undefined): boolean => {
        if (!url) return false;
        // Basic validation - must be a string and start with http/https
        return typeof url === 'string' && 
               (url.startsWith('http://') || url.startsWith('https://')) && 
               url.length > 10;
      };

      // First check if the project already has image data from the search results
      if (isValidImageUrl(mostRelevantProject.image_url)) {
        projectImage = mostRelevantProject.image_url;
        console.log('Using image_url from search results:', projectImage);
      } else if (mostRelevantProject.gallery_images && 
                mostRelevantProject.gallery_images.length > 0 && 
                isValidImageUrl(mostRelevantProject.gallery_images[0].url)) {
        projectImage = mostRelevantProject.gallery_images[0].url;
        console.log('Using first gallery image from search results:', projectImage);
      } else if (mostRelevantProject.id) {
        // If no image data in search results, fetch it directly using our dedicated function
        const fetchedImage = await getProjectFirstImage(mostRelevantProject.id);
        if (isValidImageUrl(fetchedImage)) {
          projectImage = fetchedImage;
          console.log('Fetched project image directly:', projectImage);
        } else {
          console.log('No valid project image found');
        }
      } else if (mostRelevantProject.slug) {
        // If we only have a slug, try to get the project by slug and then fetch image
        console.log(`No project ID found. Attempting to get project by slug: ${mostRelevantProject.slug}`);
        const project = await getProjectBySlug(mostRelevantProject.slug);
        
        if (project && project.id) {
          // Update the relevant project with the database ID
          mostRelevantProject.id = project.id;
          
          // Now try to fetch the image
          const fetchedImage = await getProjectFirstImage(project.id);
          if (isValidImageUrl(fetchedImage)) {
            projectImage = fetchedImage;
            console.log('Fetched project image using slug lookup:', projectImage);
          }
        }
      }
    }
    
    // Format conversation history for the AI prompt
    const conversationHistory = previousMessages.map(msg => ({
      role: msg.role || (msg.user_prompt ? 'user' : 'assistant'), 
      content: msg.content || msg.user_prompt || msg.response
    }));
    
    // Build enhanced system message with context and project details
    let systemMessageContent = `You are an AI assistant for Jordan Oakes' portfolio website. Jordan is a multi-disciplinary designer and developer specializing in user-centered digital experiences, with expertise in UX/UI design, web development, AI-driven solutions, and human-computer interaction. 

IMPORTANT RULES:
1. Only provide information about real, documented projects from the context provided.
2. DO NOT invent or speculate about any projects, outcomes, or roles.
3. If no relevant project matches the prompt, respond by stating that no related project is available.
4. Maintain a professional and convincing tone, focusing on accurate and verified information.
5. Format responses in semantic HTML using proper <h2>, <p>, <strong>, and <a> tags where appropriate.
6. DO NOT wrap the response in markdown code blocks.
7. When linking to project case studies, ALWAYS use the format <a href="/work/[slug]">Project Name</a> where [slug] is the project's slug value.`;

    // Add optimized response instructions based on query type
    if (queryIntent.isProjectQuery) {
      // For project queries, add project-specific details
      if (projectImage) {
        systemMessageContent += `

ABOUT THE CURRENT PROJECT:
7. The user is asking about the "${mostRelevantProject?.name}" project.
8. Focus your response on providing accurate details about this specific project.
9. DO NOT include any image tags in your response - the UI will automatically display the project image.`;
      }
    } else {
      // For general queries, add different instructions
      systemMessageContent += `

GENERAL INFORMATION:
7. The user is asking about Jordan's skills, experience, or background.
8. Focus on providing accurate information about Jordan's professional expertise and capabilities.
9. Keep your response concise and informative without unnecessary details.`;
    }

    systemMessageContent += `

Context:
${responseContext || "No specific information found in knowledge base."}

${mostRelevantProject ? `Relevant Project:\n${JSON.stringify(mostRelevantProject, null, 2)}` : ""}`;
    
    const systemMessage = {
      role: 'system',
      content: systemMessageContent
    };
    
    // Prepare message array for API call with conversation history
    const messages = [
      systemMessage,
      ...conversationHistory,
      { role: 'user', content: prompt }
    ];
    
    // Adjust OpenAI parameters based on query type for better performance
    const temperature = queryIntent.isProjectQuery ? 0.7 : 0.4; // Even lower temperature for general queries
    const maxTokens = queryIntent.isProjectQuery ? 1000 : 700; // Even fewer tokens for general queries
    
    // Call OpenAI with race against timeout
    const completionPromise = openAI.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages as any,
      temperature,
      max_tokens: maxTokens,
    });
    
    // Race the completion against the timeout
    const completion = await Promise.race([
      completionPromise,
      timeoutPromise
    ]) as Awaited<typeof completionPromise>;
    
    const response = completion.choices[0].message.content;
    console.log('Total execution time:', Date.now() - startTime, 'ms');
    
    // Save the conversation to the database if we have a session
    if (sessionId) {
      try {
        // Save user message
        await saveChatMessage(sessionId, 'user', prompt);
        
        // Save assistant response
        const messageId = await saveChatMessage(sessionId, 'assistant', response ?? '');
        
        // If we have a relevant project and message was saved successfully, save the association
        if (messageId && mostRelevantProject && mostRelevantProject.id) {
          try {
            // Save project association with image
            const { data, error } = await supabase.rpc(
              'save_chat_project',
              {
                p_message_id: messageId,
                p_project_id: mostRelevantProject.id,
                p_project_image: projectImage
              }
            );
            
            if (error) {
              console.error('Error saving project association:', error);
            } else {
              console.log('Saved project association for message:', messageId);
            }
          } catch (error) {
            console.error('Error calling save_chat_project function:', error);
            // Non-critical error, continue
          }
        }
        
        // Update session title if this is the first message
        if (previousMessages.length === 0) {
          const truncatedPrompt = prompt.length > 30 
            ? prompt.substring(0, 30) + '...' 
            : prompt;
          
          try {
            await updateSessionTitle(sessionId, truncatedPrompt);
          } catch (error) {
            console.error('Error updating session title:', error);
            // Non-critical error, continue
          }
        }
        
        // Record interaction for analytics
        try {
          await recordChatInteraction(prompt, response ?? '', {
            session_id: sessionId,
            search_results: searchResults
          });
        } catch (error) {
          console.error('Error recording chat analytics:', error);
          // Non-critical error, continue
        }
      } catch (error) {
        console.error('Error saving chat history:', error);
        // Continue even if saving fails - we'll return the response to user anyway
      }
    }
    
    // Return the enhanced response with project image data if available
    return NextResponse.json({ 
      response,
      context: searchResults,
      prompt,
      session_id: sessionId,
      relevant_project: mostRelevantProject,
      project_image: projectImage
    });
  } catch (error: any) {
    throw error; // Rethrow to the main error handler
  }
}

/**
 * Handle streaming response
 */
async function streamResponse(
  searchResults: any[], 
  prompt: string, 
  sessionKey: string | null, 
  includeHistory: boolean, 
  requestTimeout: number,
  queryIntent: ReturnType<typeof analyzeQueryIntent>,
  startTime: number
) {
  try {
    // Get session id if needed
    let sessionId: string | null = null;
    let previousMessages: any[] = [];
    
    if (sessionKey) {
      sessionId = await getOrCreateSession(sessionKey);
      
      // Retrieve conversation history if requested
      if (includeHistory && sessionId) {
        previousMessages = await getSessionMessages(sessionId, 5);
        console.log(`Retrieved ${previousMessages.length} previous messages for context`);
      }
    }
    
    // Format response context
    const responseContext = formatContext(searchResults);
    
    // Only find relevant project for project queries or if there's a high confidence match
    const mostRelevantProject = queryIntent.isProjectQuery || 
                               searchResults.some((r: any) => r.content_type === 'project' && r.similarity > 0.85) 
                               ? findMostRelevantProject(searchResults, queryIntent) 
                               : null;

    // Variable to store the project image URL
    let projectImage: string | null = null;
    
    // Process project image for project-related queries (same as non-streaming)
    if (mostRelevantProject) {
      console.log('Found relevant project:', {
        id: mostRelevantProject.id,
        name: mostRelevantProject.name || mostRelevantProject.title,
        slug: mostRelevantProject.slug
      });
      
      // Function to validate image URL
      const isValidImageUrl = (url: string | null | undefined): boolean => {
        if (!url) return false;
        // Basic validation - must be a string and start with http/https
        return typeof url === 'string' && 
               (url.startsWith('http://') || url.startsWith('https://')) && 
               url.length > 10;
      };

      // Check for image same as non-streaming logic
      if (isValidImageUrl(mostRelevantProject.image_url)) {
        projectImage = mostRelevantProject.image_url;
      } else if (mostRelevantProject.gallery_images && 
                mostRelevantProject.gallery_images.length > 0 && 
                isValidImageUrl(mostRelevantProject.gallery_images[0].url)) {
        projectImage = mostRelevantProject.gallery_images[0].url;
      } else if (mostRelevantProject.id) {
        const fetchedImage = await getProjectFirstImage(mostRelevantProject.id);
        if (isValidImageUrl(fetchedImage)) {
          projectImage = fetchedImage;
        }
      } else if (mostRelevantProject.slug) {
        // If we only have a slug, try to get the project by slug and then fetch image
        const project = await getProjectBySlug(mostRelevantProject.slug);
        
        if (project && project.id) {
          // Update the relevant project with the database ID
          mostRelevantProject.id = project.id;
          
          // Now try to fetch the image
          const fetchedImage = await getProjectFirstImage(project.id);
          if (isValidImageUrl(fetchedImage)) {
            projectImage = fetchedImage;
          }
        }
      }
    }
    
    // Format conversation history for the AI prompt
    const conversationHistory = previousMessages.map(msg => ({
      role: msg.role || (msg.user_prompt ? 'user' : 'assistant'), 
      content: msg.content || msg.user_prompt || msg.response
    }));
    
    // System message same as non-streaming version
    let systemMessageContent = `You are an AI assistant for Jordan Oakes' portfolio website. Jordan is a multi-disciplinary designer and developer specializing in user-centered digital experiences, with expertise in UX/UI design, web development, AI-driven solutions, and human-computer interaction. 

IMPORTANT RULES:
1. Only provide information about real, documented projects from the context provided.
2. DO NOT invent or speculate about any projects, outcomes, or roles.
3. If no relevant project matches the prompt, respond by stating that no related project is available.
4. Maintain a professional and convincing tone, focusing on accurate and verified information.
5. Format responses in semantic HTML using proper <h2>, <p>, <strong>, and <a> tags where appropriate.
6. DO NOT wrap the response in markdown code blocks.
7. When linking to project case studies, ALWAYS use the format <a href="/work/[slug]">Project Name</a> where [slug] is the project's slug value.`;

    // Add project or general query specific instructions
    if (queryIntent.isProjectQuery) {
      if (projectImage) {
        systemMessageContent += `

ABOUT THE CURRENT PROJECT:
7. The user is asking about the "${mostRelevantProject?.name}" project.
8. Focus your response on providing accurate details about this specific project.
9. DO NOT include any image tags in your response - the UI will automatically display the project image.`;
      }
    } else {
      systemMessageContent += `

GENERAL INFORMATION:
7. The user is asking about Jordan's skills, experience, or background.
8. Focus on providing accurate information about Jordan's professional expertise and capabilities.
9. Keep your response concise and informative without unnecessary details.`;
    }

    systemMessageContent += `

Context:
${responseContext || "No specific information found in knowledge base."}

${mostRelevantProject ? `Relevant Project:\n${JSON.stringify(mostRelevantProject, null, 2)}` : ""}`;
    
    const systemMessage = {
      role: 'system',
      content: systemMessageContent
    };
    
    // Prepare message array for API call with conversation history
    const messages = [
      systemMessage,
      ...conversationHistory,
      { role: 'user', content: prompt }
    ];
    
    // Adjust OpenAI parameters based on query type for better performance
    const temperature = queryIntent.isProjectQuery ? 0.7 : 0.4;
    const maxTokens = queryIntent.isProjectQuery ? 1000 : 700;
    
    // Send initial metadata as a JSON object
    const initialData = {
      type: 'metadata',
      projectImage: projectImage,
      sessionId: sessionId,
      relevantProject: mostRelevantProject
    };
    
    // Create a stream of the response chunks
    const stream = iterableToStream(streamOpenAIResponse(
      messages,
      temperature,
      maxTokens,
      initialData,
      sessionId,
      prompt
    ));
    
    // Create streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Error in streaming response:', error);
    
    // Create an error response stream
    const errorStream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: 'Failed to process request',
          message: "I apologize, but something went wrong processing your request. Please try again."
        })}\n\n`));
        controller.close();
      }
    });
    
    return new Response(errorStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  }
}

/**
 * Stream OpenAI response chunks to client
 */
async function* streamOpenAIResponse(
  messages: any[],
  temperature: number,
  maxTokens: number,
  initialData: any,
  sessionId: string | null,
  userPrompt: string
): AsyncGenerator<Uint8Array> {
  try {
    // Send initial metadata
    yield encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`);
    
    // Call OpenAI with streaming enabled
    const stream = await openAI.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });
    
    // Accumulate full response for saving to database later
    let fullResponse = '';
    
    // Stream each chunk from OpenAI
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        // Add content to the full response
        fullResponse += content;
        
        // Send content chunk to client
        yield encoder.encode(`data: ${JSON.stringify({
          type: 'content',
          content: content
        })}\n\n`);
      }
    }
    
    // Save the complete response to the database if we have a session
    if (sessionId) {
      try {
        // Don't wait for these operations to complete, let them happen in the background
        // so we don't delay the streaming response completion
        
        // 1. Save message pair to database
        const saveMessages = async () => {
          try {
            // Save user message
            await saveChatMessage(sessionId, 'user', userPrompt);
            
            // Save assistant response
            await saveChatMessage(sessionId, 'assistant', fullResponse);
          } catch (error) {
            console.error('Error saving chat messages:', error);
          }
        };
        
        // 2. Update session title if needed
        const updateTitle = async () => {
          try {
            const previousMessages = await getSessionMessages(sessionId, 1);
            if (previousMessages.length <= 1) {
              const truncatedPrompt = userPrompt.length > 30 
                ? userPrompt.substring(0, 30) + '...' 
                : userPrompt;
              
              await updateSessionTitle(sessionId, truncatedPrompt);
            }
          } catch (error) {
            console.error('Error updating session title:', error);
          }
        };
        
        // 3. Record interaction for analytics
        const recordAnalytics = async () => {
          try {
            await recordChatInteraction(userPrompt, fullResponse, {
              session_id: sessionId
            });
          } catch (error) {
            console.error('Error recording chat analytics:', error);
          }
        };
        
        // Trigger all background operations
        saveMessages();
        updateTitle();
        recordAnalytics();
      } catch (error) {
        console.error('Error in background operations:', error);
      }
    }
    
    // Signal completion
    yield encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    
  } catch (error) {
    console.error('Error in streaming response:', error);
    yield encoder.encode(`data: ${JSON.stringify({
      type: 'error',
      error: 'Streaming error',
      message: "There was an error generating the response. Please try again."
    })}\n\n`);
  }
} 