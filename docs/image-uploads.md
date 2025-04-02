# Journey Milestone Image Uploads

This document describes the image upload functionality for journey milestones in the portfolio application.

## Overview

Journey milestones can include images that are uploaded directly to Supabase Storage. The image upload functionality allows users to:

1. Upload images from their local device
2. Use existing image URLs
3. Preview images before saving
4. Update images on existing milestones

## Implementation Details

### Storage Configuration

Images are stored in the Supabase `public` bucket in the `journey_milestones` folder. The bucket has the following configuration:

- Public access for reading images
- 5MB file size limit
- Allowed MIME types: JPEG, PNG, GIF, WEBP, SVG

### Upload Utility

The upload functionality is implemented in `lib/supabase/upload-image.ts` and provides a reusable function for uploading images to Supabase Storage. The utility:

- Validates file types and sizes
- Generates unique filenames using UUID
- Handles errors gracefully
- Returns public URLs for uploaded images

### Admin Interface

The image upload functionality is integrated into both the create and edit pages for journey milestones:

- `app/admin/journey/create/page.tsx`
- `app/admin/journey/edit/[id]/page.tsx`

Each page provides:

- A file input for selecting local images
- An alternative URL input field
- Image preview with error handling
- Clear/reset functionality

## Database Schema

The `journey_milestones` table includes an `image` column that stores the URL to the uploaded image. The schema also includes an `updated_at` column that is automatically updated when a milestone is modified.

## Usage

1. **Create Journey Milestone**:
   - Click "Choose Image File" to select a local image
   - Or enter an image URL directly
   - Preview the image before saving

2. **Edit Journey Milestone**:
   - View the existing image
   - Upload a new image or change the URL
   - Use the reset button to revert to the original image

## Security Considerations

- Storage bucket policies only allow authenticated users to upload, update, and delete images
- File size is limited to 5MB to prevent abuse
- Only specific image file types are allowed
- Public access is limited to reading images only 