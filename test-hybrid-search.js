import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { OpenAI } from 'openai';

// Load environment variables
dotenv.config();
dotenv.config({ path: '.env.local' });

// Print environment variable status (without exposing values)
console.log('Environment variables status:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Available ✓' : 'Missing ✗');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Available ✓' : 'Missing ✗');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Available ✓' : 'Missing ✗');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

if (!supabaseUrl || !supabaseKey || !openaiKey) {
  console.error('Missing required environment variables. Please check your .env files.');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ apiKey: openaiKey });

// Function to generate embeddings
async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// Function to directly test hybrid_search function
async function testHybridSearch(queryText) {
  try {
    console.log(`Testing hybrid search with query: "${queryText}"`);
    
    // Generate embedding for the query
    console.log('Generating embedding...');
    const embedding = await getEmbedding(queryText);
    console.log('Embedding generated successfully');
    
    // Call the hybrid_search function directly
    console.log('Calling hybrid_search function...');
    const { data, error } = await supabase.rpc('hybrid_search', {
      query_embedding: embedding,
      query_text: queryText,
      match_threshold: 0.5,
      match_count: 10
    });
    
    if (error) {
      console.error('Error calling hybrid_search:', error);
      
      // Try running a simple diagnostic query to check database structure
      console.log('\nRunning diagnostic database queries...');
      
      // Check embeddings table structure
      const { data: embeddingsData, error: embeddingsError } = await supabase
        .from('embeddings')
        .select('*')
        .limit(1);
      
      if (embeddingsError) {
        console.error('Error checking embeddings table:', embeddingsError);
      } else {
        console.log('Embeddings table exists and has structure:', Object.keys(embeddingsData[0]));
      }
      
      // Check general_info table structure
      const { data: generalInfoData, error: generalInfoError } = await supabase
        .from('general_info')
        .select('*')
        .limit(1);
      
      if (generalInfoError) {
        console.error('Error checking general_info table:', generalInfoError);
      } else {
        console.log('General info table exists and has structure:', Object.keys(generalInfoData[0]));
      }
      
      return null;
    }
    
    console.log(`Found ${data?.length || 0} matching results`);
    
    // Print detailed results
    if (data && data.length > 0) {
      data.forEach((item, index) => {
        console.log(`\nResult ${index + 1}:`);
        console.log(`Content Type: ${item.content_type}`);
        console.log(`Similarity: ${(item.similarity * 100).toFixed(1)}%`);
        
        if (item.content_type === 'general_info') {
          console.log(`Title: ${item.content.title}`);
          console.log(`Content: ${item.content.content?.substring(0, 100)}...`);
        } else if (item.content_type === 'project') {
          console.log(`Name: ${item.content.name}`);
          console.log(`Summary: ${item.content.summary?.substring(0, 100)}...`);
        }
      });
    } else {
      console.log('No results found');
    }
    
    return data;
  } catch (error) {
    console.error('Error in testHybridSearch:', error);
    return null;
  }
}

// Function to try text-only search as fallback
async function testTextOnlySearch(queryText) {
  try {
    console.log(`\nTesting text-only search with query: "${queryText}"`);
    
    // Directly query the general_info table
    const { data: generalInfoData, error: generalInfoError } = await supabase
      .from('general_info')
      .select('*')
      .or(`title.ilike.%${queryText}%,content.ilike.%${queryText}%,category.ilike.%${queryText}%`)
      .limit(5);
    
    if (generalInfoError) {
      console.error('Error with text-only search on general_info:', generalInfoError);
    } else {
      console.log(`Found ${generalInfoData?.length || 0} matches in general_info table`);
      
      if (generalInfoData && generalInfoData.length > 0) {
        generalInfoData.forEach((item, index) => {
          console.log(`\nText Match ${index + 1}:`);
          console.log(`Title: ${item.title}`);
          console.log(`Content: ${item.content?.substring(0, 100)}...`);
        });
      }
    }
    
    return generalInfoData;
  } catch (error) {
    console.error('Error in testTextOnlySearch:', error);
    return null;
  }
}

// Main test function
async function runTests() {
  // Define test queries
  const queries = [
    "What are Jordan's web development skills?",
    "Tell me about Jordan's UX/UI skills",
    "What backend technologies does Jordan use?",
    "skills"
  ];
  
  // Run tests for each query
  for (const query of queries) {
    console.log('\n' + '='.repeat(50));
    console.log(`TESTING QUERY: "${query}"`);
    console.log('='.repeat(50));
    
    // Test hybrid search
    const hybridResults = await testHybridSearch(query);
    
    // If hybrid search fails, try text-only search
    if (!hybridResults || hybridResults.length === 0) {
      await testTextOnlySearch(query);
    }
    
    console.log('\n');
  }
}

// Run the tests
runTests()
  .then(() => {
    console.log('All tests completed');
  })
  .catch((error) => {
    console.error('Error running tests:', error);
  }); 