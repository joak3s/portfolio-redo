# AI Chatbot Migration & Enhancement Plan: Wized/Xano to Next.js/Supabase

## Executive Summary

This document outlines a comprehensive plan to migrate the existing AI chatbot from a Wized/Xano setup to a Next.js/Supabase architecture, while significantly enhancing its capabilities. The enhanced solution includes:

1. **Conversational Context Management** - Supporting multi-turn conversations through session tracking
2. **Enhanced RAG Implementation** - Improved search relevance through hybrid search methods
3. **UX-Optimized Interface** - Mobile-friendly design with feedback mechanisms
4. **Data Enhancement Tools** - Scripts for augmenting project data with AI-generated summaries and keywords
5. **Fine-Tuning Preparation** - Infrastructure for leveraging existing chat data for model improvements
6. **Project Page Integration** - Contextual placement of the chat interface within relevant sections

The plan respects existing data structures while extending them to support new features, ensuring a smooth migration path while significantly improving both functionality and user experience.

## 1. Supabase Database Setup

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Dedicated embeddings table for vector storage
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id UUID NOT NULL,
  content_type TEXT NOT NULL, -- 'project', 'general_info', etc.
  embedding VECTOR(1536),
  embedding_model TEXT NOT NULL, -- e.g., 'text-embedding-ada-002'
  chunk_index INTEGER,
  chunk_text TEXT,
  chunk_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Composite index for fast lookups
  UNIQUE(content_id, content_type, embedding_model, chunk_index)
);

-- Create HNSW index for faster similarity search
CREATE INDEX embeddings_hnsw_idx ON embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);

-- Enable compression for vector storage
ALTER TABLE embeddings ALTER COLUMN embedding SET STORAGE EXTERNAL;

-- Projects table without embeddings column
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  main_mockup_image TEXT,
  content TEXT,
  gpt_summary TEXT,
  short_summary TEXT,
  project_size TEXT,
  impact_score TEXT,
  duration INTEGER,
  keywords TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- General info table without embeddings column
CREATE TABLE general_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  keywords TEXT[],
  priority TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced chat_history table
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES conversation_sessions(id),
  user_prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  messages JSONB,
  system_instructions TEXT,
  model TEXT,
  context_used TEXT[],
  feedback SMALLINT,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversation sessions table
CREATE TABLE conversation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  summary TEXT,
  messages JSONB DEFAULT '[]',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create hybrid search function
