import { NextResponse } from 'next/server';
import { semanticSearch, formatContext } from '@/lib/rag-utils';
import { OpenAI } from 'openai';

// Enable edge runtime for better performance
export const runtime = 'edge';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Define timeout for API requests
const TIMEOUT_MS = 10000;

export async function POST(request: Request) {
  // Start the timer for the request
  const startTime = Date.now();
  
  try {
    // Parse request body
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }
    
    console.log('Received prompt:', prompt);
    
    // Create a timeout promise to abort long-running requests
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Request timed out after ${TIMEOUT_MS}ms`)), TIMEOUT_MS);
    });
    
    // Run semantic search with a timeout
    const searchResultsPromise = semanticSearch(prompt, {
      matchThreshold: 0.5,  // Lower threshold to find more matches
      matchCount: 5,        // Increase match count for better context
    });
    
    // Race the search against the timeout
    const searchResults = await Promise.race([
      searchResultsPromise,
      timeoutPromise
    ]) as Awaited<typeof searchResultsPromise>;
    
    console.log(`Found ${searchResults.length} relevant documents`);
    console.log('Search execution time:', Date.now() - startTime, 'ms');
    
    // Format response context
    const responseContext = formatContext(searchResults);
    
    // Find the most relevant project if any
    const mostRelevantProject = searchResults.find(result => result.content_type === 'project');
    
    // Build enhanced system message with context and project details
    const systemMessage = {
      role: 'system',
      content: `You are an AI assistant for Jordan Oakes' portfolio website. Jordan is a multi-disciplinary designer and developer specializing in user-centered digital experiences, with expertise in UX/UI design, web development, AI-driven solutions, and human-computer interaction. 

IMPORTANT RULES:
1. Only provide information about real, documented projects from the context provided.
2. DO NOT invent or speculate about any projects, outcomes, or roles.
3. If no relevant project matches the prompt, respond by stating that no related project is available.
4. Maintain a professional and convincing tone, focusing on accurate and verified information.
5. Format responses in semantic HTML using proper <h2>, <p>, <strong>, and <a> tags where appropriate.
6. DO NOT wrap the response in markdown code blocks.

Context:
${responseContext || "No specific information found in knowledge base."}

${mostRelevantProject ? `Relevant Project:\n${JSON.stringify(mostRelevantProject.content, null, 2)}` : ""}`
    };
    
    // Prepare message array for API call
    const messages = [
      systemMessage,
      { role: 'user', content: prompt }
    ];
    
    // Call OpenAI with race against timeout
    const completionPromise = openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    // Race the completion against the timeout
    const completion = await Promise.race([
      completionPromise,
      timeoutPromise
    ]) as Awaited<typeof completionPromise>;
    
    const response = completion.choices[0].message.content;
    console.log('Total execution time:', Date.now() - startTime, 'ms');
    
    // Return the enhanced response
    return NextResponse.json({ 
      response,
      context: searchResults,
      prompt,
      relevant_project: mostRelevantProject?.content || null
    });
  } catch (error: any) {
    const executionTime = Date.now() - startTime;
    console.error(`Error in chat API (${executionTime}ms):`, error);
    
    // Different error responses based on the error type
    if (error.message?.includes('timed out')) {
      return NextResponse.json(
        { 
          error: 'The request took too long to process',
          response: "I'm sorry, but your request is taking longer than expected to process. Could you try a simpler question or try again in a moment?"
        },
        { status: 504 }
      );
    } else if (error.message?.includes('fetch failed')) {
      return NextResponse.json(
        {
          error: 'Network connectivity issue',
          response: "I'm having trouble connecting to the knowledge base right now. This could be due to a temporary network issue. Please try again shortly."
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process request',
        response: "I'm sorry, I encountered an error while processing your request. Please try again with a different question."
      },
      { status: 500 }
    );
  }
} 