import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('Missing required credentials. Check your .env files.');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// Get query from command line arguments
const query = process.argv[2] || "Tell me about Jordan's work on Kosei Performance";

async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536
  });
  return response.data[0].embedding;
}

async function testHybridSearch() {
  try {
    console.log(`Testing hybrid search with query: "${query}"`);
    
    // Generate embedding
    console.log('Generating embedding...');
    const embedding = await getEmbedding(query);
    
    // Call hybrid_search function
    console.log('Calling hybrid_search function...');
    const { data, error } = await supabase.rpc('hybrid_search', {
      query_embedding: embedding,
      query_text: query,
      match_threshold: 0.5,
      match_count: 5
    });
    
    if (error) {
      console.error('Error with hybrid search:', error);
      return;
    }
    
    // Print results
    console.log(`\nFound ${data.length} results:`);
    data.forEach((result, i) => {
      console.log(`\n--- Result ${i + 1} ---`);
      console.log(`Content Type: ${result.content_type}`);
      console.log(`Similarity: ${(result.similarity * 100).toFixed(1)}%`);
      
      if (result.content_type === 'project') {
        console.log(`Project Name: ${result.content.name}`);
        // Display a preview of the full summary
        console.log(`Summary: ${result.content.summary?.substring(0, 150)}...`);
        
        if (result.content.features && result.content.features.length > 0) {
          console.log(`Features: ${result.content.features.slice(0, 2).join(', ')}${result.content.features.length > 2 ? '...' : ''}`);
        }
      } else {
        console.log(`Title: ${result.content.title}`);
        console.log(`Content: ${result.content.content?.substring(0, 100)}...`);
      }
    });
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error testing hybrid search:', error);
  }
}

// Run the test
testHybridSearch(); 