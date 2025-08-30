import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import ChatInterface from './ChatInterface';

export const FloatingChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={toggleChat}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg transition-all duration-300 hover:scale-110",
          "bg-primary hover:bg-primary/90 text-white",
          "flex items-center justify-center"
        )}
        aria-label="Open AI Chat"
      >
        <MessageCircle className="h-6 w-6" />
      </Button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:p-6">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={toggleChat}
          />
          
          {/* Chat Container */}
          <div className="relative w-full max-w-md h-[600px] bg-background rounded-lg shadow-2xl border border-border overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-muted/50">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">AI Assistant</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleChat}
                className="h-8 w-8 p-0 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Chat Interface */}
            <div className="h-[calc(600px-4rem)]">
              <ChatInterface />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatingChat;
