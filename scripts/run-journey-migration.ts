import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Note: Uses service role key for admin privileges
const supabase = createClient(supabaseUrl, supabaseKey)

// Path to migration file
const MIGRATION_FILE = path.join(process.cwd(), 'supabase', 'migrations', '20240917_journey_milestones.sql')

async function runMigration() {
  try {
    console.log('Reading migration file...')
    const sqlContent = fs.readFileSync(MIGRATION_FILE, 'utf-8')
    
    console.log('Running migration...')
    const { error } = await supabase.rpc('pgtle_install_extension_version', {
      sql_code: sqlContent
    })
    
    if (error) {
      console.error('Error running migration:', error)
      
      // Alternative approach using direct SQL query (requires service role key)
      console.log('Trying alternative approach with direct SQL...')
      const { error: sqlError } = await supabase.rpc('pg_exec', {
        sql: sqlContent
      })
      
      if (sqlError) {
        console.error('Error with direct SQL approach:', sqlError)
        console.log('\nPlease run the migration using the Supabase SQL Editor:')
        console.log('1. Go to your Supabase dashboard')
        console.log('2. Navigate to the SQL Editor')
        console.log('3. Create a new query')
        console.log('4. Copy and paste the content from:')
        console.log(`   ${MIGRATION_FILE}`)
        console.log('5. Run the query')
        return false
      }
    }
    
    console.log('Migration completed successfully!')
    return true
  } catch (error) {
    console.error('Error running migration script:', error)
    return false
  }
}

runMigration().catch(console.error) 