import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToSupabase } from '@/app/actions/upload-image';

/**
 * API route to handle image uploads
 * This is a client-side API that calls our server action
 */
export async function POST(request: NextRequest) {
  try {
    console.log('API route: Processing image upload');
    
    // Get the FormData from the request
    const formData = await request.formData();
    
    // Ensure we have a file
    const file = formData.get('file');
    if (!file) {
      console.error('API route: No file provided in request');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Use our existing server action to upload the file
    try {
      const imageUrl = await uploadImageToSupabase(formData);
      console.log('API route: Upload successful, returning URL');
      
      // Return the URL to the client
      return NextResponse.json({ url: imageUrl });
    } catch (error: any) {
      console.error('API route: Error during upload:', error);
      return NextResponse.json(
        { error: error.message || 'Error uploading file' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('API route: Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 