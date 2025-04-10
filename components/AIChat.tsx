'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  projectImage?: string;
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

  // Simplified quick prompts - just 4 high-value options
  const quickPrompts: QuickPrompt[] = [
    { 
      text: 'Featured project',
      icon: Sparkles,
      action: () => handleQuickPrompt(`Tell me about ${getFeaturedProject()}`)
    },
    { 
      text: 'Technical skills',
      icon: Brain,
      action: () => handleQuickPrompt('What technical skills does Jordan have?')
    },
    { 
      text: 'Design approach',
      icon: PenTool,
      action: () => handleQuickPrompt('What is Jordan\'s approach to UX/UI design?')
    },
    { 
      text: 'Other projects',
      icon: Briefcase, 
      action: () => handleQuickPrompt(`What can you tell me about ${getRandomProject()}?`)
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

  // Updated to use the actual RAG API
  const processUserQuery = async (userPrompt: string) => {
    if (!userPrompt.trim()) return;
    
    setIsLoading(true);
    
    // First add the user message to the state immediately
    const userMessage: Message = { role: 'user' as const, content: userPrompt };
    setMessages(prev => [...prev, userMessage]);

    try {
      const fetchWithRetry = async () => {
        const retries = 3;
        const delay = 1000; // 1 second

        for (let attempt = 0; attempt < retries; attempt++) {
          try {
            const res = await fetch('/api/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                prompt: userPrompt,
                sessionKey: sessionKey,
                includeHistory: true
              }),
            });
            
            if (!res.ok) {
              const errorData = await res.json().catch(() => ({}));
              const statusMessage = errorData.message || `Status ${res.status}`;
              throw new Error(`API error: ${statusMessage}`);
            }
            
            return await res.json();
          } catch (error) {
            console.warn(`Attempt ${attempt + 1}/${retries} failed:`, error);
            
            // If this is the last attempt, throw the error
            if (attempt === retries - 1) {
              throw error;
            }
            
            // Wait before retrying with exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
          }
        }
      };
      
      const data = await fetchWithRetry();
      
      // Store the session ID if available
      if (data?.session_id && !sessionId) {
        setSessionId(data.session_id);
      }
      
      // Update the messages state with the response
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: data?.response || "I couldn't process that request properly. Please try again.",
          projectImage: data?.project_image || null
        }
      ]);
      
      // Debug image information
      console.log('Message added with project_image:', data?.project_image || 'none');
      if (data?.relevant_project) {
        console.log('Relevant project:', {
          id: data.relevant_project.id,
          name: data.relevant_project.name || data.relevant_project.title,
          hasImage: !!data.project_image
        });
      }
      
      // If parent component provided a context update handler, pass the context data
      if (onContextUpdate && data?.context) {
        onContextUpdate(data.context, data.relevant_project);
      }
    } catch (error) {
      console.error('Error processing query:', error);
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "I'm sorry, I encountered an error while processing your request. The server might be busy or facing temporary issues. Please try again in a moment." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
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

              {/* Simplified Quick Prompts */}
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
                key={index} 
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl",
                  msg.role === 'assistant' 
                    ? "dark:bg-white/5 bg-black/5 backdrop-blur-md"
                    : ""
                )}
              >
                <div
                  className={`flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
                    msg.role === 'assistant'
                      ? 'bg-gradient-to-br from-purple-500 to-blue-500'
                      : 'bg-gradient-to-br from-blue-400 to-teal-400'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <BrainCog className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                  ) : (
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
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  )}
                </div>
                <div
                  className={`flex-1 rounded-xl overflow-hidden ${
                    msg.role === 'assistant' ? 'text-md' : 'text-md'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-md dark:prose-invert prose-p:leading-relaxed prose-pre:bg-black/10 dark:prose-pre:bg-white/10 prose-pre:p-2 prose-pre:rounded-lg max-w-none text-md dark:text-white text-neutral-900 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0 prose-pre:text-md prose-pre:overflow-x-auto">
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
                            className="w-full h-auto max-h-[300px] object-cover rounded-lg shadow-md" 
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
                        dangerouslySetInnerHTML={{ 
                          __html: msg.content.replace(
                            /```(\w+)?\n([\s\S]*?)```/g, 
                            (_, lang, code) => `<pre><code class="language-${lang || ''}">${code.trim()}</code></pre>`
                          ).replace(
                            /<img[^>]*>/g, 
                            '' // Remove any img tags from the AI response
                          )
                        }} 
                      />
                    </div>
                  ) : (
                    <p className="text-md dark:text-white text-neutral-900">{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
            
            {/* Loading animation - inline with messages */}
            {isLoading && (
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