CREATE OR REPLACE FUNCTION hybrid_search(
  query_embedding VECTOR(1536),
  query_text TEXT,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
) RETURNS TABLE (
  content_id UUID,
  content_type TEXT,
  similarity FLOAT,
  content JSONB
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  WITH vector_matches AS (
    SELECT 
      e.content_id,
      e.content_type,
      1 - (e.embedding <=> query_embedding) as similarity
    FROM 
      embeddings e
    WHERE 
      1 - (e.embedding <=> query_embedding) > match_threshold
    ORDER BY 
      similarity DESC
    LIMIT match_count
  ),
  content_data AS (
    -- Get project data
    SELECT 
      p.id as content_id,
      'project' as content_type,
      jsonb_build_object(
        'name', p.name,
        'slug', p.slug,
        'summary', p.gpt_summary,
        'keywords', p.keywords
      ) as content
    FROM 
      projects p
    UNION ALL
    -- Get general info data
    SELECT 
      g.id as content_id,
      'general_info' as content_type,
      jsonb_build_object(
        'title', g.title,
        'content', g.content,
        'category', g.category
      ) as content
    FROM 
      general_info g
  )
  SELECT 
    vm.content_id,
    vm.content_type,
    vm.similarity,
    cd.content
  FROM 
    vector_matches vm
  JOIN 
    content_data cd ON vm.content_id = cd.content_id AND vm.content_type = cd.content_type
  ORDER BY 
    vm.similarity DESC;
END;
$$;
```

## 2. Environment Setup

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
OPENAI_API_KEY=your-openai-key
# Optional for caching
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

## 3. Vector Search Functions (Edge Functions)

Create Supabase Edge Functions for vector search:

```javascript
// supabase/functions/general-info-search/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { search_term } = await req.json()
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )
  
  const { data, error } = await supabaseClient
    .from('general_info')
    .select('*')
    .textSearch('content', search_term)
    .limit(50)
  
  return new Response(JSON.stringify(data || []), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
```

```javascript
// supabase/functions/case-study-search/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { search_term } = await req.json()
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? ''
  )
  
  const { data, error } = await supabaseClient
    .from('case_studies')
    .select('*')
    .or(`name.ilike.%${search_term}%,slug.ilike.%${search_term}%,keywords.cs.{${search_term}}`)
    .limit(50)
  
  return new Response(JSON.stringify(data || []), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
```

## 4. Utility Functions

Create a utility file for the helper functions used in the RAG implementation:

```typescript
// lib/rag-utils.ts
export function cosineSimilarity(vector1: number[], vector2: number[]): number {
  if (!vector1 || !vector2 || vector1.length !== vector2.length) return -1;
  let dotProduct = 0, mag1 = 0, mag2 = 0;
  for (let i = 0; i < vector1.length; i++) {
    dotProduct += vector1[i] * vector2[i];
    mag1 += vector1[i] * vector1[i];
    mag2 += vector2[i] * vector2[i];
  }
  const denominator = Math.sqrt(mag1) * Math.sqrt(mag2);
  return denominator ? dotProduct / denominator : -1;
}

export function keywordMatch(queryText: string, record: any, isCaseStudy = false): number {
  const text = `${record.content || record.gpt_summary || record.short_summary || record.name || (record.keywords || []).join(" ") || ""}`.toLowerCase();
  const queryWords = queryText.toLowerCase().split(/\s+/).filter(word => word.length > 2);
  let matchCount = 0, exactMatchBonus = 0;
  for (const word of queryWords) {
    if (text.includes(word)) matchCount++;
    if (isCaseStudy && (record.name?.toLowerCase().includes(word) || record.slug?.toLowerCase().includes(word))) {
      exactMatchBonus += 0.5;
    }
  }
  return queryWords.length ? (matchCount / queryWords.length) + exactMatchBonus : 0;
}

export function extractSearchTerm(queryText: string): string {
  const lowerQuery = queryText.toLowerCase().replace(/[?]/g, ''); // Remove punctuation
  const stopWords = [
    'is', 'are', 'what', 'who', 'has', 'have', 'worked', 'on', 'for', 'the', 'a', 'an', 
    'tell', 'me', 'about', 'jordan', 'jordans', 'jordan\'s', 'in', 'at', 'websites', 
    'website', 'project'
  ];
  const words = lowerQuery.split(/\s+/).filter(word => 
    word.length > 2 && !stopWords.includes(word)
  );
  return words.length > 0 ? words.join(' ') : lowerQuery.split(' ').pop() || '';
}

interface Intent {
  type: string;
  projectName?: string;
  query?: string;
}

export function detectIntent(queryText: string): Intent {
  const lowerQuery = queryText.toLowerCase();
  if (lowerQuery.includes('skills') || lowerQuery.includes('expertise')) {
    return { type: 'skills' };
  }
  if (lowerQuery.includes('education') || lowerQuery.includes('degree') || lowerQuery.includes('school')) {
    return { type: 'education' };
  }
  if (lowerQuery.includes('vision') || lowerQuery.includes('future') || lowerQuery.includes('ai')) {
    return { type: 'vision' };
  }
  if (lowerQuery.includes('background') || lowerQuery.includes('journey') || lowerQuery.includes('experience')) {
    return { type: 'background' };
  }
  if (lowerQuery.includes('interests') || lowerQuery.includes('hobbies')) {
    return { type: 'interests' };
  }
  if (lowerQuery.includes('values') || lowerQuery.includes('philosophy') || lowerQuery.includes('approach') || lowerQuery.includes('design')) {
    return { type: 'design' };
  }
  if (lowerQuery.includes('married') || lowerQuery.includes('dating') || lowerQuery.includes('family') || lowerQuery.includes('personal')) {
    return { type: 'personal' };
  }
  if (lowerQuery.includes('worked on') || lowerQuery.includes('website') || lowerQuery.includes('project')) {
    const searchTerm = extractSearchTerm(queryText);
    return { type: 'specific', projectName: searchTerm };
  }
  if (lowerQuery.startsWith("tell me about jordan's work on")) {
    const projectName = lowerQuery.replace("tell me about jordan's work on", "").trim();
    return { type: 'specific', projectName: extractSearchTerm(projectName) };
  }
  const specificPatterns = ["tell me about jordan's", "what is jordan's", "jordan's work on", "project", "case study"];
  for (const pattern of specificPatterns) {
    if (lowerQuery.includes(pattern)) {
      const index = lowerQuery.indexOf(pattern);
      const afterPattern = lowerQuery.substring(index + pattern.length).trim();
      const projectName = afterPattern.replace("project", "").trim();
      return { type: 'specific', projectName: extractSearchTerm(projectName) };
    }
  }
  if (lowerQuery.includes('biggest') || lowerQuery.includes('largest') || lowerQuery.includes('smallest')) {
    return { type: 'comparative' };
  }
  return { type: 'unknown', query: queryText };
}

export function hybridSearch(records: any[], queryEmbedding: number[], queryText: string, isCaseStudy: boolean, intent: Intent) {
  const results = records.map(record => {
    const similarity = record.embedding ? cosineSimilarity(queryEmbedding, record.embedding) : 0;
    const keywordScore = keywordMatch(queryText, record, isCaseStudy);
    let metadataScore = 0;
    if (isCaseStudy) {
      const sizeScore = { "small": 0.2, "medium": 0.5, "large": 0.8, "very large": 1 }[record.project_size] || 0;
      const impactScore = { "low": 0.2, "medium": 0.5, "high": 0.8 }[record.impact_score] || 0;
      const durationScore = Math.min(record.duration || 0, 10) / 10;
      metadataScore = (sizeScore + impactScore + durationScore) / 3;
    } else {
      metadataScore = record.priority ? (record.priority === "high" ? 0.8 : 0.5) : 0.5;
    }
    const combinedScore = (isCaseStudy && intent.type === 'specific') 
      ? (0.1 * similarity) + (0.8 * keywordScore) + (0.1 * metadataScore)
      : (0.6 * similarity) + (0.3 * keywordScore) + (0.1 * metadataScore);
    return { record, score: combinedScore };
  });
  const filteredResults = results.filter(item => item.score > 0.1);
  return filteredResults.sort((a, b) => b.score - a.score);
}
```

## 5. Conversation Context Management

```typescript
// lib/conversation-context.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function createSession(): Promise<string> {
  const { data, error } = await supabase
    .from('conversation_sessions')
    .insert({ title: 'New Conversation' })
    .select('id')
    .single()
  
  if (error) throw error
  return data.id
}

