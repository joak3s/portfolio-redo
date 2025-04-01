import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';

// Load environment variables from both .env and .env.local
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

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: openaiKey,
});

async function getEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 1536
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

// Function to check for existing embeddings to avoid duplicates
async function checkExistingEmbeddings(contentIds) {
  try {
    const { data, error } = await supabase
      .from('embeddings')
      .select('content_id')
      .in('content_id', contentIds)
      .eq('content_type', 'project');
    
    if (error) {
      console.error('Error checking existing project embeddings:', error);
      return [];
    }
    
    const existingIds = data.map(item => item.content_id);
    console.log(`Found ${existingIds.length} existing project embeddings`);
    return existingIds;
  } catch (error) {
    console.error('Error checking existing project embeddings:', error);
    return [];
  }
}

async function generateEmbeddingsForProjects() {
  try {
    // Get all projects with related data
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        project_tools (
          tool:tools (*)
        ),
        project_tags (
          tag:tags (*)
        )
      `);
    
    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }
    
    console.log(`Found ${projects.length} projects to process`);
    
    // Get content IDs for all projects
    const contentIds = projects.map(project => project.id);
    
    // Check which projects already have embeddings
    const existingEmbeddingIds = await checkExistingEmbeddings(contentIds);
    
    // Track successes and failures
    const results = {
      created: [],
      updated: [],
      failed: []
    };
    
    for (const project of projects) {
      console.log(`Processing project: "${project.title}" (ID: ${project.id})`);
      
      try {
        // Extract tools and tags
        const tools = project.project_tools?.map(pt => pt.tool?.name).filter(Boolean) || [];
        const tags = project.project_tags?.map(pt => pt.tag?.name).filter(Boolean) || [];
        
        // Combine relevant fields for embedding
        const textToEmbed = `Project: ${project.title}
Slug: ${project.slug || ''}
Description: ${project.description || ''}
Summary: ${project.summary || ''}
Tools: ${tools.join(', ')}
Tags: ${tags.join(', ')}
Features: ${(project.features || []).join('\n- ')}`;
        
        // Generate embedding
        const embedding = await getEmbedding(textToEmbed);
        
        // Prepare embedding data
        const embeddingData = {
          content_id: project.id,
          content_type: 'project',
          embedding: embedding,
          embedding_model: 'text-embedding-3-small',
          chunk_text: project.description || project.summary || '',
          chunk_metadata: {
            title: project.title,
            slug: project.slug,
            tools: tools,
            tags: tags,
            featured: project.featured || false
          }
        };
        
        let operation;
        let error;
        
        // Check if this project already has an embedding
        if (existingEmbeddingIds.includes(project.id)) {
          // Update existing embedding
          const { error: updateError } = await supabase
            .from('embeddings')
            .update(embeddingData)
            .eq('content_id', project.id)
            .eq('content_type', 'project');
          
          error = updateError;
          operation = 'updated';
        } else {
          // Insert new embedding
          const { error: insertError } = await supabase
            .from('embeddings')
            .insert(embeddingData);
          
          error = insertError;
          operation = 'created';
        }
        
        if (error) {
          console.error(`Error ${operation === 'updated' ? 'updating' : 'creating'} embedding for "${project.title}":`, error);
          results.failed.push({ id: project.id, title: project.title, error: error.message });
        } else {
          console.log(`✓ Successfully ${operation} embedding for: "${project.title}"`);
          results[operation].push({ id: project.id, title: project.title });
        }
      } catch (error) {
        console.error(`Error processing "${project.title}":`, error);
        results.failed.push({ id: project.id, title: project.title, error: error.message });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('Projects embedding generation completed!');
    console.log(`Created: ${results.created.length}, Updated: ${results.updated.length}, Failed: ${results.failed.length}`);
    
    // Save results to file
    writeFileSync('projects_embedding_results.json', JSON.stringify(results, null, 2));
    
    return results;
  } catch (error) {
    console.error('Error generating embeddings for projects:', error);
    return { created: [], updated: [], failed: [] };
  }
}

// Run the function
generateEmbeddingsForProjects()
  .then(() => {
    console.log('Process completed successfully!');
  })
  .catch(error => {
    console.error('Error running embeddings generation:', error);
  }); 