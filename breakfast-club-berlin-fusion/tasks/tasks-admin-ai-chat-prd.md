# Task List: Admin AI Chat - Business Intelligence Assistant
**Based on PRD:** Admin AI Chat PRD (Admin AI Chat - Business Intelligence Assistant)
**Generated:** 2025-07-25

## High-Level Tasks

### Task 1: Admin AI Chat Interface
**Assigned to:** Mixed (Backend + Frontend)
**Description:** Create simple admin chat interface with business context access and conversation management.

#### Subtasks:
- [x] `[CURSOR_AGENT]` Create admin chat page component with chat interface
- [x] `[CURSOR_AGENT]` Add chat navigation link to admin panel
- [x] `[CURSOR_AGENT]` Implement chat message display and input
- [x] `[CURSOR_AGENT]` Add delete conversation functionality
- [x] `[CURSOR_AGENT]` Style chat interface to match admin theme
- [x] `[CLAUDE_CODE]` Create admin chat API endpoint
- [x] `[CLAUDE_CODE]` Implement admin authentication check for chat access

### Task 2: Business Data Context for AI
**Assigned to:** Backend
**Description:** Provide AI with access to menu, ingredients, events, and business data for informed conversations.

#### Subtasks:
- [x] `[CLAUDE_CODE]` Create business context aggregation service
- [x] `[CLAUDE_CODE]` Integrate menu items and pricing data
- [x] `[CLAUDE_CODE]` Add ingredient costs and availability data
- [x] `[CLAUDE_CODE]` Include events and about us content
- [x] `[CLAUDE_CODE]` Build context formatting for AI prompts

### Task 3: AI Integration & Chat Management
**Assigned to:** Backend
**Description:** Integrate DeepSeek models and implement conversation storage with delete functionality.

#### Subtasks:
- [x] `[CLAUDE_CODE]` Integrate DeepSeek-R1 and DeepSeek-V3 APIs
- [x] `[CLAUDE_CODE]` Implement intelligent model routing logic
- [x] `[CLAUDE_CODE]` Create conversation storage and retrieval
- [x] `[CLAUDE_CODE]` Add conversation delete functionality
- [x] `[CLAUDE_CODE]` Implement context-aware AI responses

---

## Relevant Files

### Backend Files (Claude Code)
- `supabase/functions/admin-ai-chat/index.ts` - Main admin chat Edge Function
- `supabase/functions/business-context/index.ts` - Business data context service
- `src/lib/adminChatService.ts` - Admin chat business logic
- `src/lib/businessContext.ts` - Business data aggregation
- `src/lib/deepseekIntegration.ts` - DeepSeek model integration
- `supabase/migrations/` - Database tables for conversation storage

### Frontend Files (Cursor Agent)
- `src/pages/admin/AdminChat.tsx` - Admin chat page component
- `src/components/admin/AdminChatInterface.tsx` - Chat interface component
- `src/components/admin/AdminChatMessage.tsx` - Individual message component
- `src/components/admin/AdminChatInput.tsx` - Chat input component
- `src/components/admin/AdminChatHeader.tsx` - Chat header with delete option
- `src/hooks/useAdminChat.tsx` - Admin chat state management

### Shared/Config Files
- `src/types/adminChat.d.ts` - Admin chat type definitions
- `public/locales/en/admin.json` - Admin chat translations
- `public/locales/de/admin.json` - German admin chat translations

## Implementation Notes
- Simple chat interface like Claude - no complex features
- Admin authentication required for all chat access
- AI has read-only access to business data
- Maintain existing admin panel theme
- Support conversation deletion
- Use DeepSeek models for intelligent responses 