export async function getSession(sessionId: string) {
  const { data, error } = await supabase
    .from('conversation_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()
  
  if (error) throw error
  return data
}

export async function updateSessionMessages(sessionId: string, messages: Message[]) {
  const { error } = await supabase
    .from('conversation_sessions')
    .update({ 
      messages, 
      last_updated: new Date().toISOString(),
      title: deriveTitle(messages)
    })
    .eq('id', sessionId)
  
  if (error) throw error
}

function deriveTitle(messages: Message[]): string {
  // Extract first user message as title
  const firstUserMessage = messages.find(m => m.role === 'user')
  if (!firstUserMessage) return 'New Conversation'
  
  // Truncate to reasonable length
  const title = firstUserMessage.content.slice(0, 50)
  return title + (title.length < firstUserMessage.content.length ? '...' : '')
}
```

## 6. Enhanced RAG Implementation

```typescript
// lib/enhanced-rag.ts
import { createClient } from '@supabase/supabase-js';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { detectIntent, keywordMatch } from './rag-utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function semanticSearch(query: string, options: {
  contextSize?: number,
  threshold?: number,
  useMultiQuery?: boolean
} = {}) {
  const {
    contextSize = 5,
    threshold = 0.7,
    useMultiQuery = true
  } = options;

  // Get query embedding
  const embeddings = new OpenAIEmbeddings({
    openAIApiKey: process.env.OPENAI_API_KEY
  });

  // Detect intent for better context retrieval
  const intent = detectIntent(query);
  
  let queryEmbeddings: number[][];
  if (useMultiQuery && query.length > 20) {
    // Generate multiple query embeddings for better coverage
    const queryVariations = await generateQueryVariations(query);
    queryEmbeddings = await Promise.all(
      queryVariations.map(q => embeddings.embedQuery(q))
    );
  } else {
    queryEmbeddings = [await embeddings.embedQuery(query)];
  }

  // Get relevant chunks using hybrid search
  const results = await Promise.all(
    queryEmbeddings.map(async (embedding) => {
      const { data: matches } = await supabase.rpc('hybrid_search', {
        query_embedding: embedding,
        query_text: query,
        match_threshold: threshold,
        match_count: contextSize * 2 // Get more results for post-processing
      });
      return matches || [];
    })
  );

  // Merge and deduplicate results
  const mergedResults = mergeAndDeduplicate(results.flat());

  // Post-process results
  const processedResults = await postProcessResults(mergedResults, query, intent);

  // Return top results based on final score
  return processedResults.slice(0, contextSize);
}

async function generateQueryVariations(query: string): Promise<string[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'Generate 2-3 variations of the search query that might help retrieve relevant information. Return only the variations as a JSON array.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      response_format: { type: "json_object" }
    })
  });

  const { choices } = await response.json();
  const variations = JSON.parse(choices[0].message.content).variations;
  return [query, ...variations];
}

function mergeAndDeduplicate(results: any[]): any[] {
  const seen = new Set();
  return results.filter(result => {
    const key = `${result.content_type}:${result.content_id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function postProcessResults(results: any[], query: string, intent: any) {
  // Get additional context for each result
  const enhancedResults = await Promise.all(
    results.map(async (result) => {
      // Get surrounding chunks if available
      const { data: contextChunks } = await supabase
        .from('embeddings')
        .select('chunk_text, chunk_metadata')
        .eq('content_id', result.content_id)
        .eq('content_type', result.content_type)
        .order('chunk_index');

      // Calculate additional relevance metrics
      const keywordScore = keywordMatch(query, result.content);
      const intentScore = calculateIntentScore(result, intent);
      const contextScore = calculateContextScore(contextChunks);

      // Combine scores with original similarity
      const finalScore = (
        result.similarity * 0.4 +
        keywordScore * 0.3 +
        intentScore * 0.2 +
        contextScore * 0.1
      );

      return {
        ...result,
        contextChunks: contextChunks || [],
        finalScore
      };
    })
  );

  // Sort by final score
  return enhancedResults.sort((a, b) => b.finalScore - a.finalScore);
}

function calculateIntentScore(result: any, intent: any): number {
  if (!intent || intent.type === 'unknown') return 0.5;

  const contentType = result.content_type;
  const content = result.content;

  switch (intent.type) {
    case 'specific':
      if (contentType === 'project' && intent.projectName) {
        return content.name.toLowerCase().includes(intent.projectName.toLowerCase()) ? 1 : 0.2;
      }
      return 0.5;
    
    case 'comparative':
      return contentType === 'project' ? 0.8 : 0.3;
    
    case 'technical':
      return content.keywords?.some((k: string) => 
        k.toLowerCase().includes('technical') || 
        k.toLowerCase().includes('development')
      ) ? 0.9 : 0.4;
    
    default:
      return contentType === 'general_info' ? 0.7 : 0.4;
  }
}

function calculateContextScore(chunks: any[]): number {
  if (!chunks || chunks.length === 0) return 0.5;

  // Prefer results with more context
  const contextCompleteness = Math.min(chunks.length / 3, 1); // Normalize to max of 1
  
  // Check for section metadata
  const hasStructuredSections = chunks.some(c => 
    c.chunk_metadata?.section && 
    typeof c.chunk_metadata.position === 'number'
  );

  return (contextCompleteness * 0.7) + (hasStructuredSections ? 0.3 : 0);
}

export function formatResponseContext(results: any[]): string {
  let context = '';

  // Group results by content type
  const groupedResults = results.reduce((acc, result) => {
    const key = result.content_type;
    if (!acc[key]) acc[key] = [];
    acc[key].push(result);
    return acc;
  }, {} as Record<string, any[]>);

  // Format general info context
  if (groupedResults.general_info) {
    const generalInfo = groupedResults.general_info
      .map(result => {
        const chunks = result.contextChunks
          .map((c: any) => c.chunk_text)
          .join(' ');
        return `${result.content.title}: ${chunks}`;
      })
      .join('\n\n');
    context += `Here is relevant information about Jordan:\n${generalInfo}\n\n`;
  }

  // Format project context
  if (groupedResults.project) {
    const topProject = groupedResults.project[0];
    if (topProject && topProject.finalScore > 0.8) {
      const projectContent = topProject.content;
      const chunks = topProject.contextChunks
        .map((c: any) => c.chunk_text)
        .join(' ');
      
      context += `Regarding the project "${projectContent.name}":\n${chunks}\n`;
      if (projectContent.slug) {
        context += `\nMore details can be found at: https://www.joakes.me/case-study/${projectContent.slug}\n`;
      }
    }
  }

  return context;
}
```

## 7. Enhanced API Route with Conversation Context

```typescript
// app/api/chat/route.ts
import { NextResponse } from 'next/server';
import { Message, updateSessionMessages, getSession } from '@/lib/conversation-context';
import { semanticSearch, formatResponseContext } from '@/lib/enhanced-rag';
import { Redis } from '@upstash/redis';
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { Configuration, OpenAIApi } from 'openai-edge';

