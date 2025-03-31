'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, BrainCog, Brain, PenTool, Zap, MessageCircleCode, MessageCircleDashed } from 'lucide-react';
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
}

export function AISimpleChat({ className }: AISimpleChatProps) {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const [glowPosition, setGlowPosition] = useState({ x: 50, y: 50 });
  const [currentIconIndex, setCurrentIconIndex] = useState(0);

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

  // These would be populated based on RAG context
  const quickPrompts: QuickPrompt[] = [
    { 
      text: 'Tell me about your work',
      action: () => handleQuickPrompt('Can you tell me about your professional experience?')
    },
    { 
      text: 'What tools do you use?',
      action: () => handleQuickPrompt('What technologies and frameworks do you work with?')
    },
    { 
      text: 'Recent projects',
      action: () => handleQuickPrompt('What are some recent projects you have worked on?')
    },
    { 
      text: 'Contact info',
      action: () => handleQuickPrompt('How can I get in touch with you?')
    },
  ];

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
  };

  // This would integrate with your RAG system
  const processUserQuery = async (query: string) => {
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: query }]);
    
    setIsLoading(true);
    try {
      // In the future, this would call your backend API that implements RAG
      // For now, simulate a response after a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulated response - would be replaced with actual RAG response
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: "This is a simulated response. When implemented, I'll use RAG to provide contextually relevant information about Jordan's portfolio and experience." 
        }
      ]);
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
              {/* Combined Icon at the top */}
              <div className="flex justify-center mb-6">
                <div className="relative w-16 h-16 border-2 dark:border-white/10 border-black/20 rounded-xl">
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
                </div>
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

        {/* Message list */}
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm dark:text-white text-neutral-900">{msg.content}</p>
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
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 h-8 flex items-center">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 200 40" 
                  width="80"
                  height="20"
                  className="dark:text-gray-400 text-gray-800"
                >
                  <circle 
                    className="fill-current stroke-current" 
                    strokeWidth="0" 
                    r="6" 
                    cx="20" 
                    cy="20"
                  >
                    <animate 
                      attributeName="opacity" 
                      calcMode="spline" 
                      dur="2" 
                      values="1;0;1;" 
                      keySplines=".5 0 .5 1;.5 0 .5 1" 
                      repeatCount="indefinite" 
                      begin="-.4"
                    />
                  </circle>
                  <circle 
                    className="fill-current stroke-current" 
                    strokeWidth="0" 
                    r="6" 
                    cx="60" 
                    cy="20"
                  >
                    <animate 
                      attributeName="opacity" 
                      calcMode="spline" 
                      dur="2" 
                      values="1;0;1;" 
                      keySplines=".5 0 .5 1;.5 0 .5 1" 
                      repeatCount="indefinite" 
                      begin="-.2"
                    />
                  </circle>
                  <circle 
                    className="fill-current stroke-current" 
                    strokeWidth="0" 
                    r="6" 
                    cx="100" 
                    cy="20"
                  >
                    <animate 
                      attributeName="opacity" 
                      calcMode="spline" 
                      dur="2" 
                      values="1;0;1;" 
                      keySplines=".5 0 .5 1;.5 0 .5 1" 
                      repeatCount="indefinite" 
                      begin="0"
                    />
                  </circle>
                </svg>
              </div>
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Textarea
              placeholder="Ask me about Jordan..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="bg-black/5 dark:bg-white/5 border dark:border-white/10 border-black/10 rounded-xl dark:text-white text-neutral-900 resize-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-white/10 focus-visible:border-white/10 focus:outline-none"
            />
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