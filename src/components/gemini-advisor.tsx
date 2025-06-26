import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Minimize2, Maximize2, X, Bot, CheckCircle2, AlertCircle, Brain, Shield, BarChart, UserCircle, Settings, Zap, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { generateGeminiResponse, GeminiChatSession } from '@/lib/gemini-config';
import { agenticService, AgenticAction, ActionResult } from '@/lib/agenticService';
import { toast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useNavigate } from 'react-router-dom';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  actionResult?: ActionResult;
};

const LIFE_RULES = `// ...existing code...`;

export function GeminiAdvisorPanel() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [agenticMode, setAgenticMode] = useState(false);
  const [chatSession, setChatSession] = useState<GeminiChatSession | null>(null);
  const [pendingAction, setPendingAction] = useState<AgenticAction | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Add navigation event listener for agentic navigation
  useEffect(() => {
    const handleAgenticNavigation = (event: CustomEvent) => {
      const { route } = event.detail;
      if (route) {
        navigate(route);
      }
    };

    window.addEventListener('agentic-navigation', handleAgenticNavigation as EventListener);
    return () => {
      window.removeEventListener('agentic-navigation', handleAgenticNavigation as EventListener);
    };
  }, [navigate]);

  // Load messages from localStorage on initial render
  useEffect(() => {
    try {
      const storedMessages = localStorage.getItem('gemini-advisor-messages');
      const storedAgenticMode = localStorage.getItem('gemini-agentic-mode') === 'true';
      
      setAgenticMode(storedAgenticMode);
      
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        const welcomeMessage = storedAgenticMode
          ? 'Hello! I\'m your Agentic Aethera Advisor. I can provide life guidance AND take actions for you! Try asking: "Create a task to call mom" or "Change theme to dark mode". I can also give traditional advice - just ask about any situation!'
          : 'Hello! I\'m your Aethera Advisor. Share an action or thought, and I\'ll provide feedback based on your life rules. For example, try asking: "Can I teach someone algebra?" or "I want to learn a new skill."';
        
        setMessages([
          { 
            role: 'assistant', 
            content: welcomeMessage
          }
        ]);
      }
      
      // Initialize chat session
      setChatSession(new GeminiChatSession(LIFE_RULES, storedAgenticMode));
    } catch (error) {
      console.error("Failed to parse messages from localStorage", error);
      setMessages([
        { 
          role: 'assistant', 
          content: 'Hello! I\'m your Aethera Advisor. Share an action or thought, and I\'ll provide feedback based on your life rules.'
        }
      ]);
      setChatSession(new GeminiChatSession(LIFE_RULES, false));
    }
  }, []);

  // Save messages and agentic mode to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('gemini-advisor-messages', JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('gemini-agentic-mode', agenticMode.toString());
    if (chatSession) {
      chatSession.setAgenticMode(agenticMode);
    }
  }, [agenticMode, chatSession]);

  // Toggle agentic mode
  const handleAgenticModeToggle = (enabled: boolean) => {
    setAgenticMode(enabled);
    
    const modeMessage = enabled 
      ? 'Agentic mode enabled! I can now take actions for you. Try commands like "Create a task to..." or "Change theme to..."'
      : 'Agentic mode disabled. I\'ll focus on providing life guidance and advice.';
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: modeMessage
    }]);
  };

  // Call the actual Gemini API with agentic capabilities
  const callGeminiAPI = async (userMessage: string) => {
    setIsLoading(true);
    
    try {
      let response: string;
      
      if (chatSession) {
        // Use chat session for context-aware responses
        response = await chatSession.sendMessage(userMessage);
      } else {
        // Fallback to direct API call
        response = await generateGeminiResponse(userMessage, LIFE_RULES, agenticMode);
      }
      
      // Parse the response to check if it's an action
      try {
        const parsedResponse = JSON.parse(response);
        
        if (parsedResponse.type === 'action' && parsedResponse.action) {
          // Handle action request
          const agenticAction: AgenticAction = parsedResponse;
          
          if (agenticAction.action?.confirmationRequired) {
            // Show confirmation dialog for dangerous actions
            setPendingAction(agenticAction);
            setShowConfirmDialog(true);
            
            // Add message to chat about pending confirmation
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: parsedResponse.content || 'Action requires confirmation.'
            }]);
            
            return null; // Don't return response since we added it to messages
          } else {
            // Execute action immediately
            const result = await agenticService.executeAction(agenticAction);
            
            // Add the assistant message with action result
            const responseMessage = `${parsedResponse.content || 'Action requested!'}\n\n${result.success ? '✅ ' : '❌ '}${result.message}`;
            
            // Store action result for display
            setMessages(prev => [...prev, { 
              role: 'assistant', 
              content: responseMessage,
              actionResult: result
            }]);
            
            return null; // Don't return response since we added it to messages
          }
        } else {
          // Regular advice response
          return response;
        }
      } catch (parseError) {
        // If parsing fails, treat as regular advice
        return response;
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      return 'Sorry, I encountered an error processing your request. Please try again.';
    } finally {
      setIsLoading(false);
    }
  };

  // Execute pending action after confirmation
  const executePendingAction = async () => {
    if (pendingAction) {
      const result = await agenticService.executeAction(pendingAction);
      
      const responseMessage = `${pendingAction.content || 'Action completed!'}\n\n${result.success ? '✅ ' : '❌ '}${result.message}`;
      
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: responseMessage,
        actionResult: result
      }]);
      
      setPendingAction(null);
      setShowConfirmDialog(false);
    }
  };

  // Cancel pending action
  const cancelPendingAction = () => {
    setPendingAction(null);
    setShowConfirmDialog(false);
    
    setMessages(prev => [...prev, { 
      role: 'assistant', 
      content: 'Action cancelled. How else can I help you?'
    }]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    const userMessage = input;
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    
    // Get response from Gemini (with potential action execution)
    const response = await callGeminiAPI(userMessage);
    
    // Only add assistant response if it wasn't already added in callGeminiAPI
    // Check if the last message is already an assistant message with similar content
    if (response) {
      setMessages(prev => {
        const lastMessage = prev[prev.length - 1];
        const isAlreadyAdded = lastMessage && 
          lastMessage.role === 'assistant' && 
          (lastMessage.content === response || 
           lastMessage.content.includes(response) ||
           response.includes(lastMessage.content));
        
        if (!isAlreadyAdded) {
          return [...prev, { role: 'assistant', content: response }];
        }
        return prev;
      });
    }
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
    type?: 'advice' | 'action';
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
    
    // Skip rendering if it's an action type (handled elsewhere)
    if (parsedResponse.type === 'action') {
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

  // Component to render action results
  const ActionResultCard = ({ result }: { result: ActionResult }) => {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "p-3 rounded-lg border flex items-start gap-3 shadow-sm",
          result.success 
            ? "bg-gradient-to-r from-green-50 to-green-50/50 border-green-200 dark:bg-gradient-to-r dark:from-green-950/30 dark:to-green-900/10 dark:border-green-800/50" 
            : "bg-gradient-to-r from-red-50 to-red-50/50 border-red-200 dark:bg-gradient-to-r dark:from-red-950/30 dark:to-red-900/10 dark:border-red-800/50"
        )}
      >
        <div className="flex-shrink-0 mt-0.5">
          {result.success ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
        </div>
        <div className="flex-1">
          <p className="font-medium text-sm">
            {result.success ? 'Action Completed' : 'Action Failed'}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {result.message}
          </p>
          {result.error && (
            <p className="text-xs text-red-600 mt-1">
              Error: {result.error}
            </p>
          )}
        </div>
      </motion.div>
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
          <div className="p-3 border-b bg-gradient-to-r from-card to-card/95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-md transition-colors",
                  agenticMode ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20" : "bg-primary/10"
                )}>
                  {agenticMode ? (
                    <Zap className="h-5 w-5 text-purple-600" />
                  ) : (
                    <Bot className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    Aethera Advisor
                    {agenticMode && (
                      <span className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full">
                        AGENTIC
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {agenticMode ? 'AI assistant with actions' : 'Personal guidance system'}
                  </p>
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
            
            {/* Agentic Mode Toggle - only show when not minimized */}
            {!isMinimized && (
              <div className="mt-3 flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Agentic Mode</span>
                  <span className="text-xs text-muted-foreground">
                    {agenticMode ? 'Can take actions' : 'Advice only'}
                  </span>
                </div>
                <Switch
                  checked={agenticMode}
                  onCheckedChange={handleAgenticModeToggle}
                />
              </div>
            )}
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
                    
                    {/* For assistant messages, handle different response types */}
                    {msg.role === 'assistant' ? (
                      <div className="space-y-2">
                        {msg.content.startsWith('{') ? (
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
                        )}
                        
                        {/* Show action result if available */}
                        {msg.actionResult && (
                          <ActionResultCard result={msg.actionResult} />
                        )}
                      </div>
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
                    placeholder={agenticMode 
                      ? "Ask for advice or request actions: 'Create a task...', 'Change theme...', 'Export data'"
                      : "Share an action or thought..."
                    }
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
      
      {/* Confirmation Dialog for Dangerous Actions */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Confirm Action
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.action?.confirmationMessage || 
               'This action requires confirmation. Are you sure you want to proceed?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelPendingAction}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={executePendingAction}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatePresence>
  );
}
