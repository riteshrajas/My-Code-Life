import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Minimize2, Maximize2, X, Bot, CheckCircle2, AlertCircle, Brain, Shield, BarChart, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { generateGeminiResponse } from '@/lib/gemini-config';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const LIFE_RULES = `// ...existing code...`;

export function GeminiAdvisorPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello! I\'m your Aathera Advisor. Share an action or thought, and I\'ll provide feedback based on your life rules. For example, try asking: "Can I teach someone algebra?" or "I want to learn a new skill."' 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Call the actual Gemini API
  const callGeminiAPI = async (userMessage: string) => {
    setIsLoading(true);
    
    try {
      const response = await generateGeminiResponse(userMessage, LIFE_RULES);
      return response;
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return 'Sorry, I encountered an error processing your request. Please try again.';
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Get response from Gemini
    const response = await callGeminiAPI(userMessage);
    
    // Add assistant response to chat
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
  };

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Width responsiveness
  let panelWidth = "w-1/3";
  if (typeof window !== 'undefined') {
    if (window.innerWidth < 1024) {
      panelWidth = "w-1/2";
    }
    if (window.innerWidth < 768) {
      panelWidth = "w-full";
    }
  }
  
  // Define types for the rule response
  type RuleResponse = {
    ruleMatch: string;
    ruleNumber: number;
    statusEmoji: string;
    ruleIcon: string;
    alignmentStrength: string;
    alignmentClass: string;
    quote: string;
    advice: string;
  };

  // Component to render a rule response card
  const RuleResponseCard = ({ response }: { response: string }) => {
    // Parse the response if it's a JSON string
    let parsedResponse: RuleResponse;
    try {
      parsedResponse = JSON.parse(response) as RuleResponse;
    } catch (e) {
      // If parsing fails, just return the text content
      return <div className="whitespace-pre-wrap">{response}</div>;
    }
    
    const { 
      ruleMatch, 
      ruleNumber, 
      statusEmoji, 
      ruleIcon, 
      alignmentStrength, 
      alignmentClass, 
      quote, 
      advice 
    } = parsedResponse;
    
    // Get the appropriate icon
    const IconComponent = () => {
      switch(ruleIcon) {
        case 'brain': return <Brain className="h-5 w-5" />;
        case 'shield': return <Shield className="h-5 w-5" />;
        case 'bar-chart': return <BarChart className="h-5 w-5" />;
        default: return <AlertCircle className="h-5 w-5" />;
      }
    };
    
    // Get the appropriate status icon
    const StatusIcon = alignmentClass === 'success' 
      ? <CheckCircle2 className="h-5 w-5 text-green-500" /> 
      : <AlertCircle className="h-5 w-5 text-amber-500" />;
    
    return (
      <div className="space-y-4 w-full">
        {/* Status indicator with subtle animation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "p-3 rounded-md border flex items-center gap-3 shadow-sm",
            alignmentClass === 'success' 
              ? "bg-gradient-to-r from-green-50 to-green-50/50 border-green-200 dark:bg-gradient-to-r dark:from-green-950/30 dark:to-green-900/10 dark:border-green-800/50" 
              : "bg-gradient-to-r from-amber-50 to-amber-50/50 border-amber-200 dark:bg-gradient-to-r dark:from-amber-950/30 dark:to-amber-900/10 dark:border-amber-800/50"
          )}
        >
          {StatusIcon}
          <div className="flex-1">
            <p className="font-medium text-sm">
              {alignmentClass === 'success' 
                ? `Strong alignment with ${ruleMatch}` 
                : `Potential alignment with ${ruleMatch}`
              }
            </p>
          </div>
        </motion.div>
        
        {/* Main rule card with enhanced styling */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className={cn(
            "overflow-hidden shadow-md transition-all hover:shadow-lg",
            ruleNumber === 1 ? "border-blue-200 dark:border-blue-900/50" :
            ruleNumber === 2 ? "border-purple-200 dark:border-purple-900/50" :
            "border-amber-200 dark:border-amber-900/50"
          )}>
            <CardHeader className={cn(
              "pb-3",
              ruleNumber === 1 
                ? "bg-gradient-to-r from-blue-50 to-blue-50/30 border-b border-blue-100 dark:from-blue-900/20 dark:to-blue-800/5 dark:border-blue-900/30" 
                : ruleNumber === 2 
                ? "bg-gradient-to-r from-purple-50 to-purple-50/30 border-b border-purple-100 dark:from-purple-900/20 dark:to-purple-800/5 dark:border-purple-900/30" 
                : "bg-gradient-to-r from-amber-50 to-amber-50/30 border-b border-amber-100 dark:from-amber-900/20 dark:to-amber-800/5 dark:border-amber-900/30"
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-full shadow-inner",
                    ruleNumber === 1 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                    ruleNumber === 2 ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                  )}>
                    <IconComponent />
                  </div>
                  <CardTitle className="text-lg font-semibold tracking-tight">{ruleMatch}</CardTitle>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              <blockquote className={cn(
                "relative border-l-4 pl-5 italic text-muted-foreground my-4 py-3 bg-muted/30 rounded-r-md",
                ruleNumber === 1 ? "border-blue-300 dark:border-blue-700" :
                ruleNumber === 2 ? "border-purple-300 dark:border-purple-700" :
                "border-amber-300 dark:border-amber-700"
              )}>
                <span className="absolute -left-1 -top-3 text-3xl text-muted-foreground opacity-20">"</span>
                {quote}
                <span className="absolute -right-1 -bottom-4 text-3xl text-muted-foreground opacity-20">"</span>
              </blockquote>
              <p className="mt-4 text-foreground leading-relaxed">{advice}</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  };

  // Add a window resize listener for responsiveness
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsMinimized(false); // Always expand on mobile
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initialize on mount
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  if (!isOpen) {
    return (
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Button 
          onClick={() => setIsOpen(true)} 
          className="rounded-full h-14 w-14 bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/20"
          aria-label="Open Aethera Advisor"
        >
          <Bot className="h-7 w-7" />
        </Button>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ 
            x: 0, 
            opacity: 1,
            height: isMinimized ? '64px' : 'auto'
          }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className={cn(
            "border-l border-border bg-card flex flex-col z-40 shadow-xl", 
            isMinimized ? "h-16" : "h-screen",
            panelWidth
          )}
        >
          {/* Enhanced Header */}
          <div className="p-3 border-b flex items-center justify-between bg-gradient-to-r from-card to-card/95">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-md">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Aethera Advisor</h2>
                <p className="text-xs text-muted-foreground">Personal guidance system</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-muted/80" 
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-muted/80" 
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Message area - hidden when minimized */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-card/90 to-card">
                {messages.map((msg, index) => (
                  <motion.div 
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className={cn(
                      "rounded-lg",
                      msg.role === 'user' 
                        ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground ml-auto max-w-[85%] p-3 shadow-md shadow-primary/10" 
                        : msg.content.startsWith('{') 
                          ? "bg-transparent w-full p-0" 
                          : "bg-muted max-w-[85%] p-3 shadow-sm"
                    )}
                  >
                    {/* Role indicator for better conversation tracking */}
                    {msg.role === 'user' && (
                      <div className="flex items-center gap-2 mb-1 opacity-80">
                        <UserCircle className="h-4 w-4" />
                        <span className="text-xs">You</span>
                      </div>
                    )}
                    {msg.role === 'assistant' && !msg.content.startsWith('{') && (
                      <div className="flex items-center gap-2 mb-1 opacity-80">
                        <Bot className="h-4 w-4" />
                        <span className="text-xs">Aethera Advisor</span>
                      </div>
                    )}
                    
                    {/* For assistant messages, try to use the card if possible */}
                    {msg.role === 'assistant' ? (
                      msg.content.startsWith('{') ? (
                        <RuleResponseCard response={msg.content} />
                      ) : (
                        <div className="prose prose-sm dark:prose-invert">
                          {msg.content.split('\n\n').map((paragraph: string, i: number) => {
                            // Handle bold text with **
                            const formattedText = paragraph.replace(
                              /\*\*(.*?)\*\*/g, 
                              '<strong>$1</strong>'
                            );
                            
                            return (
                              <p 
                                key={i} 
                                dangerouslySetInnerHTML={{ __html: formattedText }}
                                className="mb-2 leading-relaxed"
                              />
                            );
                          })}
                        </div>
                      )
                    ) : (
                      <p className="leading-relaxed">{msg.content}</p>
                    )}
                  </motion.div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Enhanced Input area */}
              <form onSubmit={handleSubmit} className="p-3 border-t flex items-center gap-2 bg-card/95">
                <div className="relative flex-1">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Share an action or thought..."
                    className="flex-1 bg-muted/50 focus-visible:ring-primary/30 pr-8 shadow-sm"
                    disabled={isLoading}
                  />
                  {isLoading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-opacity-50 border-t-primary rounded-full"></div>
                    </div>
                  )}
                </div>
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 shadow-sm"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