// Enable edge runtime
export const runtime = 'edge';

// Initialize OpenAI
const openai = new OpenAIApi(
  new Configuration({
    apiKey: process.env.OPENAI_API_KEY!,
  })
);

// Initialize Redis for caching
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function POST(request: Request) {
  try {
    const { prompt, sessionId } = await request.json();
    
    // Check cache first
    const cacheKey = `chat:${prompt}`;
    const cachedResponse = await redis.get(cacheKey);
    if (cachedResponse) {
      return NextResponse.json({ 
        response: cachedResponse,
        sessionId,
        fromCache: true
      });
    }
    
    // Get session and previous messages
    const session = sessionId ? await getSession(sessionId) : null;
    const messages: Message[] = session?.messages || [];
    
    // Keep last 10 messages for context window
    const recentMessages = messages.slice(-10);
    
    // Get relevant documents based on current prompt and conversation context
    const searchResults = await semanticSearch(prompt, {
      contextSize: 5,
      threshold: 0.7,
      useMultiQuery: prompt.length > 20
    });
    
    // Format response context
    const responseContext = formatResponseContext(searchResults);
    
    // Build system message with context
    const systemMessage = {
      role: 'system',
      content: `You are Jordan Oakes' AI assistant, showcasing his expertise in UX/UI design, web development, AI and human-computer interaction. 
Respond clearly and concisely for potential employers or clients, emphasizing Jordan's skills in crafting seamless digital experiences. 
Refer to him as Jordan and format long text into easily readable chunks using semantic HTML (<h2>, <p>, <strong>, <a>).
Use ONLY the provided context—do not invent projects, case studies, outcomes, or details not explicitly stated.
If context is insufficient, refer only to verified information and avoid speculation.

${responseContext}`
    };
    
    // Prepare complete message array for API call
    const apiMessages = [
      systemMessage,
      ...recentMessages,
      { role: 'user', content: prompt }
    ];
    
    // Call OpenAI with streaming
    const response = await openai.createChatCompletion({
      model: 'gpt-4-turbo',
      messages: apiMessages,
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    // Create stream
    const stream = OpenAIStream(response, {
      async onCompletion(completion) {
        // Cache the response
        await redis.set(cacheKey, completion, { ex: 60 * 60 * 24 }); // 24 hours
        
        // Update messages with new exchange
        const updatedMessages = [
          ...recentMessages,
          { role: 'user', content: prompt },
          { role: 'assistant', content: completion }
        ];
        
        // Update session if it exists, or create new one
        if (sessionId) {
          await updateSessionMessages(sessionId, updatedMessages);
        }
        
        // Store in chat history
        await supabase.from('chat_history').insert({
          session_id: sessionId,
          user_prompt: prompt,
          response: completion,
          messages: {
            messages: [
              { role: 'user', content: prompt },
              { role: 'assistant', content: completion }
            ]
          },
          system_instructions: systemMessage.content,
          model: 'gpt-4-turbo',
          context_used: searchResults.map(r => 
            `${r.content_type}:${r.content_id}`
          ),
          completion_tokens: completion.length / 4, // Rough estimate
          total_tokens: (prompt.length + completion.length) / 4 // Rough estimate
        });
      },
    });
    
    // Return streaming response
    return new StreamingTextResponse(stream);
  } catch (error) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
```

## 8. Enhanced Chat Component with Conversation History

```tsx
// components/AIChat.tsx
'use client'

import { useState, useEffect } from 'react'
import { Send, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@supabase/supabase-js'

type Message = {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChat({ initialPrompt }: { initialPrompt?: string }) {
  const [prompt, setPrompt] = useState(initialPrompt || '')
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  
  useEffect(() => {
    // Load session ID from local storage
    const storedSessionId = localStorage.getItem('currentSessionId')
    if (storedSessionId) {
      setSessionId(storedSessionId)
      loadSession(storedSessionId)
    }
    
    // Load available sessions
    loadSessions()
  }, [])
  
  const loadSessions = async () => {
    const { data } = await supabase
      .from('conversation_sessions')
      .select('id, title, last_updated')
      .order('last_updated', { ascending: false })
      .limit(10)
    
    if (data) setSessions(data)
  }
  
  const loadSession = async (id: string) => {
    const { data } = await supabase
      .from('conversation_sessions')
      .select('messages')
      .eq('id', id)
      .single()
    
    if (data?.messages) {
      // Filter out system messages
      const filteredMessages = data.messages.filter(
        (m: any) => m.role === 'user' || m.role === 'assistant'
      )
      setMessages(filteredMessages)
    }
  }
  
  const createNewSession = () => {
    setSessionId(null)
    setMessages([])
    localStorage.removeItem('currentSessionId')
  }
  
  const selectSession = (id: string) => {
    setSessionId(id)
    loadSession(id)
    localStorage.setItem('currentSessionId', id)
  }
  
  const submitFeedback = async (messageIndex: number, feedback: number) => {
    // Only provide feedback on assistant messages
    if (messages[messageIndex].role !== 'assistant') return
    
    // Find the user message that preceded this response
    const userMessageIndex = messageIndex - 1
    if (userMessageIndex < 0 || messages[userMessageIndex].role !== 'user') return
    
    // Store feedback in chat_history
    const { data: chatHistoryEntry } = await supabase
      .from('chat_history')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_prompt', messages[userMessageIndex].content)
      .eq('response', messages[messageIndex].content)
      .single()
    
    if (chatHistoryEntry) {
      await supabase
        .from('chat_history')
        .update({ feedback })
        .eq('id', chatHistoryEntry.id)
    }
  }
  
  const predefinedPrompts = [
    "Tell me about Jordan's skills",
    "What's Jordan's design philosophy?",
    "Tell me about Jordan's work on user experience"
  ]
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return
    
    // Add user message immediately for responsive UI
    const newMessages = [...messages, { role: 'user', content: prompt }]
    setMessages(newMessages)
    setLoading(true)
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          sessionId
        })
      })
      
      const data = await res.json()
      
      // Update session ID if this was a new conversation
      if (!sessionId && data.sessionId) {
        setSessionId(data.sessionId)
        localStorage.setItem('currentSessionId', data.sessionId)
        // Refresh sessions list
        loadSessions()
      }
      
      // Add assistant response
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: data.response 
      }])
      
      // Clear input
      setPrompt('')
    } catch (error) {
      console.error('Error sending prompt:', error)
      // Add error message
      setMessages([
        ...newMessages,
        { 
          role: 'assistant', 
          content: 'Sorry, something went wrong. Please try again.' 
        }
      ])
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      <Tabs defaultValue="chat">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="chat" className="space-y-4">
          <Card className="p-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">
                {sessionId ? 
                  sessions.find(s => s.id === sessionId)?.title || 'Conversation' : 
                  'New Conversation'}
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={createNewSession}
                title="New conversation"
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </CardHeader>
            
            <CardContent className="pt-0">
              <div className="mb-4 space-y-4">
                {/* Welcome message if no messages */}
                {messages.length === 0 && (
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground">
                      Hi! I'm Jordan's AI assistant. Ask me anything about his skills, projects,
                      or experience in UX design and AI.
                    </p>
                  </div>
                )}
                
                {/* Message thread */}
                {messages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`flex flex-col ${
                      message.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div 
                      className={`px-4 py-2 rounded-lg max-w-[80%] ${
                        message.role === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div dangerouslySetInnerHTML={{ __html: message.content }} />
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                    
                    {/* Feedback buttons for assistant messages */}
                    {message.role === 'assistant' && (
                      <div className="flex space-x-1 mt-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => submitFeedback(index, 1)}
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => submitFeedback(index, -1)}
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                
                {/* Loading indicator */}
                {loading && (
                  <div className="flex justify-center">
                    <div className="animate-spin h-6 w-6 border-2 border-primary rounded-full border-t-transparent"></div>
                  </div>
                )}
              </div>
              
              {/* Predefined prompts */}
              <div className="flex flex-wrap gap-2 mb-4">
                {predefinedPrompts.map((text) => (
                  <Button 
                    key={text}
                    variant="outline" 
                    onClick={() => setPrompt(text)}
                    size="sm"
                  >
                    {text}
                  </Button>
                ))}
              </div>
              
              {/* Input form */}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ask me anything about Jordan..."
                  className="flex-1 min-h-[60px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit(e)
                    }
                  }}
                />
                <Button 
                  type="submit" 
                  disabled={loading || !prompt.trim()}
                  className="self-end"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Conversation History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sessions.length > 0 ? sessions.map((session) => (
                  <div 
                    key={session.id}
                    onClick={() => selectSession(session.id)}
                    className={`p-4 rounded-lg cursor-pointer hover:bg-muted/50 ${
                      sessionId === session.id ? 'bg-muted' : ''
                    }`}
                  >
                    <div className="font-medium">{session.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(session.last_updated).toLocaleString()}
                    </div>
                  </div>
                )) : (
                  <p className="text-muted-foreground">No conversation history yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

## 9. Data Migration Process

### Export data from Xano

```typescript
// scripts/export-xano-data.js
const axios = require('axios');
const fs = require('fs');
require('dotenv').config();

async function exportData() {
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.XANO_API_KEY}`,
    "x-data-source": "live"
  };
  
  try {
    // Create data directory if it doesn't exist
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data');
    }
    
    const generalInfo = await axios.get('https://xmdi-gsaz-gmup.n7d.xano.io/api:fpJh1JTY/general_info', { headers });
    fs.writeFileSync('./data/general-info.json', JSON.stringify(generalInfo.data, null, 2));
    
    const caseStudies = await axios.get('https://xmdi-gsaz-gmup.n7d.xano.io/api:fpJh1JTY/case_studies', { headers });
    fs.writeFileSync('./data/case-studies.json', JSON.stringify(caseStudies.data, null, 2));
    
    // Also export chat history for fine-tuning
    const chatHistory = await axios.get('https://xmdi-gsaz-gmup.n7d.xano.io/api:fpJh1JTY/chat_history', { headers });
    fs.writeFileSync('./data/chat-history.json', JSON.stringify(chatHistory.data, null, 2));
    
    console.log('Data exported successfully');
  } catch (error) {
    console.error('Error exporting data:', error);
  }
}

