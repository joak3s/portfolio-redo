'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Send, 
  BrainCog, 
  Brain, 
  PenTool, 
  MessageCircleCode, 
  MessageCircleDashed, 
  RefreshCw,
  Briefcase,
  Sparkles,
  Zap,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  projectImage?: string;
  isStreaming?: boolean;
  id?: string;
}

interface QuickPrompt {
  text: string;
  icon: React.ElementType;
  action: () => void;
}

interface QuickPromptCategory {
  name: string;
  icon: React.ElementType;
  className: string;
  prompts: QuickPrompt[];
}

interface AISimpleChatProps {
  className?: string;
  onContextUpdate?: (context: any[], relevantProject: any) => void;
  sessionKey?: string;
}

interface ProjectCache {
  projects: string[];
  lastUpdated: string;
}

// Fallback projects in case API fails
const FALLBACK_PROJECTS = [
  "Modern Day Sniper",
  "Swyvvl",
  "Portfolio Website",
  "AI Chat Interface",
  "Precision Rifle Training",
  "UX Research Platform",
  "Design System",
  "Interactive Dashboard",
  "E-commerce Redesign",
  "Mobile App Experience"
];

// Cache expiration in milliseconds (7 days)
const CACHE_EXPIRATION = 7 * 24 * 60 * 60 * 1000;

