import { NextResponse } from 'next/server';
import { semanticSearch, formatContext } from '@/lib/rag-utils';
import { OpenAI } from 'openai';

// Enable edge runtime for better performance
export const runtime = 'edge';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: Request) {
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
    
    // Get relevant documents based on the prompt
    const searchResults = await semanticSearch(prompt, {
      matchThreshold: 0.5,  // Lower threshold to find more matches
      matchCount: 5,        // Increase match count for better context
    });
    
    console.log(`Found ${searchResults.length} relevant documents`);
    
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
    
    // Call OpenAI with increased token limit for richer responses
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo',
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 1000,
    });
    
    const response = completion.choices[0].message.content;
    
    // Return the enhanced response
    return NextResponse.json({ 
      response,
      context: searchResults,
      prompt,
      relevant_project: mostRelevantProject?.content || null
    });
  } catch (error: any) {
    console.error('Error in chat API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process request' },
      { status: 500 }
    );
  }
} 