exportData();
```

### Import to Supabase

```typescript
// scripts/import-to-supabase.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

async function getEmbedding(text) {
  try {
    const response = await openai.createEmbedding({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Error getting embedding:', error);
    throw error;
  }
}

async function importData() {
  try {
    // Import projects first
    console.log('Importing projects...');
    const projectData = JSON.parse(fs.readFileSync('./data/case-studies.json', 'utf8'));
    
    for (const item of projectData) {
      // Insert project without embedding
      const { data: project } = await supabase.from('projects').insert({
        name: item.Name,
        slug: item.Slug,
        main_mockup_image: item.Main_Mockup_Image,
        gpt_summary: item.gpt_summary,
        short_summary: item.Short_Summary,
        project_size: item.project_size,
        impact_score: item.impact_score,
        duration: item.duration,
        keywords: item.keywords
      }).select('id').single();
      
      if (!project?.id) continue;
      
      // Create chunks for long content
      const chunks = splitIntoChunks(
        `${item.Name} ${item.Short_Summary} ${item.gpt_summary || ''}`,
        1000, // chunk size
        200   // overlap
      );
      
      // Store embeddings for each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const embedding = await getEmbedding(chunk.text);
        
        await supabase.from('embeddings').insert({
          content_id: project.id,
          content_type: 'project',
          embedding: embedding,
          embedding_model: 'text-embedding-ada-002',
          chunk_index: i,
          chunk_text: chunk.text,
          chunk_metadata: {
            position: i / chunks.length,
            section: chunk.section || null
          }
        });
      }
    }
    
    // Similar process for general_info
    console.log('Importing general info...');
    const generalData = JSON.parse(fs.readFileSync('./data/general-info.json', 'utf8'));
    
    for (const item of generalData) {
      const { data: info } = await supabase.from('general_info').insert({
        title: item.title,
        content: item.content,
        category: item.category,
        keywords: item.keywords,
        priority: item.priority
      }).select('id').single();
      
      if (!info?.id) continue;
      
      const embedding = await getEmbedding(
        `${item.title} ${item.content} ${(item.keywords || []).join(' ')}`
      );
      
      await supabase.from('embeddings').insert({
        content_id: info.id,
        content_type: 'general_info',
        embedding: embedding,
        embedding_model: 'text-embedding-ada-002',
        chunk_text: item.content
      });
    }
    
    // Import chat history
    if (fs.existsSync('./data/chat-history.json')) {
      console.log('Importing chat history...');
      const chatData = JSON.parse(fs.readFileSync('./data/chat-history.json', 'utf8'));
      
      for (const item of chatData) {
        if (!item.user_prompt) continue;
        
        // Create session if needed
        const { data: session } = await supabase
          .from('conversation_sessions')
          .insert({
            title: item.user_prompt.slice(0, 50),
            messages: item.messages || []
          })
          .select('id')
          .single();
        
        if (!session?.id) continue;
        
        // Store chat history
        await supabase.from('chat_history').insert({
          session_id: session.id,
          user_prompt: item.user_prompt,
          response: item.response,
          messages: item.messages,
          system_instructions: item.system_instructions,
          model: item.model || 'gpt-4',
          completion_tokens: item.completion_tokens,
          total_tokens: item.total_tokens
        });
      }
    }
    
    console.log('Data migration completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  }
}

// Helper function for text chunking
function splitIntoChunks(text, chunkSize, overlap) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push({
      text: text.slice(start, end),
      section: null // Can be enhanced with section detection
    });
    start = end - overlap;
  }
  
  return chunks;
}
```

## 10. Data Enhancement Process

```typescript
// scripts/enhance-project-data.js
const { createClient } = require('@supabase/supabase-js');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
);

