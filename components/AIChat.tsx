'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, BrainCog, Brain, PenTool, Zap, MessageCircleCode, MessageCircleDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface QuickPrompt {
  text: string;
  action: () => void;
}

interface AISimpleChatProps {
  className?: string;
  onContextUpdate?: (context: any[], relevantProject: any) => void;
}

// Sample projects - in production, fetch this from Supabase
const SAMPLE_PROJECTS = [
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

export function AISimpleChat({ className, onContextUpdate }: AISimpleChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
  const [currentIconIndex, setCurrentIconIndex] = useState(0);
  const [recommendedProjects, setRecommendedProjects] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const icons = [
    { Icon: Brain, key: 'brain' },
    { Icon: PenTool, key: 'pen-tool' },
    { Icon: MessageCircleCode, key: 'message-circle-code' },
    { Icon: MessageCircleDashed, key: 'message-circle-dashed' },
    { Icon: Zap, key: 'zap' },
    { Icon: BrainCog, key: 'brain-cog' },
  ];
  
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
    const availableProjects = SAMPLE_PROJECTS.filter(
      project => !recommendedProjects.includes(project)
    );
    
    // If all projects have been recommended, reset the list
    if (availableProjects.length === 0) {
      setRecommendedProjects([]);
      return SAMPLE_PROJECTS[Math.floor(Math.random() * SAMPLE_PROJECTS.length)];
    }
    
    const randomProject = availableProjects[Math.floor(Math.random() * availableProjects.length)];
    setRecommendedProjects(prev => [...prev, randomProject]);
    return randomProject;
  }, [recommendedProjects]);

  // Updated quick prompts aligned with general_info categories
  const quickPrompts: QuickPrompt[] = [
    { 
      text: 'Design approach',
      action: () => handleQuickPrompt('What is Jordan\'s approach to design and UX?')
    },
    { 
      text: 'Technical skills',
      action: () => handleQuickPrompt('What technical skills and technologies does Jordan have expertise in?')
    },
    { 
      text: 'Work on a project',
      action: () => handleQuickPrompt(`Tell me about Jordan's work on ${getRandomProject()}`)
    },
    { 
      text: 'Background',
      action: () => handleQuickPrompt('What is Jordan\'s professional background and experience?')
    },
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

  // Updated to use the actual RAG API
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
      
      // If parent component provided a context update handler, pass the context data
      if (onContextUpdate && data.context) {
        onContextUpdate(data.context, data.relevant_project);
      }
    } catch (error) {
      console.error('Error processing query:', error);
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        willChange: 'transform',
        contain: 'layout',
        zIndex: 10
      }}
    >
      {/* Animated border container with correct z-index */}
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
      <div className="relative z-10 w-full rounded-2xl dark:bg-neutral-950/90 bg-white/90 backdrop-blur-xl border dark:border-white/10 border-black/20 py-6 px-12">
        
        {/* Combined Icon and Quick Prompts (disappear when loading) */}
        <AnimatePresence>
          {!isLoading && messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* Clickable Icon at the top for random prompts */}
              <div className="flex justify-center mb-6">
                <button 
                  onClick={handleRandomPrompt}
                  className="relative w-16 h-16 border-2 dark:border-white/10 border-black/20 rounded-xl transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-blue-400"
                  aria-label="Generate random prompt"
                >
                  <div 
                    className="absolute inset-0 rounded-xl animate-pulse duration-8000"
                    style={{
                      background: `radial-gradient(circle, rgba(115, 123, 137, 0.1) 100%, transparent 20%)`,
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
                            <Icon className="w-10 h-10 text-gray-700 dark:text-gray-400" strokeWidth={1.5} />
                          </motion.div>
                        )
                      )}
                    </AnimatePresence>
                  </div>
                </button>
              </div>

              {/* Quick Prompts */}
              <div className="flex flex-wrap gap-2 mb-2">
                {quickPrompts.map((prompt, index) => (
                  <Button 
                    key={index} 
                    variant="outline" 
                    className="text-sm rounded-xl dark:bg-white/5 bg-black/5 backdrop-blur-md border dark:border-white/10 border-black/10 dark:text-white text-neutral-900 hover:dark:bg-white/10 hover:bg-black/10 transition-all shadow-sm hover:shadow" 
                    onClick={prompt.action}
                  >
                    {prompt.text}
                  </Button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message list with auto-scroll */}
        <div className="mb-4 space-y-4 max-h-[300px] overflow-y-auto">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={cn(
                "flex items-start gap-3 p-3 rounded-xl",
                msg.role === 'assistant' 
                  ? "dark:bg-white/5 bg-black/5 backdrop-blur-md" 
                  : "dark:bg-indigo-600/20 bg-purple-500/10 backdrop-blur-md w-4/5 ml-auto"
              )}
            >
              {msg.role === 'assistant' && (
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-sm">
                  <svg 
                    width="16" 
                    height="16" 
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
              )}
              <div className="flex-1">
                {msg.role === 'assistant' ? (
                  <div className="text-sm dark:text-white text-neutral-900" dangerouslySetInnerHTML={{ __html: msg.content }} />
                ) : (
                  <p className="text-sm dark:text-white text-neutral-900">{msg.content}</p>
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
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <svg 
                  width="16" 
                  height="16" 
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
              <div className="flex-1 h-7 flex items-center">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Hidden div for auto-scrolling */}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Textarea
              placeholder="Ask me about Jordan..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="bg-black/5 dark:bg-white/5 border dark:border-white/10 border-black/10 rounded-xl dark:text-white text-neutral-900 resize-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-white/10 focus-visible:border-white/10 focus:outline-none"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Press Enter to send, Shift+Enter for new line
            </p>
          </div>

          <div className="flex justify-end">
            <Button 
              type="submit" 
              variant="outline"
              className="px-4 py-2 rounded-xl dark:bg-white/5 bg-black/5 backdrop-blur-md border dark:border-white/10 border-black/10 dark:text-white text-neutral-900 hover:dark:bg-white/10 hover:bg-black/10 transition-all shadow-sm hover:shadow flex items-center gap-2"
              disabled={isLoading || !message.trim()}
            >
              {isLoading ? 'Processing...' : 'Ask AI'} 
              {!isLoading && <Send className="w-4 h-4" />}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
} 