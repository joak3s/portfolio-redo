import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/supabase-browser';
import { createServerSupabaseClient } from '@/lib/supabase-server';

// This endpoint helps debug Supabase API key issues
export async function GET() {
  const testData = {
    browserClient: {
      url: 'https://lgtldjzglbzlmmxphfxw.supabase.co', // Hardcoded from our client
      keyFirstChars: 'eyJhbGciOi...', // First part of the key
      status: 'not_tested',
      error: null as string | null,
    },
    serverClient: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || null,
      keyFirstChars: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...' 
        : null,
      status: 'not_tested',
      error: null as string | null,
    },
    environmentInfo: {
      nodeEnv: process.env.NODE_ENV,
      isLocal: process.env.NODE_ENV === 'development',
    }
  };

  // Test the browser client
  try {
    // Test with a simple query
    const { data, error } = await supabaseClient
      .from('journey')
      .select('id')
      .limit(1);

    if (error) {
      testData.browserClient.status = 'error';
      testData.browserClient.error = error.message;
    } else {
      testData.browserClient.status = 'success';
    }
  } catch (e) {
    testData.browserClient.status = 'exception';
    testData.browserClient.error = e instanceof Error ? e.message : 'Unknown error';
  }

  // Test the server client
  try {
    const serverSupabase = await createServerSupabaseClient();
    const { data, error } = await serverSupabase
      .from('journey')
      .select('id')
      .limit(1);

    if (error) {
      testData.serverClient.status = 'error';
      testData.serverClient.error = error.message;
    } else {
      testData.serverClient.status = 'success';
    }
  } catch (e) {
    testData.serverClient.status = 'exception';
    testData.serverClient.error = e instanceof Error ? e.message : 'Unknown error';
  }

  return NextResponse.json(testData);
} 