async function enhanceProjectData() {
  try {
    // Get all projects without embeddings or without keywords
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .or('embedding.is.null,keywords.is.null');
    
    if (!projects || projects.length === 0) {
      console.log('No projects found that need enhancement');
      return;
    }
    
    console.log(`Found ${projects.length} projects to enhance`);
    
    for (const project of projects) {
      console.log(`Processing project: ${project.name}`);
      
      // Generate summary using GPT if needed
      if (!project.gpt_summary && (project.content || project.short_summary)) {
        const content = project.content || project.short_summary;
        const response = await openai.createChatCompletion({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant that creates concise but comprehensive summaries of portfolio projects."
            },
            {
              role: "user",
              content: `Create a concise summary of this project in 2-3 paragraphs. Focus on the challenges, solutions, technologies used, and outcomes: ${content}`
            }
          ]
        });
        
        project.gpt_summary = response.data.choices[0].message.content;
        console.log(`Generated summary for ${project.name}`);
      }
      
      // Extract keywords if needed
      if (!project.keywords || project.keywords.length === 0) {
        const response = await openai.createChatCompletion({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Extract important keywords from project descriptions as a JSON array"
            },
            {
              role: "user",
              content: `Extract 5-10 relevant keywords from this project description. Return ONLY a JSON array of strings: ${project.gpt_summary || project.content || project.short_summary}`
            }
          ]
        });
        
        try {
          const keywordsText = response.data.choices[0].message.content;
          project.keywords = JSON.parse(keywordsText);
          console.log(`Generated keywords for ${project.name}: ${project.keywords.join(', ')}`);
        } catch (e) {
          console.error(`Error parsing keywords response for ${project.name}:`, e);
        }
      }
      
      // Generate embedding based on content + keywords
      const textToEmbed = `${project.name} ${project.gpt_summary || project.content || project.short_summary} ${(project.keywords || []).join(' ')}`;
      const embeddingResponse = await openai.createEmbedding({
        model: "text-embedding-ada-002",
        input: textToEmbed
      });
      project.embedding = embeddingResponse.data.data[0].embedding;
      
      // Determine project_size if not set
      if (!project.project_size) {
        const wordCount = (project.content || '').split(/\s+/).length;
        project.project_size = wordCount > 1000 ? 'large' : 
                              wordCount > 500 ? 'medium' : 'small';
      }
      
      // Update the project in Supabase
      const { error } = await supabase
        .from('projects')
        .update({
          gpt_summary: project.gpt_summary,
          keywords: project.keywords,
          embedding: project.embedding,
          project_size: project.project_size
        })
        .eq('id', project.id);
      
      if (error) {
        console.error(`Error updating project ${project.name}:`, error);
      } else {
        console.log(`Successfully enhanced project: ${project.name}`);
      }
    }
    
    console.log('Project enhancement completed!');
  } catch (error) {
    console.error('Error enhancing project data:', error);
  }
}

