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

/**
 * Generate an embedding for the given text
 */
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

/**
 * Update project embeddings to use the summary field
 */
async function embedProjectSummaries() {
  try {
    console.log('Fetching projects from Supabase...');
    
    // Get all projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, slug, summary');
    
    if (projectsError) {
      console.error('Error fetching projects:', projectsError);
      return;
    }
    
    console.log(`Found ${projects.length} projects to process\n`);
    
    // Process each project
    for (const project of projects) {
      try {
        // Skip if no summary
        if (!project.summary) {
          console.log(`Skipping project '${project.title}' (no summary available)`);
          continue;
        }
        
        console.log(`Processing project: ${project.title}`);
        
        // Create embedding text that includes all relevant fields
        const embeddingText = `
          Project: ${project.title}
          Slug: ${project.slug}
          Summary: ${project.summary}
        `.trim();
        
        // Generate embedding
        const embedding = await getEmbedding(embeddingText);
        
        // Check if embedding already exists for this project
        const { data: existingEmbedding, error: checkError } = await supabase
          .from('embeddings')
          .select('id')
          .eq('content_id', project.id)
          .eq('content_type', 'project')
          .maybeSingle();
        
        if (checkError) {
          console.error(`Error checking for existing embedding for project ${project.title}:`, checkError);
          continue;
        }
        
        if (existingEmbedding) {
          // Update existing embedding
          console.log(`Updating embedding for project: ${project.title}`);
          const { error: updateError } = await supabase
            .from('embeddings')
            .update({
              embedding
            })
            .eq('id', existingEmbedding.id);
          
          if (updateError) {
            console.error(`Error updating embedding for project ${project.title}:`, updateError);
          } else {
            console.log(`✅ Successfully updated embedding for project: ${project.title}`);
          }
        } else {
          // Create new embedding
          console.log(`Creating new embedding for project: ${project.title}`);
          const { error: insertError } = await supabase
            .from('embeddings')
            .insert({
              content_id: project.id,
              content_type: 'project',
              embedding
            });
          
          if (insertError) {
            console.error(`Error inserting embedding for project ${project.title}:`, insertError);
          } else {
            console.log(`✅ Successfully created embedding for project: ${project.title}`);
          }
        }
        
        // Short delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing project ${project.title}:`, error);
      }
    }
    
    console.log('\nProject embeddings update completed!');
  } catch (error) {
    console.error('Error in embedProjectSummaries:', error);
  }
}

// Run the script
embedProjectSummaries()
  .then(() => {
    console.log('Script execution completed.');
  })
  .catch(error => {
    console.error('Error executing script:', error);
    process.exit(1);
  }); 