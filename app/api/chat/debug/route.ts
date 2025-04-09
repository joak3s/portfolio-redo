import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrCreateSession, getSessionMessages } from '@/lib/chat-db';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Enable edge runtime for better performance
export const runtime = 'edge';

/**
 * Simple implementation of query intent analysis for debugging
 */
function analyzeQueryIntent(query: string): { isProjectQuery: boolean; projectName: string | null; confidence: number; pattern?: string } {
  // Clean the query
  const cleanQuery = query.toLowerCase().trim();
  
  // Check for general information patterns first
  const generalPatterns = [
    /what (tech(nical)?|programming|coding|development) (skills|technologies|tools|stack|languages)/i,
    /what (is|are) (your|jordan'?s) (tech(nical)?|programming|coding|development) (skills|technologies|tools|stack|languages)/i,
    /tell me about (your|jordan'?s) (skills|background|experience|education|design approach|approach)/i,
    /what (is|are) (your|jordan'?s) (background|experience|education|design approach|approach)/i,
    /portfolio|resume|cv|qualifications|expertise|proficiency/i,
    /(who is|about) jordan/i
  ];
  
  // If any general pattern matches, return immediately with isProjectQuery false
  for (const pattern of generalPatterns) {
    if (pattern.test(cleanQuery)) {
      return { isProjectQuery: false, projectName: null, confidence: 0.9, pattern: 'general_info' };
    }
  }
  
  // Direct pattern match for project requests
  const projectPatterns = [
    /tell me about (the )?([a-z0-9\s\-]+) project/i,
    /what (is|was) (the )?([a-z0-9\s\-]+) project/i,
    /explain (the )?([a-z0-9\s\-]+) project/i,
    /describe (the )?([a-z0-9\s\-]+) project/i,
    /information (about|on) (the )?([a-z0-9\s\-]+) project/i,
    /tell me about ([a-z0-9\s\-]+)/i,
  ];
  
  // Check for direct pattern matches
  for (const pattern of projectPatterns) {
    const match = cleanQuery.match(pattern);
    if (match) {
      const projectName = match[match.length - 1].trim();
      // Skip if the "project" is actually about Jordan or skills
      if (['jordan', 'you', 'your', 'skills', 'experience', 'background'].includes(projectName)) {
        return { isProjectQuery: false, projectName: null, confidence: 0, pattern: 'false_positive' };
      }
      return { isProjectQuery: true, projectName, confidence: 1, pattern: 'direct_match' };
    }
  }
  
  // Default to not being a project query
  return { isProjectQuery: false, projectName: null, confidence: 0 };
}

/**
 * GET endpoint to diagnose the chat system
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const check = searchParams.get('check') || 'all';
  const sessionKey = searchParams.get('sessionKey');
  const query = searchParams.get('query') || 'What are Jordan\'s skills?';
  
  const results: any = {
    timestamp: new Date().toISOString(),
    status: 'success',
    checks: {}
  };

  try {
    // Session check
    if (check === 'all' || check === 'session') {
      results.checks.session = { status: 'pending' };
      
      if (sessionKey) {
        // Check if the session exists
        const { data, error } = await supabase
          .from('conversation_sessions')
          .select('id, title, created_at, updated_at')
          .eq('session_key', sessionKey)
          .maybeSingle();
        
        if (error) {
          results.checks.session = { 
            status: 'error', 
            error: error.message,
            sessionKey
          };
        } else if (data) {
          // Session exists, check for messages
          const { data: messagesData, error: messagesError } = await supabase
            .from('chat_history')
            .select('id, role, content, created_at')
            .eq('session_id', data.id)
            .order('created_at', { ascending: false })
            .limit(5);
          
          if (messagesError) {
            results.checks.session = { 
              status: 'partial', 
              session: data,
              error: messagesError.message,
              sessionKey
            };
          } else {
            results.checks.session = { 
              status: 'success', 
              session: data,
              messageCount: messagesData?.length || 0,
              recentMessages: messagesData || [],
              sessionKey
            };
          }
        } else {
          results.checks.session = { 
            status: 'not_found', 
            sessionKey
          };
        }
      } else {
        results.checks.session = { 
          status: 'skipped', 
          reason: 'No sessionKey provided'
        };
      }
    }
    
    // Project images check
    if (check === 'all' || check === 'images') {
      results.checks.images = { status: 'pending' };
      
      // Get some recent messages with project images
      const { data: messagesWithImages, error: imageError } = await supabase
        .from('chat_projects')
        .select('message_id, project_id, project_image, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (imageError) {
        results.checks.images = { 
          status: 'error', 
          error: imageError.message
        };
      } else {
        // Verify image URLs can be accessed
        const imageChecks = await Promise.all((messagesWithImages || []).map(async (msg) => {
          try {
            if (!msg.project_image) return { messageId: msg.message_id, valid: false, reason: 'No image URL' };
            
            // Basic URL validation
            const isValid = typeof msg.project_image === 'string' && 
                           (msg.project_image.startsWith('http://') || 
                            msg.project_image.startsWith('https://'));
            
            return { 
              messageId: msg.message_id, 
              projectId: msg.project_id,
              imageUrl: msg.project_image,
              valid: isValid,
              reason: isValid ? 'Valid URL' : 'Invalid URL format'
            };
          } catch (error: any) {
            return { 
              messageId: msg.message_id, 
              valid: false, 
              error: error.message
            };
          }
        }));
        
        results.checks.images = { 
          status: imageChecks.length > 0 ? 'success' : 'no_data', 
          imageCount: messagesWithImages?.length || 0,
          imageChecks
        };
      }
    }
    
    // Query intent analysis check
    if (check === 'all' || check === 'intent') {
      results.checks.intent = { status: 'pending' };
      
      try {
        // Test the query intent analysis function
        const intent = analyzeQueryIntent(query);
        
        results.checks.intent = { 
          status: 'success', 
          query,
          intent
        };
      } catch (error: any) {
        results.checks.intent = { 
          status: 'error', 
          query,
          error: error.message
        };
      }
    }
    
    // Database structure check
    if (check === 'all' || check === 'schema') {
      results.checks.schema = { status: 'pending' };
      
      try {
        // Check existence of required tables
        const requiredTables = [
          'conversation_sessions',
          'chat_history',
          'chat_projects',
          'general_info'
        ];
        
        const tableChecks = await Promise.all(requiredTables.map(async (table) => {
          try {
            const { data, error } = await supabase
              .from(table)
              .select('*', { count: 'exact', head: true });
            
            return {
              table,
              exists: !error,
              count: error ? 0 : (data as any)?.count || 0,
              error: error?.message
            };
          } catch (e: any) {
            return {
              table,
              exists: false,
              count: 0,
              error: e.message
            };
          }
        }));
        
        results.checks.schema = { 
          status: 'success', 
          tables: tableChecks
        };
      } catch (error: any) {
        results.checks.schema = { 
          status: 'error', 
          error: error.message
        };
      }
    }
    
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'error',
        error: error.message || 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
} 