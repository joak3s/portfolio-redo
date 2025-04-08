// Test script to verify Prisma connection with Supabase
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Testing Prisma connection to Supabase...');
    
    // Test query to get all projects
    const projects = await prisma.projects.findMany({
      take: 3, // Limit to 3 results
      include: {
        project_images: true,
        project_tags: {
          include: {
            tags: true
          }
        },
        project_tools: {
          include: {
            tools: true
          }
        }
      }
    });
    
    console.log('Successfully connected to Supabase with Prisma!');
    console.log(`Found ${projects.length} projects`);
    
    // Output project details
    projects.forEach(project => {
      console.log(`\nProject: ${project.title} (${project.slug})`);
      console.log(`- Images: ${project.project_images.length}`);
      console.log(`- Tags: ${project.project_tags.map(pt => pt.tags.name).join(', ')}`);
      console.log(`- Tools: ${project.project_tools.map(pt => pt.tools.name).join(', ')}`);
    });
    
  } catch (error) {
    console.error('Error connecting to the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 