import { supabase } from './client';

export interface AdminChatConversation {
  id: string;
  title: string;
  admin_user_id: string;
  created_at: string;
  updated_at: string;
}

export interface AdminChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  model_used?: string;
  tokens_used?: number;
  processing_time_ms?: number;
  created_at: string;
}

export interface ChatResponse {
  success: boolean;
  message?: string;
  conversations?: AdminChatConversation[];
  conversation?: AdminChatConversation;
  messages?: AdminChatMessage[];
  model_used?: string;
  tokens_used?: number;
  processing_time_ms?: number;
  error?: string;
}

class AdminChatService {
  private async callChatFunction(action: string, data: any = {}): Promise<ChatResponse> {
    try {
      const { data: response, error } = await supabase.functions.invoke('admin-ai-chat', {
        body: { action, ...data }
      });

      if (error) {
        throw error;
      }

      return response;
    } catch (error) {
      console.error(`Admin chat ${action} error:`, error);
      throw error;
    }
  }

  async getConversations(): Promise<AdminChatConversation[]> {
    const response = await this.callChatFunction('get_conversations');
    return response.conversations || [];
  }

  async createConversation(title?: string): Promise<AdminChatConversation> {
    const response = await this.callChatFunction('create_conversation', { title });
    if (!response.conversation) {
      throw new Error('Failed to create conversation');
    }
    return response.conversation;
  }

  async deleteConversation(conversationId: string): Promise<void> {
    await this.callChatFunction('delete_conversation', { conversationId });
  }

  async getMessages(conversationId: string): Promise<AdminChatMessage[]> {
    const response = await this.callChatFunction('get_messages', { conversationId });
    return response.messages || [];
  }

  async sendMessage(conversationId: string, message: string): Promise<{
    message: string;
    model_used?: string;
    tokens_used?: number;
    processing_time_ms?: number;
  }> {
    const response = await this.callChatFunction('send_message', { conversationId, message });
    return {
      message: response.message || '',
      model_used: response.model_used,
      tokens_used: response.tokens_used,
      processing_time_ms: response.processing_time_ms
    };
  }

  async getBusinessContext(): Promise<any> {
    try {
      const { data, error } = await supabase.functions.invoke('business-context');
      
      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Business context error:', error);
      throw error;
    }
  }
}

export const adminChatService = new AdminChatService();