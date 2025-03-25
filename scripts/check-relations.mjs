import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

// Load environment variables from .env.local
const __dirname = fileURLToPath(new URL('.', import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function checkRelations() {
  try {
    // Check project_tools junction table
    const { data: projectTools, error: projectToolsError } = await supabase
      .from('project_tools')
      .select(`
        *,
        projects (id, title),
        tools (id, name)
      `)
    
    if (projectToolsError) {
      console.error('Error fetching project_tools:', projectToolsError)
    } else {
      console.log('\n=== Project-Tools Relations ===')
      console.log(`Found ${projectTools.length} project-tool relationships`)
      if (projectTools.length > 0) {
        console.log('Sample relationship:', JSON.stringify(projectTools[0], null, 2))
      }
    }

    // Check project_tags junction table
    const { data: projectTags, error: projectTagsError } = await supabase
      .from('project_tags')
      .select(`
        *,
        projects (id, title),
        tags (id, name)
      `)
    
    if (projectTagsError) {
      console.error('Error fetching project_tags:', projectTagsError)
    } else {
      console.log('\n=== Project-Tags Relations ===')
      console.log(`Found ${projectTags.length} project-tag relationships`)
      if (projectTags.length > 0) {
        console.log('Sample relationship:', JSON.stringify(projectTags[0], null, 2))
      }
    }

    // Check a single project with all its relations
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        *,
        project_images (*),
        project_tools (
          tools (*)
        ),
        project_tags (
          tags (*)
        )
      `)
      .limit(1)
      .single()
    
    if (projectError) {
      console.error('Error fetching project with relations:', projectError)
    } else {
      console.log('\n=== Sample Project with Relations ===')
      console.log(JSON.stringify(project, null, 2))
    }

  } catch (error) {
    console.error('Error checking relations:', error)
  }
}

checkRelations() 