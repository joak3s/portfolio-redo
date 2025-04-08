import { prisma } from '../lib/prisma.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function cleanupDatabase() {
  try {
    console.log('Starting database cleanup...');
    
    // Step 1: Check redundant views
    console.log('Checking for redundant views...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Drop projects_with_tags view if it exists
        IF EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_schema = 'public' 
          AND table_name = 'projects_with_tags'
        ) THEN
          DROP VIEW public.projects_with_tags;
          RAISE NOTICE 'Dropped projects_with_tags view';
        ELSE
          RAISE NOTICE 'projects_with_tags view not found';
        END IF;
        
        -- Drop projects_with_tools view if it exists
        IF EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_schema = 'public' 
          AND table_name = 'projects_with_tools'
        ) THEN
          DROP VIEW public.projects_with_tools;
          RAISE NOTICE 'Dropped projects_with_tools view';
        ELSE
          RAISE NOTICE 'projects_with_tools view not found';
        END IF;
        
        -- Drop projects_summary view if it exists
        IF EXISTS (
          SELECT FROM information_schema.views 
          WHERE table_schema = 'public' 
          AND table_name = 'projects_summary'
        ) THEN
          DROP VIEW public.projects_summary;
          RAISE NOTICE 'Dropped projects_summary view';
        ELSE
          RAISE NOTICE 'projects_summary view not found';
        END IF;
      END $$;
    `);
    
    console.log('Redundant views cleanup completed.');
    
    // Step 2: Update column types if needed
    console.log('Updating column types...');
    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        -- Check if featured column is integer and convert to boolean if needed
        IF EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'projects'
          AND column_name = 'featured'
          AND data_type = 'integer'
        ) THEN
          ALTER TABLE public.projects 
          ALTER COLUMN featured TYPE boolean 
          USING CASE WHEN featured = 0 THEN false ELSE true END;
          RAISE NOTICE 'Converted featured column from integer to boolean';
        END IF;
      END $$;
    `);
    
    console.log('Column types updated.');
    
    console.log('Database cleanup completed successfully!');
  } catch (error) {
    console.error('Error during database cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupDatabase(); 