export function AISimpleChat({ className, onContextUpdate, sessionKey: propSessionKey }: AISimpleChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [recommendedProjects, setRecommendedProjects] = useState<string[]>([]);
  const router = useRouter();
  
  // Add new state for project list
  const [projectsList, setProjectsList] = useLocalStorage<ProjectCache>('chat_projects_cache', {
    projects: FALLBACK_PROJECTS,
    lastUpdated: new Date(0).toISOString()
  });
  
  // Add new state for session management
  const [sessionKey, setSessionKey] = useLocalStorage<string>('chat_session_key', propSessionKey || '');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasLoadedHistory, setHasLoadedHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add state to manage delayed loading display
  const [showLoadingIndicator, setShowLoadingIndicator] = useState(false);
  
  // New state variables for streaming
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const [streamMetadata, setStreamMetadata] = useState<{
    projectImage?: string;
    sessionId?: string;
    relevantProject?: any;
  }>({});
  
  // EventSource reference for streaming
  const eventSourceRef = useRef<EventSource | null>(null);
  
  const icons = [
    { Icon: Brain, key: 'brain' },
    { Icon: PenTool, key: 'pen-tool' },
    { Icon: MessageCircleCode, key: 'message-circle-code' },
    { Icon: MessageCircleDashed, key: 'message-circle-dashed' },
    { Icon: Zap, key: 'zap' },
    { Icon: BrainCog, key: 'brain-cog' },
  ];
  
  // Fetch projects on component mount and when cache is stale
  useEffect(() => {
    const fetchProjects = async () => {
      // Check if the cache is still valid (less than 7 days old)
      const lastUpdated = new Date(projectsList.lastUpdated).getTime();
      const now = new Date().getTime();
      
      // Skip fetching if cache is still valid
      if (now - lastUpdated < CACHE_EXPIRATION && projectsList.projects.length > 0) {
        console.log('Using cached projects list');
        return;
      }
      
      try {
        console.log('Fetching fresh projects list');
        const response = await fetch('/api/chat/projects');
        
        if (!response.ok) {
          throw new Error(`Error fetching projects: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.projects && data.projects.length > 0) {
          // Update the cache with new data
          setProjectsList({
            projects: data.projects,
            lastUpdated: data.lastUpdated || new Date().toISOString()
          });
          console.log(`Cached ${data.projects.length} projects`);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        // If fetch fails and cache is empty, use fallback projects
        if (projectsList.projects.length === 0) {
          setProjectsList({
            projects: FALLBACK_PROJECTS,
            lastUpdated: new Date().toISOString()
          });
        }
      }
    };
    
    fetchProjects();
  }, [projectsList, setProjectsList]);

  // Icon cycling effect
  useEffect(() => {
    const iconInterval = setInterval(() => {
      setCurrentIconIndex(prevIndex => (prevIndex + 1) % icons.length);
    }, 4000);
    
    return () => clearInterval(iconInterval);
  }, [icons.length]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Get a random project that hasn't been recommended yet
  const getRandomProject = useCallback(() => {
    const availableProjects = projectsList.projects.filter(
      project => !recommendedProjects.includes(project)
    );
    
    // If all projects have been recommended, reset the list
    if (availableProjects.length === 0) {
      setRecommendedProjects([]);
      return projectsList.projects[Math.floor(Math.random() * projectsList.projects.length)];
    }
    
    const randomProject = availableProjects[Math.floor(Math.random() * availableProjects.length)];
    setRecommendedProjects(prev => [...prev, randomProject]);
    return randomProject;
  }, [recommendedProjects, projectsList.projects]);

  // Get a specific project or a featured one
  const getFeaturedProject = useCallback(() => {
    // For now, just return a specific project that's likely important
    // This could be enhanced to get an actual featured project from the database
    const featuredOptions = projectsList.projects.filter(project => 
      project.includes("Portfolio") || 
      project.includes("AI") || 
      project.includes("Design System")
    );
    
    if (featuredOptions.length === 0) {
      return getRandomProject();
    }
    
    return featuredOptions[Math.floor(Math.random() * featuredOptions.length)];
  }, [projectsList.projects, getRandomProject]);

  // Function to clear conversation and start over
  const clearConversation = useCallback(() => {
    // Generate a new session key
    const newSessionKey = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    // Update state
    setMessages([]);
    setSessionId(null);
    setSessionKey(newSessionKey);
    setHasLoadedHistory(false);
  }, [setSessionKey]);

  // Generate a random skills question from a set of variations
  const getRandomSkillsQuestion = () => {
    const skillsQuestions = [
      "What technical skills does Jordan have?",
      "What web design skills does Jordan have?",
      "Is Jordan a skilled UX Designer?",
      "What coding languages is Jordan proficient in?",
      "What are Jordan's strongest design skills?",
      "Tell me about Jordan's frontend development expertise"
    ];
    return skillsQuestions[Math.floor(Math.random() * skillsQuestions.length)];
  };

  // Generate a random design approach question
  const getRandomDesignQuestion = () => {
    const designQuestions = [
      "What is Jordan's approach to UX/UI design?",
      "How does Jordan approach user-centered design?",
      "What design principles does Jordan follow in his work?",
      "How does Jordan balance aesthetics and functionality in design?",
      "What is Jordan's design process like?",
      "How does Jordan incorporate user feedback into his designs?"
    ];
    return designQuestions[Math.floor(Math.random() * designQuestions.length)];
  };

  // Generate a random background question
  const getRandomBackgroundQuestion = () => {
    const backgroundQuestions = [
      "What is Jordan's educational background?",
      "Where did Jordan study and what did he specialize in?",
      "Tell me about Jordan's professional background",
      "What type of work does Jordan do?",
    ];
    return backgroundQuestions[Math.floor(Math.random() * backgroundQuestions.length)];
  };

  // Simplified quick prompts - just 4 high-value options
  const quickPrompts: QuickPrompt[] = [
    { 
      text: 'Featured project',
      icon: Sparkles,
      action: () => handleQuickPrompt(`Tell me about ${getFeaturedProject()}`)
    },
    { 
      text: 'Technical Skills',
      icon: Brain,
      action: () => handleQuickPrompt(getRandomSkillsQuestion())
    },
    { 
      text: 'Design approach',
      icon: PenTool,
      action: () => handleQuickPrompt(getRandomDesignQuestion())
    },
    { 
      text: 'Background',
      icon: Briefcase, 
      action: () => handleQuickPrompt(getRandomBackgroundQuestion())
    }
  ];

  const handleRandomPrompt = () => {
    const randomPrompt = quickPrompts[Math.floor(Math.random() * quickPrompts.length)];
    randomPrompt.action();
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  }, []);

  useEffect(() => {
    let animationFrame: number;
    
    const animateGlow = () => {
      if (isHovered || isFocused) {
        setGlowPosition(prev => ({
          x: prev.x + (position.x - prev.x) * 0.1,
          y: prev.y + (position.y - prev.y) * 0.1
        }));
      }
      animationFrame = requestAnimationFrame(animateGlow);
    };

    animationFrame = requestAnimationFrame(animateGlow);
    return () => cancelAnimationFrame(animationFrame);
  }, [position, isHovered, isFocused]);

  const handleQuickPrompt = (promptText: string) => {
    setMessage(promptText);
    // Focus the textarea after setting the prompt
    const textarea = document.querySelector('textarea');
    if (textarea) textarea.focus();
  };

  // Generate a new session key if not provided
  useEffect(() => {
    if (!sessionKey) {
      const newSessionKey = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      console.log('Generated new session key:', newSessionKey);
      setSessionKey(newSessionKey);
      // Mark as loaded immediately for new sessions to prevent unnecessary loading state
      setHasLoadedHistory(true);
    } else {
      // For returning users, we'll check for history in the next effect
      console.log('Using existing session key:', sessionKey);
    }
  }, [sessionKey, setSessionKey]);
  
  // Load chat history when session key is available
  useEffect(() => {
    const loadChatHistory = async () => {
      // Skip loading if no session key, or if already loaded
      if (!sessionKey || hasLoadedHistory) return;
      
      // Extract timestamp from session key to determine if it's a fresh session
      const sessionTimestamp = sessionKey.match(/session_(\d+)_/)?.[1];
      const isNewSession = sessionTimestamp && 
                         // Check if session was created within the last 5 seconds
                         (Date.now() - parseInt(sessionTimestamp) < 5000);
      
      if (isNewSession) {
        console.log('Detected new session, skipping history load');
        setHasLoadedHistory(true);
        return;
      }
      
      console.log('Loading history for existing session:', sessionKey);
      
      try {
        setIsLoadingHistory(true);
        
        // First, fetch the session ID using the session key
        const response = await fetch(`/api/chat/session?sessionKey=${sessionKey}`);
        if (!response.ok) {
          console.warn('Failed to fetch session ID, creating a new session');
          setIsLoadingHistory(false);
          setHasLoadedHistory(true);
          return;
        }
        
        const data = await response.json();
        
        // If no session found, nothing to load
        if (!data.sessionId) {
          console.log('No existing session found, creating a new one');
          setIsLoadingHistory(false);
          setHasLoadedHistory(true);
          return;
        }
        
        // Store the retrieved session ID
        setSessionId(data.sessionId);
        
        // Now fetch the messages for this session
        const messagesResponse = await fetch(`/api/chat/history?sessionId=${data.sessionId}`);
        if (!messagesResponse.ok) {
          console.warn('Failed to fetch message history');
          setIsLoadingHistory(false);
          setHasLoadedHistory(true);
          return;
        }
        
        const messagesData = await messagesResponse.json();
        if (messagesData.messages && messagesData.messages.length > 0) {
          // Transform messages to match our component's expected format
          const formattedMessages = messagesData.messages.map((msg: any) => ({
            role: msg.role || (msg.user_prompt ? 'user' : 'assistant'),
            content: msg.content || (msg.role === 'user' ? msg.user_prompt : msg.response),
            projectImage: msg.project_image
          }));
          
          setMessages(formattedMessages);
          setHasLoadedHistory(true);
          
          console.log(`Loaded ${formattedMessages.length} messages from session history`);
        } else {
          console.log('No messages in session history');
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        setHasLoadedHistory(true);
      } finally {
        setIsLoadingHistory(false);
      }
    };
    
    loadChatHistory();
  }, [sessionKey, hasLoadedHistory, setHasLoadedHistory]);

  // Effect to handle delayed showing of loading indicator
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLoadingHistory) {
      // Wait 300ms before showing loading indicator to prevent flashing
      timer = setTimeout(() => {
        setShowLoadingIndicator(true);
      }, 300);
    } else {
      setShowLoadingIndicator(false);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isLoadingHistory]);

  // Updated to use the streaming API
  const processUserQuery = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;
    
    setIsLoading(true);
    
    // Create a unique ID for this message for streaming updates
    const messageId = Date.now().toString();
    
    // First add the user message to the state immediately
    const userMessage: Message = { role: 'user' as const, content: userPrompt };
    setMessages(prev => [...prev, userMessage]);

    // Clear any previous streamed content
    setStreamedContent('');
    
    // Close any existing event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      // Add placeholder message for the streaming response
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: '',
          isStreaming: true,
          id: messageId
        }
      ]);
      
      // Set streaming flag
      setIsStreaming(true);
      
      // Add a small delay to ensure React state is synchronized before creating EventSource
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Create EventSource for streaming
      const eventSource = new EventSource(`/api/chat/stream?data=${encodeURIComponent(JSON.stringify({
        prompt: userPrompt,
        sessionKey: sessionKey,
        includeHistory: true,
        streaming: true
      }))}`);
      
      // Store reference to allow closing later
      eventSourceRef.current = eventSource;
      
      // Handle initial metadata
      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle different message types
          if (data.type === 'metadata') {
            // Store metadata for later use
            setStreamMetadata({
              projectImage: data.projectImage,
              sessionId: data.sessionId,
              relevantProject: data.relevantProject
            });
            
            // If session ID is set, update component state
            if (data.sessionId && !sessionId) {
              setSessionId(data.sessionId);
            }
            
            // Important: If we have a project image, immediately update the current message
            // This ensures the image appears in the current message as soon as metadata arrives
            if (data.projectImage) {
              setMessages(prev => 
                prev.map(msg => 
                  msg.id === messageId 
                    ? { 
                        ...msg, 
                        projectImage: data.projectImage
                      }
                    : msg
                )
              );
              console.log(`Assigned project image to message ${messageId}`);
            }
          } 
          else if (data.type === 'content') {
            // Update the streamed content with new chunk
            setStreamedContent(prev => prev + data.content);
            
            // Update the message in place without changing the projectImage
            // The projectImage is set when metadata arrives, not with each content chunk
            setMessages(prev => 
              prev.map(msg => 
                msg.id === messageId 
                  ? { 
                      ...msg, 
                      content: msg.content + data.content
                    }
                  : msg
              )
            );
          } 
          else if (data.type === 'done') {
            // Stream is complete, set final state
            setMessages(prev => 
              prev.map(msg => 
                msg.id === messageId 
                  ? { 
                      ...msg, 
                      isStreaming: false,
                      // Preserve the existing projectImage rather than replacing it
                      // This ensures we don't lose the image due to async state updates
                    }
                  : msg
              )
            );
            
            // Clean up
            setIsStreaming(false);
            setIsLoading(false);
            eventSource.close();
            eventSourceRef.current = null;
            
            // If parent component provided a context update handler, pass the context data
            if (onContextUpdate && streamMetadata.relevantProject) {
              onContextUpdate([], streamMetadata.relevantProject);
            }
          }
          else if (data.type === 'error') {
            throw new Error(data.message || 'Unknown streaming error');
          }
        } catch (error) {
          console.error('Error processing stream event:', error);
          handleStreamError(messageId);
        }
      });
      
      // Handle connection errors
      eventSource.onerror = (error) => {
        console.error('EventSource error:', error);
        handleStreamError(messageId);
      };
      
    } catch (error) {
      console.error('Error setting up streaming:', error);
      handleStreamError(messageId);
    }
  };

  // Helper to handle stream errors
  const handleStreamError = (messageId: string) => {
    // Close the event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    // Update message state to show error
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { 
              role: 'assistant', 
              content: "I'm sorry, I encountered an error while processing your request. The server might be busy or facing temporary issues. Please try again in a moment.",
              isStreaming: false
            }
          : msg
      )
    );
    
    // Reset state
    setIsStreaming(false);
    setIsLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;
    
    processUserQuery(message);
    setMessage('');
  };

  // Handle keydown events - Enter to submit, Shift+Enter for new line
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isLoading) {
        handleSubmit(e);
      }
    }
  };

  // Clean up EventSource on unmount
  useEffect(() => {
    return () => {
      // Close any active event sources when the component unmounts
      if (eventSourceRef.current) {
        console.log('Closing EventSource on unmount');
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  return (
    <motion.div 
      className={cn("relative", className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setPosition({ x: 50, y: 50 });
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      style={{
        willChange: 'transform',
        contain: 'layout',
        zIndex: 10
      }}
    >
      {/* Animated border container with correct z-index - always visible */}
      <div 
        className="absolute -inset-[1px] rounded-2xl overflow-hidden z-0"
        style={{ willChange: 'opacity' }}
      >
        <div 
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            background: `
              radial-gradient(
                circle at ${glowPosition.x}% ${glowPosition.y}%,
                rgba(147, 51, 234, 0.5),
                rgba(59, 130, 246, 0.5) 50%,
                transparent 100%
              )
            `,
            opacity: (isHovered || isFocused) ? 1 : 0.3,
            willChange: 'background, opacity'
          }}
        />
      </div>

      {/* Content with proper z-index */}
      <div className="relative z-10 w-full rounded-2xl dark:bg-neutral-950/90 bg-white/90 backdrop-blur-xl border dark:border-white/10 border-black/20 py-8 px-4 sm:py-12 sm:px-12">
        {/* Header with conversation controls */}
        {messages.length > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearConversation}
              className="h-8 px-2 rounded-lg text-xs dark:bg-white/5 bg-black/5 backdrop-blur-md border dark:border-white/10 border-black/10 dark:text-white text-neutral-900 hover:dark:bg-white/10 hover:bg-black/10"
              title="Clear conversation"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              New Chat
            </Button>
          </div>
        )}
        
        {/* Loading history indicator with delayed appearance */}
        <AnimatePresence>
          {isLoadingHistory && showLoadingIndicator && (
            <motion.div 
              className="flex items-center justify-center pb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="w-4 h-4">
                  <svg className="animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <span>Loading conversation...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Initial View - Combined Icon and Quick Prompts (show only when no messages and not loading) */}
        <AnimatePresence>
          {!isLoading && !isLoadingHistory && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Clickable Icon at the top for random prompts */}
              <div className="flex justify-center mb-6 sm:mb-12">
                <button 
                  onClick={handleRandomPrompt}
                  className="relative w-14 h-14 sm:w-16 sm:h-16 border-2 dark:border-white/10 border-black/20 rounded-xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-blue-400"
                  aria-label="Generate random prompt"
                >
                  <div 
                    className="absolute inset-0 rounded-xl animate-pulse duration-8000"
                    style={{
                      background: `radial-gradient(circle, rgba(137, 141, 148, 0.1) 100%, transparent 20%)`,
                      filter: 'blur(4px)'
                    }}
                  ></div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <AnimatePresence mode="wait">
                      {icons.map(({ Icon, key }, index) => 
                        index === currentIconIndex && (
                          <motion.div
                            key={key}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                          >
                            <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-gray-700 dark:text-gray-400" strokeWidth={1.5} />
                          </motion.div>
                        )
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              </div>

              {/* Quick Prompts */}
              <div className="mb-4">
                <div className="flex flex-wrap justify-center gap-2">
                  {quickPrompts.map((prompt, index) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      className="text-sm rounded-xl flex items-center gap-1.5 dark:bg-white/5 bg-black/5 backdrop-blur-md border dark:border-white/10 border-black/10 dark:text-white text-neutral-900 hover:dark:bg-white/10 hover:bg-black/10 transition-all"
                      onClick={prompt.action}
                    >
                      <prompt.icon className="w-3.5 h-3.5 opacity-70" />
                      {prompt.text}
                    </Button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message list with auto-scroll - show when there are messages */}
        {messages.length > 0 && (
          <div className="mb-4 pr-2 space-y-3 max-h-[500px] overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/20 dark:[&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-black/30 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/30 focus:transform-none focus:scale-100">
            {messages.map((msg, index) => (
              <div 
                key={msg.id || index} 
                className={cn(
                  "flex items-start gap-3 p-4 py-8 rounded-xl",
                  msg.role === 'assistant' 
                    ? "dark:bg-white/5 bg-black/5 backdrop-blur-md"
                    : ""
                )}
              >
                <div
                  className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                      : 'bg-gradient-to-br from-blue-600 to-teal-700'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <BrainCog className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  ) : (
                    <User className="h-4 w-4 text-white" />
                  )}
                </div>
                <div
                  className={`flex-1 rounded-xl overflow-hidden ${
                    msg.role === 'assistant' ? 'text-md' : 'text-md'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-md dark:prose-invert prose-p:leading-relaxed prose-pre:bg-black/10 dark:prose-pre:bg-white/10 prose-pre:p-2 prose-pre:rounded-lg max-w-none text-md dark:text-white text-neutral-900 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 prose-pre:text-md prose-pre:overflow-x-auto prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-medium prose-a:underline hover:prose-a:text-blue-500 dark:hover:prose-a:text-blue-300 prose-a:underline-offset-2 prose-a:transition-colors prose-a:cursor-pointer [&_h1]:!mt-4 [&_h2]:!mt-4 [&_h3]:!mt-4">
                      {msg.projectImage && (
                        <motion.div 
                          className="mb-4 max-w-full overflow-hidden rounded-lg"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <img 
                            src={msg.projectImage} 
                            alt="Project Image" 
                            className="w-full h-auto aspect-16/9 max-h-[300px] object-cover rounded-lg shadow-md" 
                            loading="lazy"
                            onLoad={() => console.log('Project image loaded successfully:', msg.projectImage)}
                            onError={(e) => {
                              // Handle image loading errors gracefully
                              console.warn('Failed to load project image:', msg.projectImage);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </motion.div>
                      )}
                      <div
                        ref={(el) => {
                          // Skip if the element doesn't exist
                          if (!el) return;
                          
                          // Always update content during streaming or if not yet processed
                          if (msg.isStreaming || !el.getAttribute('data-processed')) {
                            el.innerHTML = msg.content.replace(
                              /```(\w+)?\n([\s\S]*?)```/g, 
                              (_, lang, code) => `<pre><code class="language-${lang || ''}">${code.trim()}</code></pre>`
                            ).replace(
                              /<img[^>]*>/g, 
                              '' // Remove any img tags from the AI response
                            );
                            
                            // Only mark as processed when streaming is complete
                            if (!msg.isStreaming) {
                              el.setAttribute('data-processed', 'true');
                            }
                          }
                        }}
                        data-content-id={msg.id || index}
                        className="prose prose-md dark:prose-invert prose-p:leading-relaxed prose-pre:bg-black/10 dark:prose-pre:bg-white/10 prose-pre:p-2 prose-pre:rounded-lg max-w-none text-md dark:text-white text-neutral-900 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 prose-pre:text-md prose-pre:overflow-x-auto prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:font-medium prose-a:underline hover:prose-a:text-blue-500 dark:hover:prose-a:text-blue-300 prose-a:underline-offset-2 prose-a:transition-colors prose-a:cursor-pointer [&_h1]:!mt-4 [&_h2]:!mt-4 [&_h3]:!mt-4"
                        onClick={(e) => {
                          // Find the link element (could be the target or a parent)
                          let linkElement = e.target as HTMLElement;
                          
                          // Walk up the DOM to find an 'a' tag if the click wasn't directly on it
                          while (linkElement && linkElement.tagName !== 'A' && linkElement.parentElement) {
                            linkElement = linkElement.parentElement;
                          }
                          
                          // If we found a link, handle it
                          if (linkElement.tagName === 'A') {
                            e.preventDefault();
                            const href = linkElement.getAttribute('href');
                            
                            if (href && href.startsWith('/work/')) {
                              // Use Next.js client navigation for internal links
                              console.log(`Navigating to project page: ${href}`);
                              router.push(href);
                            } else if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                              // Open external links in a new tab
                              console.log(`Opening external link: ${href}`);
                              window.open(href, '_blank', 'noopener,noreferrer');
                            }
                          }
                        }}
                      />
                      {/* Show cursor effect for streaming messages */}
                      {msg.isStreaming && (
                        <span className="ml-1 inline-block w-2 h-4 rounded-full bg-blue-500 animate-pulse"></span>
                      )}
                    </div>
                  ) : (
                    <p className="text-md dark:text-white text-neutral-900">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading animation has been replaced by streaming UI for assistant messages */}
            {isLoading && !isStreaming && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-start gap-3 p-3 rounded-xl dark:bg-white/5 bg-black/5 backdrop-blur-md"
              >
                <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <svg 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="text-white"
                  >
                    <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12a10 10 0 0 1 10-10z" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <div className="flex-1 h-6 sm:h-7 flex items-center">
                  <div className="flex space-x-2">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </motion.div>
            )}
            
            {/* Hidden div for auto-scrolling */}
            <div ref={messagesEndRef} />
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3">
          <div className="relative">
            <Textarea
              placeholder="Ask me about Jordan..."
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                // Dynamically adjust height within limits
                const textarea = e.target;
                textarea.style.height = 'auto';
                const newHeight = Math.min(textarea.scrollHeight, 150); // Max height ~4 lines
                textarea.style.height = `${newHeight}px`;
              }}
              onKeyDown={handleKeyDown}
              rows={2}
              style={{
                minHeight: "80px", // ~2 lines + padding
                height: "auto",
                boxSizing: "border-box"
              }}
              className="w-full py-2 sm:py-3 pl-3 pr-12 sm:pl-4 sm:pr-14 text-md bg-black/3 dark:bg-white/5 border dark:border-white/10 border-black/10 rounded-xl dark:text-white text-neutral-900 resize-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-white/10 focus-visible:border-white/10 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-black/20 dark:[&::-webkit-scrollbar-thumb]:bg-white/20 hover:[&::-webkit-scrollbar-thumb]:bg-black/30 dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/30 focus:transform-none focus:scale-100"
            />
            <Button 
              type="submit" 
              variant="outline"
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg dark:bg-white/5 bg-black/5 backdrop-blur-md border dark:border-white/10 border-black/10 dark:text-white text-neutral-900 hover:dark:bg-white/10 hover:bg-black/10 transition-all shadow-sm hover:shadow flex items-center gap-1 sm:gap-2 h-[28px] sm:h-[32px] z-10"
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? 'Processing...' : <Send className="w-3 h-3 sm:w-4 sm:h-4" />}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
} 