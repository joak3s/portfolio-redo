import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }
    
    // Log the attempt (redact most of email for privacy)
    const emailPrefix = email.substring(0, 3);
    const emailDomain = email.split('@')[1] || '';
    console.log(`Auth test attempt: ${emailPrefix}...@${emailDomain}`);
    console.log(`Email length: ${email.length}, Password length: ${password.length}`);
    
    // Create server-side Supabase client
    const supabase = await createServerSupabaseClient();
    
    // Log the URL being used
    console.log(`Using Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    
    // Try authentication
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Auth test error:', {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    
    // Success - return minimal user info
    console.log('Auth test successful for', email);
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      }
    });
    
  } catch (error) {
    console.error('Auth test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 