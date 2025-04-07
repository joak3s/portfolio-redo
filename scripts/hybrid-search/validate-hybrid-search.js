import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('Missing required environment variables.');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// Function to generate embeddings
async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 1536
  });
  return response.data[0].embedding;
}

// Simple test function
async function testHybridSearch() {
  const testQuery = "web development skills";
  
  try {
    console.log(`Testing hybrid search with query: "${testQuery}"`);
    
    // Generate embedding
    console.log('Generating embedding...');
    const embedding = await getEmbedding(testQuery);
    
    // Call the hybrid_search function
    console.log('Calling hybrid_search function...');
    const { data, error } = await supabase.rpc('hybrid_search', {
      query_embedding: embedding,
      query_text: testQuery,
      match_threshold: 0.5,
      match_count: 5
    });
    
    if (error) {
      console.error('❌ Error calling hybrid_search:', error);
      return false;
    }
    
    console.log(`✅ Success! Found ${data?.length || 0} matching results`);
    
    if (data && data.length > 0) {
      console.log('\nResults:');
      data.forEach((item, index) => {
        console.log(`\n--- Result ${index + 1} ---`);
        console.log(`Content Type: ${item.content_type}`);
        console.log(`Similarity: ${(item.similarity * 100).toFixed(1)}%`);
        
        if (item.content_type === 'general_info') {
          console.log(`Title: ${item.content.title}`);
        } else if (item.content_type === 'project') {
          console.log(`Name: ${item.content.name}`);
        }
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error in testHybridSearch:', error);
    return false;
  }
}

// Run the test
testHybridSearch()
  .then(success => {
    if (success) {
      console.log('\n✅ Hybrid search function is working properly!');
    } else {
      console.log('\n❌ Hybrid search function is not working correctly.');
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
  }); 