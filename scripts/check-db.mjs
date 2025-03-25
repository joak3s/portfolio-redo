import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from .env.local
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDatabase() {
  try {
    console.log('Checking database schema...\n')

    // Check projects table
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .limit(1)

    if (projectsError) {
      console.error('Error checking projects table:', projectsError)
    } else {
      console.log('✓ Projects table exists')
    }

    // Check project_images table
    const { data: images, error: imagesError } = await supabase
      .from('project_images')
      .select('*')
      .limit(1)

    if (imagesError) {
      console.error('Error checking project_images table:', imagesError)
    } else {
      console.log('✓ Project_images table exists')
    }

    // Check tools table
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('*')
      .limit(1)

    if (toolsError) {
      console.error('Error checking tools table:', toolsError)
    } else {
      console.log('✓ Tools table exists')
    }

    // Check project_tools table
    const { data: projectTools, error: projectToolsError } = await supabase
      .from('project_tools')
      .select('*')
      .limit(1)

    if (projectToolsError) {
      console.error('Error checking project_tools table:', projectToolsError)
    } else {
      console.log('✓ Project_tools table exists')
    }

    // Check tags table
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('*')
      .limit(1)

    if (tagsError) {
      console.error('Error checking tags table:', tagsError)
    } else {
      console.log('✓ Tags table exists')
    }

    // Check project_tags table
    const { data: projectTags, error: projectTagsError } = await supabase
      .from('project_tags')
      .select('*')
      .limit(1)

    if (projectTagsError) {
      console.error('Error checking project_tags table:', projectTagsError)
    } else {
      console.log('✓ Project_tags table exists')
    }

    // Try to fetch a project with all relations to test relationships
    const { data: projectWithRelations, error: relationsError } = await supabase
      .from('projects')
      .select(`
        *,
        project_images (*)
      `)
      .limit(1)
      .single()

    if (relationsError) {
      console.error('\nError checking relationships:', relationsError)
    } else {
      console.log('\n✓ Project-Images relationship works')
    }

    // Check tools relationship separately
    const { error: toolsRelationError } = await supabase
      .from('project_tools')
      .select(`
        project_id,
        tools (*)
      `)
      .limit(1)

    if (toolsRelationError) {
      console.error('\nError checking project-tools relationship:', toolsRelationError)
      console.log('\nYou need to set up the following foreign key relationships:')
      console.log('1. project_tools.project_id -> projects.id')
      console.log('2. project_tools.tool_id -> tools.id')
    } else {
      console.log('✓ Project-Tools relationship works')
    }

    // Check tags relationship separately
    const { error: tagsRelationError } = await supabase
      .from('project_tags')
      .select(`
        project_id,
        tags (*)
      `)
      .limit(1)

    if (tagsRelationError) {
      console.error('\nError checking project-tags relationship:', tagsRelationError)
      console.log('\nYou need to set up the following foreign key relationships:')
      console.log('1. project_tags.project_id -> projects.id')
      console.log('2. project_tags.tag_id -> tags.id')
    } else {
      console.log('✓ Project-Tags relationship works')
    }

  } catch (error) {
    console.error('Error checking database:', error)
  }
}

checkDatabase() 