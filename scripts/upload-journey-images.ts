import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const BUCKET_NAME = 'journey-images'
const IMAGE_FOLDER = path.join(process.cwd(), 'public', 'images', 'journey')

// Function to create the bucket if it doesn't exist
async function createBucketIfNotExists() {
  const { data: buckets } = await supabase.storage.listBuckets()
  
  if (!buckets?.find(bucket => bucket.name === BUCKET_NAME)) {
    console.log(`Creating bucket: ${BUCKET_NAME}`)
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: true, // Make files publicly accessible
      fileSizeLimit: 5242880, // 5MB
    })
  }
}

// Function to upload a file to Supabase Storage
async function uploadFile(filePath: string, fileName: string) {
  try {
    const fileBuffer = fs.readFileSync(filePath)
    
    // Determine the content type based on file extension
    const fileExtension = path.extname(fileName).toLowerCase()
    let contentType = 'application/octet-stream'
    
    if (fileExtension === '.jpg' || fileExtension === '.jpeg') {
      contentType = 'image/jpeg'
    } else if (fileExtension === '.png') {
      contentType = 'image/png'
    } else if (fileExtension === '.svg') {
      contentType = 'image/svg+xml'
    }
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, fileBuffer, {
        contentType,
        upsert: true,
      })
      
    if (error) {
      console.error(`Error uploading ${fileName}:`, error)
      return null
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName)
      
    console.log(`Uploaded ${fileName}: ${publicUrl}`)
    return publicUrl
  } catch (error) {
    console.error(`Error uploading ${fileName}:`, error)
    return null
  }
}

// Main function to upload all journey images
async function uploadJourneyImages() {
  console.log('Starting journey image upload process...')
  
  // Create bucket if it doesn't exist
  await createBucketIfNotExists()
  
  // Read all files in the journey folder
  const files = fs.readdirSync(IMAGE_FOLDER)
  
  // Upload each file
  const uploadPromises = files.map(async (file) => {
    const filePath = path.join(IMAGE_FOLDER, file)
    
    // Skip directories
    if (fs.statSync(filePath).isDirectory()) return null
    
    return uploadFile(filePath, file)
  })
  
  const results = await Promise.all(uploadPromises)
  const successCount = results.filter(Boolean).length
  
  console.log(`Upload complete! Successfully uploaded ${successCount}/${files.length} files.`)
  
  // Generate SQL to update the journey_milestones table with new image URLs
  console.log('\nSQL to update journey_milestones table with new image URLs:')
  
  results.forEach((url, index) => {
    if (url) {
      const fileName = path.basename(files[index])
      const fileNameWithoutExt = path.parse(fileName).name
      
      console.log(`UPDATE journey_milestones SET image = '${url}' WHERE title ILIKE '%${fileNameWithoutExt}%';`)
    }
  })
}

// Run the upload function
uploadJourneyImages().catch(console.error) 