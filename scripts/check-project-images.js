import { PrismaClient } from '@prisma/client';

// Create a new Prisma client instance
const prisma = new PrismaClient();

async function checkProjectImages() {
  try {
    console.log('Checking projects and their images...');
    
    // Get all projects with their images
    const projects = await prisma.projects.findMany({
      include: {
        project_images: true
      }
    });
    
    console.log(`Found ${projects.length} projects in total\n`);
    
    // Log results for each project
    projects.forEach((project, index) => {
      console.log(`[${index + 1}] Project: ${project.title} (${project.id})`);
      console.log(`    Slug: ${project.slug}`);
      console.log(`    Status: ${project.status}`);
      
      if (project.project_images && project.project_images.length > 0) {
        console.log(`    Images: ${project.project_images.length}`);
        project.project_images.forEach((image, i) => {
          console.log(`      [${i + 1}] URL: ${image.url}`);
          console.log(`          Alt: ${image.alt_text || 'N/A'}`);
        });
      } else {
        console.log('    No images found for this project');
      }
      
      console.log(''); // Empty line between projects
    });
    
    // Test the get_content_by_id function with the first project that has images
    const projectWithImages = projects.find(p => p.project_images.length > 0);
    
    if (projectWithImages) {
      console.log(`Testing get_content_by_id function with project "${projectWithImages.title}"...\n`);
      
      // Using a simple SQL query to test the function
      const result = await prisma.$queryRawUnsafe(
        `SELECT public.get_content_by_id('${projectWithImages.id}'::uuid, 'project') as project_data`
      );
      
      if (result && result[0] && result[0].project_data) {
        const projectData = result[0].project_data;
        
        console.log('Function result:');
        console.log(JSON.stringify(projectData, null, 2));
        
        console.log('\nVerifying image data:');
        console.log(`- Has image_url: ${projectData.image_url ? 'Yes ✓' : 'No ✗'}`);
        if (projectData.image_url) {
          console.log(`- Image URL: ${projectData.image_url}`);
        }
        
        console.log(`- Has gallery_images: ${projectData.gallery_images ? 'Yes ✓' : 'No ✗'}`);
        if (projectData.gallery_images && projectData.gallery_images.length > 0) {
          console.log(`- Gallery images count: ${projectData.gallery_images.length}`);
          console.log(`- First gallery image URL: ${projectData.gallery_images[0].url}`);
        }
      } else {
        console.log('Function returned no data or invalid data');
      }
    } else {
      console.log('No projects with images found to test the function');
    }
  } catch (error) {
    console.error('Error fetching projects:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkProjectImages(); 