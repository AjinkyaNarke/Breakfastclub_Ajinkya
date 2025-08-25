import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Send, Bot, User, Plus, MessageCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useAdminChat } from '@/hooks/useAdminChat';
import ReactMarkdown from 'react-markdown';

export default function AdminChat() {
  const { t } = useTranslation('admin');
  const [input, setInput] = useState('');
  const [creatingConversation, setCreatingConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    conversations,
    currentConversation,
    loadingConversations,
    messages,
    loadingMessages,
    isTyping,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    refreshConversations
  } = useAdminChat();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping || !currentConversation) return;

    const messageContent = input.trim();
    setInput('');
    
    try {
      await sendMessage(messageContent);
      // Scroll to bottom after sending
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Send message error:', error);
      // Restore input on error
      setInput(messageContent);
    }
  };

  const handleDeleteConversation = async () => {
    if (!currentConversation) return;
    
    try {
      await deleteConversation(currentConversation.id);
    } catch (error) {
      console.error('Delete conversation error:', error);
    }
  };

  const handleNewConversation = async () => {
    if (creatingConversation) return;
    
    setCreatingConversation(true);
    try {
      await createConversation();
      // Focus input after creating conversation
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error('Create conversation error:', error);
      toast({
        title: "Error",
        description: "Failed to create new conversation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setCreatingConversation(false);
    }
  };

  // Auto-select first conversation if exists and none is selected
  useEffect(() => {
    if (!loadingConversations && conversations.length > 0 && !currentConversation) {
      // Auto-select the first conversation if none is selected
      selectConversation(conversations[0].id);
    }
  }, [conversations, loadingConversations, currentConversation, selectConversation]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N for new conversation
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNewConversation();
      }
      // Focus input with /
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
        {/* Conversations Sidebar */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversations</CardTitle>
              <Button
                onClick={handleNewConversation}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0"
                disabled={loadingConversations || creatingConversation}
                title="Create new conversation (Ctrl+N)"
              >
                {(loadingConversations || creatingConversation) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingConversations ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <div className="space-y-1 max-h-[500px] overflow-y-auto">
                {conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => selectConversation(conversation.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                      currentConversation?.id === conversation.id ? 'bg-accent' : ''
                    }`}
                  >
                    <MessageCircle className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{conversation.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conversation.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                {conversations.length === 0 && !loadingConversations && (
                  <div className="text-center text-muted-foreground p-8">
                    <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm mb-4">No conversations yet</p>
                    <Button
                      onClick={handleNewConversation}
                      size="sm"
                      variant="outline"
                      className="flex items-center gap-2"
                      disabled={creatingConversation}
                    >
                      {creatingConversation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Start First Chat
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Chat Area */}
        <Card className="lg:col-span-3 flex flex-col">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  {currentConversation?.title || t('chat.assistant', 'Business Intelligence Assistant')}
                </CardTitle>
                <CardDescription>
                  {t('chat.description', 'Powered by advanced AI with access to your business data')}
                </CardDescription>
              </div>
              {currentConversation && (
                <Button
                  variant="outline"
                  onClick={handleDeleteConversation}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  {t('chat.deleteConversation', 'Delete')}
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth">
              {currentConversation ? (
                <>
                  {loadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mr-2" />
                      <span className="text-muted-foreground">Loading messages...</span>
                    </div>
                  ) : (
                    <>
                      {messages.length === 0 && (
                        <div className="flex gap-3 justify-start">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                            <Bot className="h-4 w-4" />
                          </div>
                          <div className="px-4 py-2 rounded-lg bg-muted text-foreground">
                            <div className="text-sm prose prose-sm max-w-none prose-gray">
                              <ReactMarkdown>
                                Hello! I'm your **AI business assistant**. I have access to your menu, ingredients, events, and business data. How can I help you today?
                              </ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {messages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex gap-3 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`flex gap-3 max-w-[80%] ${
                              message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                              message.role === 'user' 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              {message.role === 'user' ? (
                                <User className="h-4 w-4" />
                              ) : (
                                <Bot className="h-4 w-4" />
                              )}
                            </div>
                            <div
                              className={`px-4 py-2 rounded-lg ${
                                message.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted text-foreground'
                              }`}
                            >
                              <div className={`text-sm prose prose-sm max-w-none ${
                                message.role === 'user'
                                  ? 'prose-invert'
                                  : 'prose-gray'
                              }`}>
                                <ReactMarkdown 
                                  components={{
                                    p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                    ul: ({ children }) => <ul className="mb-2 pl-4">{children}</ul>,
                                    ol: ({ children }) => <ol className="mb-2 pl-4">{children}</ol>,
                                    li: ({ children }) => <li className="mb-1">{children}</li>,
                                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                                    em: ({ children }) => <em className="italic">{children}</em>,
                                    code: ({ children }) => (
                                      <code className="bg-gray-100 px-1 py-0.5 rounded text-xs font-mono">
                                        {children}
                                      </code>
                                    ),
                                    pre: ({ children }) => (
                                      <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                        {children}
                                      </pre>
                                    ),
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                              <div className={`flex items-center justify-between mt-1 text-xs ${
                                message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                              }`}>
                                <span>{new Date(message.created_at).toLocaleTimeString()}</span>
                                {message.model_used && message.role === 'assistant' && (
                                  <span className="ml-2 opacity-70">
                                    {message.model_used === 'deepseek-reasoner' ? 'R1' : 'V3'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {isTyping && (
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
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  <div className="text-center">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">Welcome to AI Business Assistant</p>
                    <p className="text-sm mb-6">Select a conversation or create a new one to start chatting</p>
                    <Button
                      onClick={handleNewConversation}
                      className="flex items-center gap-2"
                      disabled={creatingConversation}
                    >
                      {creatingConversation ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Start New Conversation
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            {currentConversation && (
              <div className="border-t p-4 bg-muted/20">
                <form onSubmit={handleSend} className="flex gap-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={t('chat.inputPlaceholder', 'Ask me about your business... (Press / to focus)')}
                    className="flex-1"
                    disabled={isTyping}
                    autoComplete="off"
                  />
                  <Button 
                    type="submit" 
                    disabled={isTyping || !input.trim()}
                    className="px-6"
                  >
                    {isTyping ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
                <div className="mt-2 text-xs text-muted-foreground text-center">
                  <span>Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+N</kbd> for new chat • <kbd className="px-1 py-0.5 bg-muted rounded text-xs">/</kbd> to focus input</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 