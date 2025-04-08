#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const apiDir = path.join(rootDir, 'app/api');

// Function to recursively find files in a directory
function findFiles(dir, ext, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findFiles(filePath, ext, fileList);
    } else if (path.extname(file) === ext) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Function to update file content
function updateFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Check if the file imports supabaseAdmin
    if (content.includes('import { supabaseAdmin }') || content.includes('import {supabaseAdmin}')) {
      console.log(`Updating imports in ${filePath}`);
      
      // Replace the import statement
      content = content.replace(
        /import\s+\{\s*supabaseAdmin\s*\}\s+from\s+['"]@\/lib\/supabase-admin['"]/g,
        `import { getAdminClient } from '@/lib/supabase-admin'`
      );
      
      // Find all function exports
      const functionRegex = /export\s+async\s+function\s+\w+\s*\([^{]*\)\s*{/g;
      const functionMatches = [...content.matchAll(functionRegex)];
      
      if (functionMatches.length > 0) {
        // Process each function match from the end to avoid offset issues
        for (let i = functionMatches.length - 1; i >= 0; i--) {
          const match = functionMatches[i];
          const functionStart = match.index;
          const functionHeader = match[0];
          const openBraceIndex = functionStart + functionHeader.length;
          
          // Find the first non-whitespace character after the opening brace
          const afterBraceContent = content.substring(openBraceIndex);
          const firstCodeMatch = afterBraceContent.match(/^\s*([^\s])/);
          
          // If the function body contains supabaseAdmin but not getAdminClient
          if (
            afterBraceContent.includes('supabaseAdmin') && 
            !afterBraceContent.includes('await getAdminClient')
          ) {
            // Insert the initialization at the beginning of the function body
            // Right after the opening brace and any whitespace
            const insertPos = openBraceIndex + (firstCodeMatch ? firstCodeMatch.index : 0);
            const indent = '  '; // Standard indent
            const toInsert = `\n${indent}const supabaseAdmin = await getAdminClient();\n${indent}`;
            
            content = content.substring(0, insertPos) + toInsert + content.substring(insertPos);
          }
        }
      }
      
      // Write updated content back to file
      fs.writeFileSync(filePath, content);
      updated = true;
    }
    
    return updated;
  } catch (error) {
    console.error(`Error updating ${filePath}:`, error);
    return false;
  }
}

// Main function
async function main() {
  console.log('Searching for API route files...');
  const tsFiles = findFiles(apiDir, '.ts');
  
  console.log(`Found ${tsFiles.length} TypeScript files in API directory.`);
  
  let updatedCount = 0;
  for (const file of tsFiles) {
    const updated = updateFile(file);
    if (updated) updatedCount++;
  }
  
  console.log(`Updated ${updatedCount} files to use getAdminClient.`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
}); 