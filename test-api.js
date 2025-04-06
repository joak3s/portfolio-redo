import fetch from 'node-fetch';

async function testProjectsApi() {
  try {
    console.log('Testing /api/projects endpoint...');
    const response = await fetch('http://localhost:3000/api/projects');
    const status = response.status;
    
    console.log(`Status code: ${status}`);
    
    if (status === 200) {
      const data = await response.json();
      console.log(`Success! Found ${data.length} projects`);
      if (data.length > 0) {
        console.log(`First project: ${data[0].name}`);
      }
    } else {
      const errorData = await response.json();
      console.error('API Error:', errorData);
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testProjectsApi(); 