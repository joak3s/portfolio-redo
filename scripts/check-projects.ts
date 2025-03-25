import { supabaseAdmin } from '../lib/supabase-admin'

async function checkProjects() {
  try {
    // Check projects
    const { data: projects, error: projectsError } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        project_images (*),
        project_tools (
          tool_id,
          tools (name)
        ),
        project_tags (
          tag_id,
          tags (name)
        )
      `)
    
    if (projectsError) throw projectsError
    console.log('Projects:', JSON.stringify(projects, null, 2))
    
    // Check tools
    const { data: tools, error: toolsError } = await supabaseAdmin
      .from('tools')
      .select('*')
    
    if (toolsError) throw toolsError
    console.log('\nTools:', JSON.stringify(tools, null, 2))
    
    // Check tags
    const { data: tags, error: tagsError } = await supabaseAdmin
      .from('tags')
      .select('*')
    
    if (tagsError) throw tagsError
    console.log('\nTags:', JSON.stringify(tags, null, 2))
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkProjects() 