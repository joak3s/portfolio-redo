import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables from both .env and .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = 'https://lgtldjzglbzlmmxphfxw.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeTools() {
  try {
    console.log('Analyzing tools tables...\n')

    // Get all tools
    const { data: tools, error: toolsError } = await supabase
      .from('tools')
      .select('*')
      .order('name')

    if (toolsError) throw toolsError

    console.log('Current tools:', tools)
    console.log(`Total tools: ${tools?.length || 0}\n`)

    // Get all project_tools
    const { data: projectTools, error: projectToolsError } = await supabase
      .from('project_tools')
      .select(`
        *,
        project:projects(title),
        tool:tools(name)
      `)

    if (projectToolsError) throw projectToolsError

    console.log('Current project_tools relationships:', projectTools)
    console.log(`Total project_tools relationships: ${projectTools?.length || 0}\n`)

    // Find duplicate tools (case-insensitive)
    const toolMap = new Map()
    const duplicates = []

    tools?.forEach(tool => {
      const lowerName = tool.name.toLowerCase()
      if (toolMap.has(lowerName)) {
        duplicates.push({
          original: toolMap.get(lowerName),
          duplicate: tool
        })
      } else {
        toolMap.set(lowerName, tool)
      }
    })

    console.log('Found duplicate tools:', duplicates)
    console.log(`Total duplicates: ${duplicates.length}\n`)

    // Find orphaned project_tools entries
    const toolIds = new Set(tools?.map(t => t.id))
    const orphanedEntries = projectTools?.filter(pt => !toolIds.has(pt.tool_id))

    console.log('Found orphaned project_tools entries:', orphanedEntries)
    console.log(`Total orphaned entries: ${orphanedEntries?.length || 0}\n`)

    // Ask for confirmation before cleaning up
    console.log('Would you like to clean up these issues? (yes/no)')
    
    return {
      tools,
      projectTools,
      duplicates,
      orphanedEntries
    }

  } catch (error) {
    console.error('Error analyzing tools:', error)
    throw error
  }
}

async function cleanupTools(analysis) {
  try {
    console.log('\nStarting cleanup...\n')

    // 1. Clean up duplicate tools
    for (const { original, duplicate } of analysis.duplicates) {
      console.log(`Processing duplicate: ${duplicate.name}`)

      // Update project_tools to point to the original tool
      const { error: updateError } = await supabase
        .from('project_tools')
        .update({ tool_id: original.id })
        .eq('tool_id', duplicate.id)

      if (updateError) {
        console.error(`Error updating references for tool ${duplicate.name}:`, updateError)
        continue
      }

      // Delete the duplicate tool
      const { error: deleteError } = await supabase
        .from('tools')
        .delete()
        .eq('id', duplicate.id)

      if (deleteError) {
        console.error(`Error deleting duplicate tool ${duplicate.name}:`, deleteError)
        continue
      }

      console.log(`Successfully cleaned up duplicate: ${duplicate.name}\n`)
    }

    // 2. Clean up orphaned project_tools entries
    if (analysis.orphanedEntries?.length > 0) {
      console.log('Cleaning up orphaned project_tools entries...')

      const { error: cleanupError } = await supabase
        .from('project_tools')
        .delete()
        .in(
          'id',
          analysis.orphanedEntries.map(e => e.id)
        )

      if (cleanupError) {
        console.error('Error cleaning up orphaned entries:', cleanupError)
      } else {
        console.log(`Successfully cleaned up ${analysis.orphanedEntries.length} orphaned entries\n`)
      }
    }

    // 3. Verify final state
    const { data: finalTools, error: finalToolsError } = await supabase
      .from('tools')
      .select('*')
      .order('name')

    if (finalToolsError) throw finalToolsError

    const { data: finalProjectTools, error: finalProjectToolsError } = await supabase
      .from('project_tools')
      .select(`
        *,
        project:projects(title),
        tool:tools(name)
      `)

    if (finalProjectToolsError) throw finalProjectToolsError

    console.log('Final state after cleanup:')
    console.log('Tools:', finalTools)
    console.log('Project Tools:', finalProjectTools)

  } catch (error) {
    console.error('Error during cleanup:', error)
    throw error
  }
}

// Run the analysis
console.log('Starting tools analysis...\n')
analyzeTools()
  .then(analysis => {
    // In a real CLI tool, we'd ask for confirmation here
    return cleanupTools(analysis)
  })
  .catch(error => {
    console.error('Script failed:', error)
    process.exit(1)
  }) 