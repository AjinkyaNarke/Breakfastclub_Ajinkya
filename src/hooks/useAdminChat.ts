import { useState, useEffect, useCallback } from 'react';
import { adminChatService, AdminChatConversation, AdminChatMessage } from '@/integrations/supabase/adminChat';
import { useToast } from '@/hooks/use-toast';

export interface UseAdminChatReturn {
  // Conversations
  conversations: AdminChatConversation[];
  currentConversation: AdminChatConversation | null;
  loadingConversations: boolean;
  
  // Messages
  messages: AdminChatMessage[];
  loadingMessages: boolean;
  
  // Chat state
  isTyping: boolean;
  
  // Actions
  createConversation: (title?: string) => Promise<void>;
  selectConversation: (conversationId: string) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

export const useAdminChat = (): UseAdminChatReturn => {
  const { toast } = useToast();
  
  // State
  const [conversations, setConversations] = useState<AdminChatConversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<AdminChatConversation | null>(null);
  const [messages, setMessages] = useState<AdminChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Load conversations on mount
  const refreshConversations = useCallback(async () => {
    setLoadingConversations(true);
    try {
      // TEMPORARY: Disable chat functionality until auth is fixed
      console.warn('Admin chat temporarily disabled due to authentication mismatch');
      setConversations([]);
      toast({
        title: "Chat Temporarily Disabled",
        description: "Admin chat feature is being updated. Please check back later.",
        variant: "default"
      });
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations",
        variant: "destructive"
      });
    } finally {
      setLoadingConversations(false);
    }
  }, [toast]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // Create new conversation
  const createConversation = useCallback(async (title?: string) => {
    try {
      const newConversation = await adminChatService.createConversation(title || 'New Chat');
      setConversations(prev => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setMessages([]);
      
      toast({
        title: "Success",
        description: "New conversation created",
        variant: "default"
      });
      
      return newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: "Failed to create conversation",
        variant: "destructive"
      });
      throw error;
    }
  }, [toast]);

  // Select conversation and load messages
  const selectConversation = useCallback(async (conversationId: string) => {
    const conversation = conversations.find(c => c.id === conversationId);
    if (!conversation) return;

    setCurrentConversation(conversation);
    setLoadingMessages(true);
    
    try {
      const fetchedMessages = await adminChatService.getMessages(conversationId);
      setMessages(fetchedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive"
      });
    } finally {
      setLoadingMessages(false);
    }
  }, [conversations, toast]);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await adminChatService.deleteConversation(conversationId);
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      
      // If deleted conversation was current, clear current
      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
      }
      
      toast({
        title: "Success",
        description: "Conversation deleted",
        variant: "default"
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    }
  }, [currentConversation, toast]);

  // Send message
  const sendMessage = useCallback(async (messageContent: string) => {
    if (!currentConversation || !messageContent.trim()) return;

    // Add user message immediately
    const userMessage: AdminChatMessage = {
      id: `temp-user-${Date.now()}`,
      conversation_id: currentConversation.id,
      role: 'user',
      content: messageContent.trim(),
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await adminChatService.sendMessage(currentConversation.id, messageContent.trim());
      
      // Remove temporary user message and add both real user message and assistant response
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== userMessage.id);
        
        const realUserMessage: AdminChatMessage = {
          ...userMessage,
          id: `user-${Date.now()}`
        };

        const assistantMessage: AdminChatMessage = {
          id: `assistant-${Date.now()}`,
          conversation_id: currentConversation.id,
          role: 'assistant',
          content: response.message,
          model_used: response.model_used,
          tokens_used: response.tokens_used,
          processing_time_ms: response.processing_time_ms,
          created_at: new Date().toISOString()
        };

        return [...withoutTemp, realUserMessage, assistantMessage];
      });

      // Update conversation timestamp in list
      setConversations(prev => prev.map(c => 
        c.id === currentConversation.id 
          ? { ...c, updated_at: new Date().toISOString() }
          : c
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove user message on error
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTyping(false);
    }
  }, [currentConversation, toast]);

  return {
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
  };
};