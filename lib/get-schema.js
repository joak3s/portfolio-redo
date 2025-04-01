import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTableInfo() {
  // Get the projects table structure
  const { data: projectsData, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .limit(1);

  if (projectsError) {
    console.error('Error fetching projects data:', projectsError);
  } else if (projectsData && projectsData.length > 0) {
    console.log('Projects table columns:', Object.keys(projectsData[0]));
    console.log('Sample record:', projectsData[0]);
  } else {
    console.log('No projects found');
  }

  // Get the general_info table structure
  const { data: generalInfoData, error: generalInfoError } = await supabase
    .from('general_info')
    .select('*')
    .limit(1);

  if (generalInfoError) {
    console.error('Error fetching general_info data:', generalInfoError);
  } else if (generalInfoData && generalInfoData.length > 0) {
    console.log('\nGeneral info table columns:', Object.keys(generalInfoData[0]));
    console.log('Sample record:', generalInfoData[0]);
  } else {
    console.log('No general_info records found');
  }

  // Try running a simple query to understand error details
  try {
    const { data: testData, error: testError } = await supabase
      .rpc('hybrid_search', {
        query_embedding: Array(1536).fill(0),
        query_text: 'test',
        match_threshold: 0.1,
        match_count: 1
      });

    if (testError) {
      console.error('\nError testing hybrid_search function:', testError);
    } else {
      console.log('\nSuccessfully queried hybrid_search:', testData);
    }
  } catch (error) {
    console.error('\nException running hybrid_search:', error);
  }
}

getTableInfo()
  .catch(console.error)
  .finally(() => process.exit(0)); 