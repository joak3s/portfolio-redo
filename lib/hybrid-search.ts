import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { detectProjectQuery } from './project-matcher';

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Generate embeddings with OpenAI API
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536
  });
  
  return response.data[0].embedding;
}

// Enhanced hybrid search function with project intent detection
export async function hybridSearch(
  query: string, 
  options: {
    matchThreshold?: number;
    matchCount?: number;
    contentTypes?: string[];
  } = {}
) {
  const { 
    matchThreshold = 0.5,
    matchCount = 5,
    contentTypes = ['general_info', 'project']
  } = options;

  try {
    // Step 1: Check if the query is specifically about a project
    console.log(`Analyzing query intent: "${query}"`);
    const projectIntent = await detectProjectQuery(query);
    console.log(`Project intent analysis:`, JSON.stringify(projectIntent));
    
    let results: any[] = [];
    let forceSpecificProject = false;
    let specificProjectName = null;
    
    // Step 2: Handle direct project matches with high confidence
    if (projectIntent.isProjectQuery && projectIntent.projectName && projectIntent.confidence > 0.7) {
      specificProjectName = projectIntent.projectName;
      forceSpecificProject = true;
      
      console.log(`Detected specific project request: "${specificProjectName}"`);
      
      // Try direct lookup by project name first (most efficient)
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('id, title, description')
        .ilike('title', specificProjectName)
        .limit(1);
      
      if (!projectError && projectData && projectData.length > 0) {
        // Get the project's embedding if available
        const { data: embeddingData, error: embeddingError } = await supabase
          .from('embeddings')
          .select('content_id, content_type')
          .eq('content_type', 'project')
          .eq('project_title', specificProjectName)
          .limit(1);
        
        if (!embeddingError && embeddingData && embeddingData.length > 0) {
          // Fetch the complete project data
          const { data: completeData, error: completeError } = await supabase.rpc('get_content_by_id', {
            p_content_id: embeddingData[0].content_id,
            p_content_type: 'project'
          });
          
          console.log('get_content_by_id result:', { 
            content_id: embeddingData[0].content_id,
            content_type: 'project',
            success: !completeError,
            hasData: !!completeData,
            error: completeError
          });
          
          if (!completeError && completeData) {
            // Add this as a high-confidence result
            results.push({
              content_id: embeddingData[0].content_id,
              content_type: 'project',
              similarity: 0.99,  // High confidence direct match
              content: completeData,
              match_type: 'direct_project_match'
            });
          }
        }
      }
    }
    
    // Step 3: Always perform the semantic search as a fallback or to enrich results
    // Generate embedding for the query
    const embedding = await generateEmbedding(query);
    
    // If we have a specific project intent but no direct match yet, tailor the query
    let searchQuery = query;
    if (specificProjectName && results.length === 0) {
      // Focus the search specifically on the project name
      searchQuery = specificProjectName;
      console.log(`Refocusing search query to: "${searchQuery}"`);
    }
    
    // Use Supabase RPC to call the hybrid_search function
    const { data, error } = await supabase.rpc('hybrid_search', {
      query_embedding: embedding,
      query_text: searchQuery,
      match_threshold: matchThreshold,
      match_count: matchCount
    });
    
    if (error) {
      console.error('Error in hybrid search:', error);
      throw error;
    }
    
    // Filter results by content type if specified
    const hybridResults = data || [];
    const filteredResults = contentTypes.length > 0 
      ? hybridResults.filter((item: any) => contentTypes.includes(item.content_type))
      : hybridResults;
    
    // Step 4: Merge results based on intent detection
    if (results.length > 0) {
      // If we found results through direct project matching, prioritize them
      // but still include other relevant results
      return [
        ...results,
        ...filteredResults.filter((item: any) => 
          // Don't duplicate the same project we already found via direct match
          !(forceSpecificProject && 
            item.content_type === 'project' && 
            item.content?.name?.toLowerCase() === specificProjectName?.toLowerCase())
        )
      ];
    } else if (filteredResults.length === 0 && projectIntent.isProjectQuery && projectIntent.confidence > 0.4) {
      // Step 5: Fallback for project-related queries that found no results
      console.log('No results found but detected project intent, attempting fallback...');
      
      // Try broader text search on projects
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('projects')
        .select('id, title')
        .order('featured', { ascending: false })
        .limit(3);
      
      if (!fallbackError && fallbackData && fallbackData.length > 0) {
        console.log('Found fallback projects:', fallbackData.map((p: any) => p.title).join(', '));
        
        // For each project, get its full data
        const fallbackResults = await Promise.all(
          fallbackData.map(async (project: any) => {
            const { data: content, error: contentError } = await supabase.rpc('get_content_by_id', {
              p_content_id: project.id,
              p_content_type: 'project'
            });
            
            if (!contentError && content) {
              return {
                content_id: project.id,
                content_type: 'project',
                similarity: 0.3,  // Low confidence fallback
                content,
                match_type: 'fallback_project'
              };
            }
            return null;
          })
        );
        
        // Filter out nulls and add to results
        return fallbackResults.filter(r => r !== null);
      }
    }
    
    // Return standard filtered results if no special handling was needed
    return filteredResults;
  } catch (error) {
    console.error('Failed to execute hybrid search:', error);
    throw error;
  }
}

// Function to store a chat interaction for future analytics
export async function recordChatInteraction(
  query: string,
  response: string,
  metadata: {
    session_id?: string;
    user_id?: string;
    search_results?: any[];
  } = {}
) {
  try {
    // Store the interaction in the chat_analytics table
    const { error } = await supabase
      .from('chat_analytics')
      .insert({
        query,
        response,
        session_id: metadata.session_id,
        user_id: metadata.user_id,
        search_results: metadata.search_results,
        created_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error recording chat interaction:', error);
    }
  } catch (error) {
    console.error('Failed to record chat interaction:', error);
    // Don't throw, just log - this is non-critical
  }
} 