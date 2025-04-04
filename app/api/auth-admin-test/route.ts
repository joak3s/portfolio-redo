import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
    console.log(`Admin auth test attempt: ${emailPrefix}...@${emailDomain}`);
    
    // Create a direct client (not using any middleware/cookies)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
    
    // Log the URL and key being used (first few chars only for security)
    console.log(`Using Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`Using Anon Key: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 5)}...`);
    
    // Try authentication directly
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      console.error('Admin auth test error:', {
        message: error.message,
        status: error.status,
        name: error.name,
      });
      
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 }
      );
    }
    
    // Success - return user info and session
    console.log('Admin auth test successful for', email);
    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      },
      session: {
        access_token: data.session?.access_token.substring(0, 10) + '...',
        expires_at: data.session?.expires_at,
      }
    });
    
  } catch (error) {
    console.error('Admin auth test error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
} 