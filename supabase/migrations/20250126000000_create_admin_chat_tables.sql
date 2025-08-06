-- Create admin chat conversations table
CREATE TABLE IF NOT EXISTS admin_chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL DEFAULT 'New Chat',
    admin_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin chat messages table
CREATE TABLE IF NOT EXISTS admin_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES admin_chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    model_used TEXT,
    tokens_used INTEGER DEFAULT 0,
    processing_time_ms INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_chat_conversations_admin_user_id ON admin_chat_conversations(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_chat_conversations_created_at ON admin_chat_conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_conversation_id ON admin_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_admin_chat_messages_created_at ON admin_chat_messages(created_at);

-- Enable RLS
ALTER TABLE admin_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin chat conversations
CREATE POLICY "Admin users can view their own conversations" ON admin_chat_conversations
    FOR SELECT USING (admin_user_id = auth.uid());

CREATE POLICY "Admin users can create their own conversations" ON admin_chat_conversations
    FOR INSERT WITH CHECK (admin_user_id = auth.uid());

CREATE POLICY "Admin users can update their own conversations" ON admin_chat_conversations
    FOR UPDATE USING (admin_user_id = auth.uid());

CREATE POLICY "Admin users can delete their own conversations" ON admin_chat_conversations
    FOR DELETE USING (admin_user_id = auth.uid());

-- RLS policies for admin chat messages
CREATE POLICY "Admin users can view messages from their conversations" ON admin_chat_messages
    FOR SELECT USING (
        conversation_id IN (
            SELECT id FROM admin_chat_conversations WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY "Admin users can create messages in their conversations" ON admin_chat_messages
    FOR INSERT WITH CHECK (
        conversation_id IN (
            SELECT id FROM admin_chat_conversations WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY "Admin users can update messages in their conversations" ON admin_chat_messages
    FOR UPDATE USING (
        conversation_id IN (
            SELECT id FROM admin_chat_conversations WHERE admin_user_id = auth.uid()
        )
    );

CREATE POLICY "Admin users can delete messages from their conversations" ON admin_chat_messages
    FOR DELETE USING (
        conversation_id IN (
            SELECT id FROM admin_chat_conversations WHERE admin_user_id = auth.uid()
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_chat_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_admin_chat_conversations_updated_at
    BEFORE UPDATE ON admin_chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_chat_updated_at();