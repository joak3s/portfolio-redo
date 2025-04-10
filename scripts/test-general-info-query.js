#!/usr/bin/env node

/**
 * Script to test the chat API with general_info queries
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env.local') });

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Predefined queries to test
const testQueries = [
  "Tell me about Jordan's background",
  "What skills does Jordan have?",
  "What is Jordan's education?",
  "What is Jordan's design philosophy?",
  "What technical skills does Jordan have?",
  "Tell me about Jordan's experience",
  "What is Jordan's vision for AI?",
  "Tell me about Jordan's AI vision"
];

// Function to directly test the general_info lookup
async function testDirectLookup(query) {
  console.log(`\nDIRECT LOOKUP TEST: "${query}"`);
  
  // First try to find category-specific information
  let categoryMatch = null;
  
  // Look for category indicators in the query
  const categoryKeywords = {
    'Skills': ['skills', 'technologies', 'tech stack', 'languages', 'frameworks'],
    'Background': ['background', 'history', 'professional', 'career'],
    'Education': ['education', 'degree', 'university', 'study', 'academic'],
    'Philosophy': ['philosophy', 'approach', 'principles', 'believes', 'design thinking'],
    'Experience': ['experience', 'work history', 'professional', 'projects'],
    'Vision': ['vision', 'future', 'ai', 'artificial intelligence'],
    'Values': ['values', 'accessibility', 'commitment', 'priorities'],
    'Methodology': ['methodology', 'workflow', 'process', 'approach'],
    'Career': ['career', 'work', 'professional'],
    'Personal Interests': ['interests', 'personal', 'hobbies', 'rugby', 'sports']
  };
  
  // Check for category matches in the query
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
      categoryMatch = category;
      break;
    }
  }
  
  let queryBuilder = supabase
    .from('general_info')
    .select('*');
    
  // If we found a category match, prioritize that category
  if (categoryMatch) {
    console.log(`Found category match: ${categoryMatch}`);
    queryBuilder = queryBuilder
      .eq('category', categoryMatch)
      .limit(3);
  } else {
    console.log('No specific category match found, using general search');
    queryBuilder = queryBuilder
      .limit(3);
  }
  
  const { data: generalInfo, error } = await queryBuilder;
    
  if (error) {
    console.error('Error in direct general_info lookup:', error);
    return null;
  }
  
  if (generalInfo && generalInfo.length > 0) {
    console.log(`Found ${generalInfo.length} general info entries directly:`);
    generalInfo.forEach(info => {
      console.log(`- ${info.title} (${info.category}): ${info.content.substring(0, 50)}...`);
    });
    return generalInfo;
  } else {
    console.log('No matching general_info records found');
    return null;
  }
}

// Function to test the API endpoint
async function testApiEndpoint(query) {
  console.log(`\nAPI ENDPOINT TEST: "${query}"`);
  
  try {
    // Define the request URL (use your actual URL)
    const url = 'http://localhost:3000/api/chat';
    
    // Make the API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: query,
        sessionKey: `test-${Date.now()}`, // Unique session key for each test
        includeHistory: false
      })
    });
    
    // Parse the response
    const data = await response.json();
    
    // Log the results
    console.log('API Response Status:', response.status);
    console.log('Response Data Type:', data.type);
    console.log('Message Content Sample:', data.content.substring(0, 100) + '...');
    console.log('Response Context:', data.context ? data.context.substring(0, 100) + '...' : 'No context');
    
    return data;
  } catch (error) {
    console.error('Error testing API endpoint:', error);
    return null;
  }
}

// Main function to run the tests
async function main() {
  console.log('Starting general_info query tests...');
  
  // First, let's check what records we have
  const { data: allRecords, error } = await supabase
    .from('general_info')
    .select('category, title');
  
  if (error) {
    console.error('Error retrieving records:', error);
    process.exit(1);
  }
  
  console.log(`Found ${allRecords.length} total general_info records`);
  
  // Group records by category
  const categories = {};
  allRecords.forEach(record => {
    const category = record.category || 'unknown';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(record.title);
  });
  
  console.log('\nCategories and record counts:');
  Object.entries(categories).forEach(([category, titles]) => {
    console.log(`- ${category}: ${titles.length} records`);
  });
  
  // Run the direct lookup tests
  console.log('\n===============================');
  console.log('RUNNING DIRECT LOOKUP TESTS');
  console.log('===============================');
  
  for (const query of testQueries) {
    await testDirectLookup(query);
  }
  
  // Run the API endpoint tests if it's available
  const runApiTests = false; // Set to true if you want to test against a running API
  
  if (runApiTests) {
    console.log('\n===============================');
    console.log('RUNNING API ENDPOINT TESTS');
    console.log('===============================');
    
    for (const query of testQueries) {
      await testApiEndpoint(query);
    }
  }
  
  console.log('\nTests completed successfully!');
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 