// Similar function for general_info data
async function enhanceGeneralInfo() {
  try {
    // Get all general_info items without embeddings or categories
    const { data: items } = await supabase
      .from('general_info')
      .select('*')
      .or('embedding.is.null,category.is.null');
    
    if (!items || items.length === 0) {
      console.log('No general_info items found that need enhancement');
      return;
    }
    
    console.log(`Found ${items.length} general_info items to enhance`);
    
    for (const item of items) {
      console.log(`Processing general_info item: ${item.title}`);
      
      // Determine category if not set
      if (!item.category) {
        const response = await openai.createChatCompletion({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Categorize content into one of these categories: skills, education, vision, background, interests, design, personal, technical"
            },
            {
              role: "user",
              content: `Categorize this content into one of these categories (skills, education, vision, background, interests, design, personal, technical). Return ONLY the category name: ${item.content}`
            }
          ]
        });
        
        item.category = response.data.choices[0].message.content.trim().toLowerCase();
        console.log(`Categorized as: ${item.category}`);
      }
      
      // Extract keywords if needed
      if (!item.keywords || item.keywords.length === 0) {
        const response = await openai.createChatCompletion({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Extract important keywords as a JSON array"
            },
            {
              role: "user",
              content: `Extract 5-10 relevant keywords from this content. Return ONLY a JSON array of strings: ${item.content}`
            }
          ]
        });
        
        try {
          const keywordsText = response.data.choices[0].message.content;
          item.keywords = JSON.parse(keywordsText);
          console.log(`Generated keywords: ${item.keywords.join(', ')}`);
        } catch (e) {
          console.error(`Error parsing keywords response:`, e);
        }
      }
      
      // Generate embedding if needed
      if (!item.embedding) {
        const embeddingResponse = await openai.createEmbedding({
          model: "text-embedding-ada-002",
          input: `${item.title} ${item.content} ${(item.keywords || []).join(' ')}`
        });
        item.embedding = embeddingResponse.data.data[0].embedding;
      }
      
      // Update the item in Supabase
      const { error } = await supabase
        .from('general_info')
        .update({
          category: item.category,
          keywords: item.keywords,
          embedding: item.embedding
        })
        .eq('id', item.id);
      
      if (error) {
        console.error(`Error updating general_info item:`, error);
      } else {
        console.log(`Successfully enhanced general_info item: ${item.title}`);
      }
    }
    
    console.log('General info enhancement completed!');
  } catch (error) {
    console.error('Error enhancing general info:', error);
  }
}

async function main() {
  await enhanceProjectData();
  await enhanceGeneralInfo();
}

main();
```

## 11. Fine-Tuning Preparation

```typescript
// scripts/prepare-fine-tuning.js
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function prepareFineTuningData() {
  try {
    // Get chat history with positive feedback
    const { data } = await supabase
      .from('chat_history')
      .select('messages, feedback')
      .gte('feedback', 1) // Only positive feedback
      .is('system_instructions', 'not.null')
      .order('created_at', { ascending: false })
      .limit(200) // Adjust as needed
    
    if (!data || data.length === 0) {
      console.log('No suitable data for fine-tuning found');
      return;
    }
    
    console.log(`Found ${data.length} conversations for fine-tuning`);
    
    // Format data for OpenAI fine-tuning
    const trainingData = data.map(item => {
      // Extract messages from the messages field
      const messages = item.messages.messages.filter(
        m => m.role === 'user' || m.role === 'assistant' || m.role === 'system'
      );
      
      return {
        messages
      };
    });
    
    // Ensure data directory exists
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data');
    }
    
    // Write to JSONL file
    const outputPath = './data/fine-tuning.jsonl';
    const jsonlContent = trainingData.map(JSON.stringify).join('\n');
    fs.writeFileSync(outputPath, jsonlContent);
    
    console.log(`Training data prepared at ${outputPath}`);
    console.log(`Total examples: ${trainingData.length}`);
  } catch (error) {
    console.error('Error preparing fine-tuning data:', error);
  }
}

prepareFineTuningData();
```

## 12. Project Page Integration

```tsx
// app/journey/[slug]/page.tsx
import { Suspense } from 'react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import AIChat from '@/components/AIChat'
import JourneyDetail from '@/components/journey/JourneyDetail'
import { Skeleton } from '@/components/ui/skeleton'

export default async function JourneyDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: journey } = await supabase
    .from('journey_milestones')
    .select('*')
    .eq('slug', params.slug)
    .single()
  
  return (
    <div className="container py-12">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <JourneyDetail journey={journey} />
          </Suspense>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-4">Ask Me About This</h2>
          <p className="text-muted-foreground mb-6">
            Have questions about this milestone in my journey? Ask my AI assistant!
          </p>
          <AIChat 
            initialPrompt={`Tell me more about Jordan's experience with ${journey?.title}`} 
          />
        </div>
      </div>
    </div>
  )
}
```

```tsx
// app/work/[slug]/page.tsx
import { Suspense } from 'react'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import AIChat from '@/components/AIChat'
import ProjectDetail from '@/components/project-detail'
import { Skeleton } from '@/components/ui/skeleton'

export default async function ProjectDetailPage({ params }: { params: { slug: string } }) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('slug', params.slug)
    .single()
  
  return (
    <div className="container py-12">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <ProjectDetail project={project} />
          </Suspense>
        </div>
        
        <div className="sticky top-24 self-start">
          <div className="bg-card p-6 rounded-lg shadow-sm border">
            <h2 className="text-2xl font-bold mb-4">Ask Me About This Project</h2>
            <p className="text-muted-foreground mb-6">
              Curious about my work on {project?.name}? Ask my AI assistant for details!
            </p>
            <AIChat 
              initialPrompt={`Tell me about Jordan's work on ${project?.name}`} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}
```

## 13. Supabase RLS Policies

Set up Row Level Security policies to protect your data:

```sql
-- Enable RLS on tables
ALTER TABLE general_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for general_info
CREATE POLICY "Allow anonymous read access to general_info"
  ON general_info FOR SELECT
  TO anon
  USING (true);

-- Create policies for projects
CREATE POLICY "Allow anonymous read access to projects"
  ON projects FOR SELECT
  TO anon
  USING (true);

-- Create policies for chat_history (only service role can insert)
CREATE POLICY "Allow service role to insert chat_history"
  ON chat_history FOR INSERT
  TO service_role
  USING (true);

-- Create policies for conversation_sessions (anyone can view, service role can modify)
CREATE POLICY "Allow anonymous read access to conversation_sessions"
  ON conversation_sessions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow service role to manage conversation_sessions"
  ON conversation_sessions FOR ALL
  TO service_role
  USING (true);
```

## 14. Performance Optimizations

### 1. Vector Search Optimization

```sql
-- Create additional indexes for common query patterns
CREATE INDEX embeddings_content_type_idx ON embeddings(content_type);
CREATE INDEX embeddings_model_idx ON embeddings(embedding_model);

