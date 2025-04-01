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

## Progress Tracker

- [x] Set up Supabase database tables and extensions
- [x] Generate embeddings for general_info records
- [x] Create RAG utilities for semantic search
- [x] Implement basic API endpoint
- [x] Create test interface
- [x] Improve content and search quality
- [x] Update hybrid search to use project summaries
- [x] Enhance API responses with rich project details
- [ ] Integrate AIChat component with the RAG API
- [ ] Implement conversation context
- [ ] Add feedback mechanisms  
- [ ] Enhance UI with Shadcn components
- [ ] Integrate into portfolio pages

## Current Focus: Integrating the AIChat Component with the RAG API

1. **Update AIChat Component**
   - Modify the AIChat component to call the enhanced RAG API
   - Update message state to handle HTML responses
   - Display project details alongside AI responses
   - Implement image components for project visuals

2. **Component Integration Steps**
   - Import the AIChat component into desired pages
   - Update the AIChat component to use the existing `/api/chat` endpoint
   - Ensure the component can display HTML responses properly
   - Style the component to match the portfolio design

3. **Next Steps**
   - Add conversation persistence using Supabase
   - Implement feedback mechanism for response quality
   - Add analytics tracking for common questions

## RAG Improvements (Completed)

The RAG (Retrieval Augmented Generation) system has been significantly improved to provide more accurate and relevant responses:

1. **Enhanced Hybrid Search**
   - Implemented a robust SQL function that combines vector similarity with text-based search
   - Fixed column ambiguity issues with proper aliasing
   - Lowered similarity threshold from 0.6 to 0.5 for better recall
   - Added text search fallbacks for when vector search doesn't find relevant matches

2. **Project Embeddings**
   - Added embeddings for all projects in the portfolio
   - Enhanced the embedding content with rich project summaries instead of short descriptions
   - Updated embedding scripts to use the detailed summary field
   - Created a formatting script to maintain consistent embedding quality

3. **System Prompt Improvements**
   - Enhanced system prompt to better utilize HTML formatting
   - Updated response formatting to include project details
   - Improved error handling for cases where no relevant context is found
   - Increased token limit to allow for more detailed responses

4. **UI Testing**
   - Created a test page (`app/test-rag/page.tsx`) to validate the RAG implementation
   - Implemented debug views to inspect search results and relevance
   - Added visualizations for context relevance scores
   - Created a clean UI for testing different query types

## Implementation Plan

### 1. Integrating AIChat Component with RAG API

Update the AIChat component to call the existing API:

```typescript
// Modify the processUserQuery function in AIChat.tsx
const processUserQuery = async (query: string) => {
  // Add user message
  setMessages(prev => [...prev, { role: 'user', content: query }]);
  
  setIsLoading(true);
  try {
    // Call the existing /api/chat endpoint
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: query }),
    });
    
    if (!res.ok) {
      throw new Error(`Error: ${res.status}`);
    }
    
    const data = await res.json();
    
    // Update the messages state with the response
    setMessages(prev => [
      ...prev, 
      { 
        role: 'assistant', 
        content: data.response 
      }
    ]);
    
    // Store relevant project if available
    if (data.relevant_project) {
      setRelevantProject(data.relevant_project);
    }
    } catch (error) {
    console.error('Error calling API:', error);
    setMessages(prev => [
      ...prev, 
        { 
          role: 'assistant', 
        content: "I'm sorry, I encountered an error while processing your request. Please try again later." 
        }
    ]);
    } finally {
    setIsLoading(false);
  }
};
```

### 2. Adding the AIChat Component to Pages

```tsx
// Example: Adding AIChat to a page
import AIChat from '@/components/AIChat';

export default function SomePage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Page Title</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          {/* Page content */}
          <p>Your page content here...</p>
                    </div>
                    
        <div>
          {/* AI Chat component */}
          <div className="sticky top-24">
            <AIChat />
                      </div>
                  </div>
                  </div>
              </div>
  );
}
```

### 3. Add Conversation Context (Next Steps)

Create a conversation_sessions table in Supabase:

```sql
-- Conversation sessions table
CREATE TABLE conversation_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT,
  messages JSONB DEFAULT '[]',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enhanced chat_history table
CREATE TABLE chat_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES conversation_sessions(id),
  user_prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  context_used JSONB,
  feedback SMALLINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

Update the API endpoint to support session context:

```typescript
// Add to the existing API route
export async function POST(request: Request) {
  try {
    const { prompt, sessionId } = await request.json();
    
    // Get session and previous messages if sessionId is provided
    let session = null;
    let previousMessages = [];
    
    if (sessionId) {
      const { data } = await supabase
          .from('conversation_sessions')
        .select('*')
        .eq('id', sessionId)
          .single();
        
      if (data) {
        session = data;
        previousMessages = data.messages || [];
      }
    }
    
    // Rest of the existing code...
    
    // If we have a session, update it with the new messages
    if (sessionId && session) {
      await supabase
        .from('conversation_sessions')
        .update({
          messages: [...previousMessages, 
            { role: 'user', content: prompt },
            { role: 'assistant', content: response }
          ],
          last_updated: new Date().toISOString()
        })
        .eq('id', sessionId);
    } 
    // If no session exists, create a new one
    else {
      const { data } = await supabase
        .from('conversation_sessions')
        .insert({ 
          title: prompt.slice(0, 50) + (prompt.length > 50 ? '...' : ''),
          messages: [
            { role: 'user', content: prompt },
            { role: 'assistant', content: response }
          ]
        })
        .select('id')
        .single();
      
      if (data) {
        sessionId = data.id;
      }
    }
    
    // Return the response with sessionId
    return NextResponse.json({ 
      response,
      sessionId,
      context: searchResults,
      relevant_project: mostRelevantProject?.content || null
    });
  } catch (error) {
    // Error handling...
  }
}
```

## 4. UX Design Considerations

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

## 5. Implementation Timeline

1. **Integration of AIChat Component (1-2 days)**
   - Update AIChat to use the existing API
   - Style to match portfolio design
   - Test with various queries
   
2. **Conversation Context Implementation (2 days)**
   - Create database tables for sessions
   - Update API to handle session context
   - Modify AIChat to maintain conversation state
   
3. **Feedback Mechanisms (1 day)**
   - Add thumbs up/down to responses
   - Implement feedback storage in Supabase
   - Create analytics dashboard for feedback
   
4. **Portfolio Integration (1-2 days)**
   - Add AIChat to project detail pages
   - Create contextual prompts based on current page
   - Test user journeys across the site
   
5. **Testing & Refinement (1-2 days)**
   - Conduct user testing
   - Fix issues and refine UX
   - Optimize performance 