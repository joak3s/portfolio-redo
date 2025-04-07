import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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
async function checkExistingEmbeddings(contentIds, contentType) {
  try {
    const { data, error } = await supabase
      .from('embeddings')
      .select('content_id')
      .in('content_id', contentIds)
      .eq('content_type', contentType);
    
    if (error) {
      console.error(`Error checking existing ${contentType} embeddings:`, error);
      return [];
    }
    
    const existingIds = data.map(item => item.content_id);
    console.log(`Found ${existingIds.length} existing ${contentType} embeddings`);
    return existingIds;
  } catch (error) {
    console.error(`Error checking existing ${contentType} embeddings:`, error);
    return [];
  }
}

async function generateEmbeddingsForGeneralInfo() {
  try {
    // Get all general_info records
    const { data: records, error } = await supabase
      .from('general_info')
      .select('*');
    
    if (error) {
      console.error('Error fetching general_info records:', error);
      return;
    }
    
    console.log(`Found ${records.length} general_info records to process`);
    
    // Get content IDs for all records
    const contentIds = records.map(record => record.id);
    
    // Check which records already have embeddings
    const existingEmbeddingIds = await checkExistingEmbeddings(contentIds, 'general_info');
    
    // Track successes and failures
    const results = {
      created: [],
      updated: [],
      failed: []
    };
    
    for (const record of records) {
      console.log(`Processing general_info record: "${record.title}" (ID: ${record.id})`);
      
      try {
        // Combine relevant fields for embedding with better context
        const textToEmbed = `Title: ${record.title}
Category: ${record.category || 'General'}
Content: ${record.content}
Keywords: ${(record.keywords || []).join(', ')}`;
        
        // Generate embedding
        const embedding = await getEmbedding(textToEmbed);
        
        // Prepare embedding data
        const embeddingData = {
          content_id: record.id,
          content_type: 'general_info',
          embedding: embedding,
          embedding_model: 'text-embedding-3-small',
          chunk_text: record.content,
          chunk_metadata: {
            title: record.title,
            category: record.category,
            keywords: record.keywords,
            priority: record.priority
          }
        };
        
        let operation;
        let error;
        
        // Check if this record already has an embedding
        if (existingEmbeddingIds.includes(record.id)) {
          // Update existing embedding
          const { error: updateError } = await supabase
            .from('embeddings')
            .update(embeddingData)
            .eq('content_id', record.id)
            .eq('content_type', 'general_info');
          
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
          console.error(`Error ${operation === 'updated' ? 'updating' : 'creating'} embedding for "${record.title}":`, error);
          results.failed.push({ id: record.id, title: record.title, error: error.message });
        } else {
          console.log(`✓ Successfully ${operation} embedding for: "${record.title}"`);
          results[operation].push({ id: record.id, title: record.title });
        }
      } catch (error) {
        console.error(`Error processing "${record.title}":`, error);
        results.failed.push({ id: record.id, title: record.title, error: error.message });
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('General info embedding generation completed!');
    console.log(`Created: ${results.created.length}, Updated: ${results.updated.length}, Failed: ${results.failed.length}`);
    
    // Save results to file
    writeFileSync('general_info_embedding_results.json', JSON.stringify(results, null, 2));
    
    return results;
  } catch (error) {
    console.error('Error generating embeddings for general_info:', error);
    return { created: [], updated: [], failed: [] };
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
    const existingEmbeddingIds = await checkExistingEmbeddings(contentIds, 'project');
    
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

// Main execution
async function main() {
  const contentType = process.argv[2];
  
  console.log('Starting embedding generation process...');
  
  if (!contentType || contentType === 'all') {
    // Generate embeddings for both content types
    console.log('Generating embeddings for all content types...');
    await generateEmbeddingsForGeneralInfo();
    await generateEmbeddingsForProjects();
  } else if (contentType === 'general_info') {
    // Generate embeddings for general_info only
    console.log('Generating embeddings for general_info only...');
    await generateEmbeddingsForGeneralInfo();
  } else if (contentType === 'projects') {
    // Generate embeddings for projects only
    console.log('Generating embeddings for projects only...');
    await generateEmbeddingsForProjects();
  } else {
    console.error(`Invalid content type: ${contentType}`);
    console.log('Valid options are: "all", "general_info", or "projects"');
    process.exit(1);
  }
  
  console.log('Embedding generation process completed!');
}

// Run the main function
main().catch(error => {
  console.error('Error in main execution:', error);
  process.exit(1);
}); 