-- Create a materialized view for frequently accessed metadata
CREATE MATERIALIZED VIEW embeddings_metadata AS
SELECT 
  e.content_id,
  e.content_type,
  e.embedding_model,
  COUNT(*) as chunk_count,
  MIN(e.created_at) as first_chunk_date,
  MAX(e.created_at) as last_chunk_date,
  jsonb_agg(DISTINCT e.chunk_metadata) as all_metadata
FROM 
  embeddings e
GROUP BY 
  e.content_id, e.content_type, e.embedding_model;

-- Refresh materialized view (run periodically)
REFRESH MATERIALIZED VIEW embeddings_metadata;
```

### 2. Multi-Stage Caching

```typescript
// lib/cache.ts
import { Redis } from '@upstash/redis';
import { LRUCache } from 'lru-cache';

// In-memory LRU cache for fastest access
const localCache = new LRUCache({
  max: 500, // Maximum number of items
  ttl: 1000 * 60 * 5, // 5 minutes
});

// Redis cache for distributed caching
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedResponse(key: string) {
  // Try local cache first
  const localResult = localCache.get(key);
  if (localResult) return localResult;
  
  // Try Redis cache
  const redisResult = await redis.get(key);
  if (redisResult) {
    // Update local cache
    localCache.set(key, redisResult);
    return redisResult;
  }
  
  return null;
}

export async function setCachedResponse(key: string, value: any, ttl: number) {
  // Set in local cache
  localCache.set(key, value);
  
  // Set in Redis with TTL
  await redis.set(key, value, { ex: ttl });
}

export function generateCacheKey(prompt: string, context?: string) {
  // Create a deterministic cache key
  const hash = crypto
    .createHash('sha256')
    .update(`${prompt}${context || ''}`)
    .digest('hex')
    .slice(0, 16);
  
  return `chat:${hash}`;
}
```

### 3. Streaming Response Implementation

```typescript
// lib/streaming.ts
import { OpenAIStream, StreamingTextResponse } from 'ai';
import { experimental_buildOpenAIMessages } from 'ai/prompts';

export async function createStreamingResponse(messages: any[], context: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      messages: experimental_buildOpenAIMessages(messages),
      stream: true,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  // Create stream
  const stream = OpenAIStream(response);
  
  // Return streaming response
  return new StreamingTextResponse(stream);
}
```

### 4. Rate Limiting and Request Throttling

```typescript
// middleware.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1 m'), // 20 requests per minute
  analytics: true,
});

export async function middleware(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
  
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);
  
  if (!success) {
    return new Response('Too many requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    });
  }
  
  return Response.next();
}

export const config = {
  matcher: '/api/chat',
};
```

### 5. Client-Side Optimizations

```typescript
// hooks/use-chat.ts
import { useChat as useVercelChat } from 'ai/react';
import { useCallback, useRef } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

export function useChat() {
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const { messages, input, handleInputChange, handleSubmit } = useVercelChat({
    api: '/api/chat',
    onResponse: (response) => {
      // Handle streaming response
      if (response.ok) {
        // Update UI immediately
        return;
      }
      // Handle errors
      throw new Error('Failed to send message');
    },
    onFinish: (message) => {
      // Message complete, update UI
    },
  });
  
  // Debounce input changes
  const debouncedInput = useDebounce(input, 300);
  
  const handleDebouncedInputChange = useCallback((e: any) => {
    handleInputChange(e);
  }, [handleInputChange]);
  
  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  
  return {
    messages,
    input: debouncedInput,
    handleInputChange: handleDebouncedInputChange,
    handleSubmit,
    cancelRequest,
  };
}
```

### 6. Edge Runtime Configuration

```typescript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  logging: {
    fetches: {
      fullUrl: true,
    },
  },
}

module.exports = nextConfig
```

These optimizations provide:
1. Efficient vector search with HNSW indexing
2. Multi-level caching (local LRU + Redis)
3. Streaming responses for better UX
4. Rate limiting to prevent abuse
5. Client-side optimizations with debouncing
6. Edge runtime deployment for lower latency

The combination of these optimizations should provide:
- Faster response times
- Lower latency
- Better resource utilization
- Protection against abuse
- Improved user experience

## 15. Implementation Timeline

1. **Database setup in Supabase (1 day)**
   - Set up tables
   - Enable pgvector extension
   - Configure RLS policies

2. **Edge functions for search (1 day)**
   - Implement and deploy general-info-search
   - Implement and deploy case-study-search

3. **Data migration (1 day)**
   - Export data from Xano
   - Generate embeddings
   - Import to Supabase

4. **Data enhancement (1-2 days)**
   - Run scripts to enhance project data
   - Generate summaries and keywords
   - Update embeddings for improved search

5. **API route implementation (2 days)**
   - Implement conversation context management
   - Create enhanced chat API
   - Add error handling and logging

6. **Frontend component (2 days)**
   - Implement AIChat component with conversation history
   - Add feedback mechanisms
   - Style with Tailwind/Shadcn UI

7. **Project page integration (1 day)**
   - Add AI chat components to project and journey pages
   - Implement context-aware initial prompts

8. **Testing and optimization (2 days)**
   - End-to-end testing
   - Performance optimization
   - User experience improvements

9. **Fine-tuning preparation (1 day)**
   - Process chat history data
   - Prepare for model fine-tuning
   - Set up evaluation process

## 16. UX Design Considerations

1. **Conversational Clarity**
   - Provide clear indicators when the AI is thinking/loading
   - Show typing indicators for realistic conversation feel
   - Use semantic HTML for structured, accessible responses

2. **Visual Integration**
   - Match portfolio design language
   - Use smooth animations for transitions
   - Ensure mobile responsiveness
   - Implement dark/light mode compatibility

3. **Feedback Loop**
   - Add thumbs up/down for responses
   - Track user satisfaction metrics
   - Use feedback to continuously improve results

4. **Contextual Awareness**
   - Position chatbot contextually on project pages
   - Pre-populate prompts based on current page context
   - Surface relevant project details in responses

5. **Progressive Enhancement**
   - Start with simple functionality for users
   - Introduce advanced features progressively
   - Provide helpful prompts for new users 