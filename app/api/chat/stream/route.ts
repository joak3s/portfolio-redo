import { NextRequest } from 'next/server';
import { analyzeQueryIntent } from '../route';
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
const PROJECT_TIMEOUT_MS = 12000;
const GENERAL_TIMEOUT_MS = 8000;

// Constants for the streaming functionality
const encoder = new TextEncoder();

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
 * Find most relevant project from search results
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
    const project = directMatch.content;
    if (project.title && !project.name) {
      project.name = project.title;
    }
    
    // Use content_id from the search result instead of looking for metadata.id
    if (!project.id && directMatch.content_id) {
      project.id = directMatch.content_id;
      console.log(`Set project ID from content_id: ${project.id}`);
    }
    
    return project;
  }
  
  // Then look for any project with high similarity
  const highConfidenceMatch = searchResults.find(result => 
    result.content_type === 'project' && result.similarity > 0.8
  );
  
  if (highConfidenceMatch) {
    const project = highConfidenceMatch.content;
    if (project.title && !project.name) {
      project.name = project.title;
    }
    
    // Use content_id from the search result instead of looking for metadata.id
    if (!project.id && highConfidenceMatch.content_id) {
      project.id = highConfidenceMatch.content_id;
      console.log(`Set project ID from content_id: ${project.id}`);
    }
    
    return project;
  }
  
  // Finally, just return the first project found if any
  const firstProjectResult = searchResults.find(result => result.content_type === 'project');
  if (firstProjectResult) {
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
    
    if (data && data.length > 0 && data[0].url) {
      return data[0].url;
    }
    
    return null;
  } catch (error) {
    console.error('Exception in getProjectFirstImage:', error);
    return null;
  }
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
 * GET handler for streaming responses via EventSource
 */
export async function GET(request: NextRequest) {
  // Start the timer for the request
  const startTime = Date.now();
  
  try {
    // Extract request data from URL query parameter
    const searchParams = request.nextUrl.searchParams;
    const dataParam = searchParams.get('data');
    
    if (!dataParam) {
      return new Response(
        JSON.stringify({ error: 'Data parameter is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the data parameter
    const { prompt, sessionKey, includeHistory = true } = JSON.parse(decodeURIComponent(dataParam));
    
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('Received streaming prompt:', prompt);
    
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
    
    // Run hybrid search
    const searchResults = await hybridSearch(searchQuery, {
      matchThreshold,  
      matchCount,
    });
    
    console.log(`Found ${searchResults.length} relevant documents`);
    console.log('Search execution time:', Date.now() - startTime, 'ms');
    
    // Format response context
    const responseContext = formatContext(searchResults);
    
    // Only find relevant project for project queries or if there's a high confidence match
    const mostRelevantProject = queryIntent.isProjectQuery || 
                               searchResults.some((r: any) => r.content_type === 'project' && r.similarity > 0.85) 
                               ? findMostRelevantProject(searchResults, queryIntent) 
                               : null;

    // Variable to store the project image URL
    let projectImage: string | null = null;
    
    // Process project image for project-related queries
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

      // Check for valid image from various sources
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
        const project = await getProjectBySlug(mostRelevantProject.slug);
        
        if (project && project.id) {
          mostRelevantProject.id = project.id;
          
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
    
    // Add extra logging for debugging
    console.log(`Sending metadata with project image: ${projectImage ? 'Yes' : 'No'}`);
    if (projectImage) {
      console.log(`Project image URL: ${projectImage.substring(0, 60)}...`);
    }
    
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
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`Error in streaming API (${executionTime}ms):`, error);
    
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