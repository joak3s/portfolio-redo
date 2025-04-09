/**
 * Test Query Optimization Script
 * 
 * This script tests the performance improvements in the query intent analysis
 * and response times for both project and general queries
 */

import fetch from 'node-fetch';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Get API URL from environment or use localhost default
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Test queries
const projectQueries = [
  "Tell me about the Portfolio website project",
  "What was Schmitt Automotive?",
  "Tell me about Modern Day Sniper",
  "Swyvvl project details",
  "Explain the Precision Rifle Training project"
];

const generalQueries = [
  "What technical skills does Jordan have?", 
  "Tell me about Jordan's design approach",
  "What is Jordan's background?",
  "What tools and technologies does Jordan use?",
  "Jordan's education and experience"
];

async function testQuery(query, queryType) {
  console.log(`\n🧪 Testing ${queryType} query: "${query}"`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  
  const startTime = Date.now();
  
  try {
    // Generate a unique session key for this test
    const sessionKey = `test_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Call the API
    const response = await fetch(`${apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: query,
        sessionKey,
        includeHistory: false
      })
    });
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    // Process response
    if (!response.ok) {
      console.log(`❌ Error: ${response.status} (${executionTime}ms)`);
      const errorData = await response.json().catch(() => ({}));
      console.log(`Error details: ${JSON.stringify(errorData)}`);
      return { success: false, time: executionTime };
    }
    
    const data = await response.json();
    
    // Log performance metrics
    console.log(`✅ Response received in ${executionTime}ms`);
    console.log(`🔍 Found project: ${data.relevant_project ? 'YES' : 'NO'}`);
    console.log(`🖼️ Project image: ${data.project_image ? 'YES' : 'NO'}`);
    
    // Log brief response summary
    console.log(`\nResponse preview (first 100 chars):`);
    console.log(`"${data.response?.substring(0, 100)}..."`);
    
    return { 
      success: true, 
      time: executionTime,
      hasProject: !!data.relevant_project,
      hasImage: !!data.project_image
    };
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return { success: false, time: 0 };
  }
}

async function runTests() {
  console.log('🚀 Starting query optimization tests');
  console.log('API URL:', apiUrl);
  
  // Results storage
  const results = {
    project: { times: [], successes: 0, failures: 0, withImages: 0 },
    general: { times: [], successes: 0, failures: 0, withImages: 0 }
  };
  
  // Test project queries
  console.log('\n📊 TESTING PROJECT QUERIES');
  console.log('═════════════════════════════════════════════════════');
  
  for (const query of projectQueries) {
    const result = await testQuery(query, 'project');
    
    if (result.success) {
      results.project.times.push(result.time);
      results.project.successes++;
      if (result.hasImage) results.project.withImages++;
    } else {
      results.project.failures++;
    }
  }
  
  // Test general queries
  console.log('\n📊 TESTING GENERAL QUERIES');
  console.log('═════════════════════════════════════════════════════');
  
  for (const query of generalQueries) {
    const result = await testQuery(query, 'general');
    
    if (result.success) {
      results.general.times.push(result.time);
      results.general.successes++;
      if (result.hasImage) results.general.withImages++;
    } else {
      results.general.failures++;
    }
  }
  
  // Calculate statistics
  function calculateStats(times) {
    if (times.length === 0) return { avg: 0, min: 0, max: 0 };
    const sum = times.reduce((a, b) => a + b, 0);
    return {
      avg: Math.round(sum / times.length),
      min: Math.min(...times),
      max: Math.max(...times)
    };
  }
  
  const projectStats = calculateStats(results.project.times);
  const generalStats = calculateStats(results.general.times);
  
  // Report results
  console.log('\n📈 TEST RESULTS');
  console.log('═════════════════════════════════════════════════════');
  
  console.log('\nProject Queries:');
  console.log(`Success: ${results.project.successes}/${projectQueries.length}`);
  console.log(`With images: ${results.project.withImages}/${results.project.successes}`);
  console.log(`Response times: avg ${projectStats.avg}ms, min ${projectStats.min}ms, max ${projectStats.max}ms`);
  
  console.log('\nGeneral Queries:');
  console.log(`Success: ${results.general.successes}/${generalQueries.length}`);
  console.log(`With images: ${results.general.withImages}/${results.general.successes}`);
  console.log(`Response times: avg ${generalStats.avg}ms, min ${generalStats.min}ms, max ${generalStats.max}ms`);
  
  // Overall performance improvement
  if (results.general.times.length > 0 && results.project.times.length > 0) {
    const improvement = Math.round(((projectStats.avg - generalStats.avg) / projectStats.avg) * 100);
    console.log(`\n🚀 Performance improvement for general queries: ${improvement > 0 ? '+' : ''}${improvement}%`);
  }
  
  console.log('\n✅ Testing complete');
}

runTests().catch(console.error); 