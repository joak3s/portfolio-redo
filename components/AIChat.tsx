'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot } from 'lucide-react';
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

  // These would be populated based on RAG context
  const quickPrompts: QuickPrompt[] = [
    { 
      text: 'Tell me about your work',
      action: () => handleQuickPrompt('Can you tell me about your professional experience?')
    },
    { 
      text: 'What technologies do you use?',
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
      whileTap={{ scale: 0.98 }}
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
      <div className="relative z-10 w-full rounded-2xl dark:bg-neutral-950/90 bg-white/90 backdrop-blur-xl border dark:border-white/10 border-black/10 p-6">
        {messages.length > 0 && (
          <div className="mb-6 space-y-4 max-h-[300px] overflow-y-auto">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex items-start gap-3 p-3 rounded-xl",
                  msg.role === 'assistant' 
                    ? "dark:bg-white/5 bg-black/5 backdrop-blur-md" 
                    : "dark:bg-indigo-600/20 bg-purple-500/10 backdrop-blur-md ml-auto"
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
          </div>
        )}

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

          <div className="flex flex-wrap gap-2 mb-6">
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