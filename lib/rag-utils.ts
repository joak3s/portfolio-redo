import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';

// Initialize clients with environment variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

interface SearchResult {
  content_id: string;
  content_type: string;
  similarity: number;
  content: {
    title?: string;
    name?: string;
    content?: string;
    summary?: string;
    category?: string;
    slug?: string;
    features?: string[];
    url?: string;
    image_url?: string;
    keywords?: string[];
  };
}

/**
 * Generate an embedding for the given text
 */
export async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536
  });
  return response.data[0].embedding;
}

/**
 * Perform semantic search using embeddings
 */
export async function semanticSearch(query: string, options: {
  matchThreshold?: number;
  matchCount?: number;
  contentTypes?: string[];
} = {}) {
  const {
    matchThreshold = 0.5,
    matchCount = 5,
    contentTypes = ['general_info', 'project']
  } = options;

  try {
    // Generate embedding for the query
    const embedding = await getEmbedding(query).catch(err => {
      console.error('Error generating embedding:', err);
      throw new Error('Failed to generate embeddings for search');
    });

    // Use Supabase's hybrid_search function with retries
    const executeQuery = async (attempts = 3) => {
      for (let i = 0; i < attempts; i++) {
        try {
          const { data, error } = await supabase.rpc('hybrid_search', {
            query_embedding: embedding,
            query_text: query,
            match_threshold: matchThreshold,
            match_count: matchCount
          });

          if (error) {
            // If this is the last attempt, throw the error
            if (i === attempts - 1) {
              console.error('Error performing semantic search after retries:', error);
              throw error;
            }
            
            // Wait before retrying (with exponential backoff)
            await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 500));
            continue;
          }
          
          // Return data if successful
          return data;
        } catch (err) {
          // If this is the last attempt, throw the error
          if (i === attempts - 1) {
            console.error('Exception in semantic search after retries:', err);
            throw err;
          }
          
          // Wait before retrying (with exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 500));
        }
      }
      
      // If all attempts fail, return empty array as fallback
      return [];
    };
    
    // Execute the query with retries
    const matches = await executeQuery();

    // Log matches for debugging
    console.log(`Found ${matches?.length || 0} matches:`, 
      matches?.map((m: SearchResult) => `${m.content_type} (${(m.similarity * 100).toFixed(1)}%): ${
        m.content_type === 'general_info' ? m.content.title : m.content.name
      }`)
    );

    // Return matches filtered by content type if needed
    return (matches as SearchResult[])?.filter((m: SearchResult) => contentTypes.includes(m.content_type)) || [];
  } catch (error) {
    console.error('Error in semantic search:', error);
    // Return empty array instead of throwing to avoid breaking the chat flow
    return [];
  }
}

/**
 * Format the search results into a readable context string
 */
export function formatContext(results: SearchResult[]): string {
  if (!results || results.length === 0) {
    return "";
  }

  // Group results by content type
  const generalInfo = results.filter(r => r.content_type === 'general_info');
  const projects = results.filter(r => r.content_type === 'project');

  let context = '';

  // Format general info context with similarity score
  if (generalInfo.length > 0) {
    context += `GENERAL INFORMATION:\n`;
    
    generalInfo.forEach(result => {
      const content = result.content;
      const similarityPercentage = (result.similarity * 100).toFixed(1);
      context += `[${content.title} - Match: ${similarityPercentage}%]\n${content.content}\n\n`;
    });
  }

  // Format project context with similarity score
  if (projects.length > 0) {
    context += `PROJECTS:\n`;
    
    projects.forEach(result => {
      const content = result.content;
      const similarityPercentage = (result.similarity * 100).toFixed(1);
      context += `[${content.name} - Match: ${similarityPercentage}%]\n`;
      context += `${content.summary || ''}\n`;
      
      // Add features if available
      if (content.features && Array.isArray(content.features) && content.features.length > 0) {
        context += `\nKey Features:\n`;
        content.features.forEach((feature: string) => {
          context += `- ${feature}\n`;
        });
      }
      
      // Add URL if available
      if (content.url) {
        context += `\nProject URL: ${content.url}\n`;
      }
      
      context += `\n`;
    });
  }

  // If no information was found
  if (context.trim() === '') {
    return "";
  }

  return context;
} 