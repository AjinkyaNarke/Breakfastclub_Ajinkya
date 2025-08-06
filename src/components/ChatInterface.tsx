import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, RefreshCw, AlertCircle, Bot, User } from 'lucide-react';

// Message type
interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: Date;
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 1, 
      sender: 'ai', 
      text: 'Welcome! I\'m your **AI business assistant**. I can help you with analytics, menu optimization, business insights, and more. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // API call with better error handling and fallback
  const fetchAIResponse = async (userMessage: string): Promise<string> => {
    const endpoints = [
      '/functions/ai-analytics',
      '/api/chat', // Fallback endpoint
    ];
    
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            query: userMessage, 
            queryType: 'chat',
            message: userMessage // Alternative format
          }),
        });
        
        if (res.ok) {
          const data = await res.json();
          return data.response || data.message || data.reply || 'Response received but no content.';
        }
        
        if (res.status === 404 && endpoint !== endpoints[endpoints.length - 1]) {
          continue; // Try next endpoint
        }
        
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || `HTTP ${res.status}`);
      } catch (err: unknown) {
        if (endpoint === endpoints[endpoints.length - 1]) {
          throw err; // Last endpoint, throw error
        }
        continue; // Try next endpoint
      }
    }
    
    throw new Error('All endpoints failed');
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!input.trim() || loading) return;
    
    const userMsg: Message = { 
      id: messages.length + 1, 
      sender: 'user', 
      text: input.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    const messageContent = input.trim();
    setInput('');
    setLoading(true);
    
    try {
      const aiText = await fetchAIResponse(messageContent);
      const aiMsg: Message = { 
        id: userMsg.id + 1, 
        sender: 'ai', 
        text: aiText,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMsg]);
      setRetryCount(0);
    } catch (err) {
      const errorMessage = (err as Error).message;
      setError(errorMessage);
      // Restore input on error
      setInput(messageContent);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleRetry = () => {
    if (input.trim()) {
      handleSend({ preventDefault: () => {} } as React.FormEvent);
    }
  };

  const handleNewConversation = () => {
    setMessages([
      { 
        id: 1, 
        sender: 'ai', 
        text: 'Welcome! I\'m your **AI business assistant**. I can help you with analytics, menu optimization, business insights, and more. What would you like to know?',
        timestamp: new Date()
      }
    ]);
    setError(null);
    setInput('');
    setRetryCount(0);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full max-h-[80vh] w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-semibold">AI Assistant</span>
        </div>
        <Button
          onClick={handleNewConversation}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar */}
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                msg.sender === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                {msg.sender === 'user' ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              
              {/* Message bubble */}
              <div className={`px-4 py-2 rounded-lg shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground'
              }`}>
                {msg.sender === 'ai' ? (
                  <div className={`text-sm prose prose-sm max-w-none ${
                    msg.sender === 'user' ? 'prose-invert' : 'prose-gray'
                  }`}>
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                        table: ({node, ...props}) => <table className="min-w-full border mt-2 mb-2 text-xs" {...props} />,
                        th: ({node, ...props}) => <th className="border px-2 py-1 bg-zinc-200 dark:bg-zinc-700" {...props} />,
                        td: ({node, ...props}) => <td className="border px-2 py-1" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc ml-4 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                        code: ({node, ...props}) => <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono" {...props} />,
                        pre: ({node, ...props}) => <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mt-2" {...props} />,
                        strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm">{msg.text}</p>
                )}
                
                {/* Timestamp */}
                {msg.timestamp && (
                  <div className={`text-xs mt-1 opacity-70 ${
                    msg.sender === 'user' ? 'text-primary-foreground' : 'text-muted-foreground'
                  }`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </div>
            <div className="px-4 py-2 rounded-lg bg-muted">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <span className="ml-2 text-xs text-muted-foreground">AI is thinking...</span>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mx-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              {retryCount < 3 && input.trim() && (
                <Button
                  onClick={handleRetry}
                  variant="outline"
                  size="sm"
                  className="ml-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 bg-muted/20">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask me about your business, menu, analytics..."
            className="flex-1"
            disabled={loading}
            autoComplete="off"
          />
          <Button 
            type="submit" 
            disabled={loading || !input.trim()}
            className="px-6"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
        
        {/* Helper text */}
        <div className="mt-2 text-xs text-muted-foreground text-center">
          {error ? (
            <span className="text-destructive">Connection issues? Try refreshing or contact support.</span>
          ) : (
            <span>Ask questions about your restaurant, menu, ingredients, or business analytics</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;