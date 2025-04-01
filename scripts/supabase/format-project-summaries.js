import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

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

// Example of a well-formatted project summary
const SUMMARY_EXAMPLE = `Jordan spearheaded branding and web development for Kosei Performance Partners, creating a culturally resonant, responsive platform to support athlete mentorship. The goal was to build a distinct Japanese-inspired identity and a website with athlete profiles—including stats like height, weight, and eligibility—to aid international careers, while showcasing partnerships in a competitive market. Using Webflow, Jordan designed a Kanji-inspired logo and developed mobile-friendly profiles with bios, stats, and video highlights. He added a benefits table, partner logos, and a contact form to boost usability and trust, refining the solution with stakeholder feedback. The final platform featured detailed athlete profiles and engaging video content, enhancing Kosei's credibility and appeal. The Japanese-themed branding and intuitive design increased engagement, inquiries, and recognition, positioning Kosei as a trusted industry player. This project highlights Jordan's skills in branding, UX design, and web development, blending cultural elements with functional technology for impactful results.`;

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
 * Format project summaries consistently and update embeddings
 */
async function formatProjectSummaries() {
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
    
    // Create a log file to track changes
    const logFilePath = path.join(process.cwd(), 'scripts', 'supabase', 'project-summary-updates.log');
    let logContent = `Project Summary Formatting Log - ${new Date().toISOString()}\n\n`;
    
    // Process each project
    for (const project of projects) {
      try {
        console.log(`Processing project: ${project.title}`);
        
        // Skip if no summary
        if (!project.summary) {
          console.log(`Skipping project '${project.title}' (no summary available)`);
          logContent += `[SKIPPED] ${project.title} - No summary available\n`;
          continue;
        }
        
        // Create embedding text with the consistent format
        const embeddingText = `
          Project: ${project.title}
          Slug: ${project.slug}
          Summary: ${project.summary}
        `.trim();
        
        // Add to log
        logContent += `[PROCESSED] ${project.title}\n`;
        logContent += `Summary: ${project.summary}\n\n`;
        
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
            logContent += `[ERROR] Failed to update embedding for ${project.title}\n`;
          } else {
            console.log(`✅ Successfully updated embedding for project: ${project.title}`);
            logContent += `[SUCCESS] Updated embedding for ${project.title}\n`;
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
            logContent += `[ERROR] Failed to create embedding for ${project.title}\n`;
          } else {
            console.log(`✅ Successfully created embedding for project: ${project.title}`);
            logContent += `[SUCCESS] Created embedding for ${project.title}\n`;
          }
        }
        
        // Short delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error processing project ${project.title}:`, error);
        logContent += `[ERROR] ${project.title}: ${error.message}\n`;
      }
    }
    
    // Write log file
    fs.writeFileSync(logFilePath, logContent);
    console.log(`Log file created at: ${logFilePath}`);
    
    console.log('\nProject formatting and embedding update completed!');
  } catch (error) {
    console.error('Error in formatProjectSummaries:', error);
  }
}

// Run the script
formatProjectSummaries()
  .then(() => {
    console.log('Script execution completed.');
  })
  .catch(error => {
    console.error('Error executing script:', error);
    process.exit(1);
  }); 