import { supabaseAdmin } from '../lib/supabase-admin'

async function inspectDatabase() {
  try {
    // Get all tables
    console.log('Fetching database structure...\n')
    const { data: tables, error: tablesError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) throw tablesError
    
    // For each table, get its structure and sample data
    for (const table of tables) {
      const tableName = table.table_name
      console.log(`\n=== Table: ${tableName} ===`)
      
      // Get table structure
      const { data: columns, error: columnsError } = await supabaseAdmin
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable')
        .eq('table_schema', 'public')
        .eq('table_name', tableName)
      
      if (columnsError) throw columnsError
      
      console.log('\nColumns:')
      columns.forEach(col => {
        console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`)
      })
      
      // Get sample data
      const { data: records, error: recordsError } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (recordsError) throw recordsError
      
      console.log('\nSample data:')
      console.log(records)
      
      // Get record count
      const { count, error: countError } = await supabaseAdmin
        .from(tableName)
        .select('*', { count: 'exact', head: true })
      
      if (countError) throw countError
      
      console.log(`\nTotal records: ${count}`)
    }
  } catch (error) {
    console.error('Error inspecting database:', error)
  }
}

inspectDatabase() 