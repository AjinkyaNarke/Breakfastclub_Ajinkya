# Task List: AI Restaurant Analytics Platform
**Based on PRD:** `/tasks/prd-ai-mark-analytics-platform.md`
**Generated:** 2024-07-25

## High-Level Tasks

### Task 1: AI Model Integration & Routing
**Assigned to:** Backend
**Description:** Integrate DeepSeek R1 and V3 models, Deepgram for voice input, and implement intelligent model routing for analytics and chat.

#### Subtasks:
- [ ] `[CLAUDE_CODE]` Integrate DeepSeek R1 and V3 APIs for business reasoning and chat.
- [ ] `[CLAUDE_CODE]` Integrate Deepgram API for voice-to-text sales input.
- [ ] `[CLAUDE_CODE]` Implement intelligent model routing logic based on query complexity.
- [ ] `[CLAUDE_CODE]` Write unit and integration tests for model integration and routing.

---

### Task 2: Sales Data Input System
**Assigned to:** Mixed (Backend + Frontend)
**Description:** Build manual and voice-based sales entry (form and mic), with support for backdating, editing, and data validation.
**Status:** 🗑️ **DISCARDED** - Module removed from scope but files preserved

#### Subtasks:
- [x] `[CURSOR_AGENT]` Design and implement manual sales entry form (desktop/mobile). *(DISCARDED)*
- [x] `[CURSOR_AGENT]` Implement mic button and UI for voice sales input. *(DISCARDED)*
- [x] `[CURSOR_AGENT]` Add support for editing and backdating sales data. *(DISCARDED)*
- [x] `[CURSOR_AGENT]` Display validation errors and mark weeks with missing data. *(DISCARDED)*
- [ ] `[CLAUDE_CODE]` Create backend endpoints for sales data CRUD (create, read, update, delete). *(DISCARDED)*
- [ ] `[CLAUDE_CODE]` Validate and store sales data, including voice-parsed input. *(DISCARDED)*
- [ ] `[CLAUDE_CODE]` Write backend tests for sales data handling. *(DISCARDED)*

---

### Task 3: Analytics & Reporting Engine
**Assigned to:** Backend
**Description:** Implement real-time profitability analysis, historical comparisons, and AI-powered recommendations using business data.
**Status:** 🗑️ **DISCARDED** - Module removed from scope but files preserved

#### Subtasks:
- [ ] `[CLAUDE_CODE]` Develop analytics engine for profitability, cost, and margin calculations. *(DISCARDED)*
- [ ] `[CLAUDE_CODE]` Implement historical comparison logic (week-over-week, trends). *(DISCARDED)*
- [ ] `[CLAUDE_CODE]` Integrate AI-powered recommendation generation. *(DISCARDED)*
- [ ] `[CLAUDE_CODE]` Expose analytics and reporting endpoints. *(DISCARDED)*
- [ ] `[CLAUDE_CODE]` Write tests for analytics and reporting logic. *(DISCARDED)*

---

### Task 4: Conversational Business Intelligence UI
**Assigned to:** Frontend
**Description:** Create a chat interface for natural language queries and report delivery, optimized for both desktop and mobile.

#### Subtasks:
- [x] `[CURSOR_AGENT]` Design and implement chat UI for business intelligence queries.
- [x] `[CURSOR_AGENT]` Integrate chat UI with backend conversational endpoints.
- [x] `[CURSOR_AGENT]` Display AI-generated responses and reports in chat.
- [x] `[CURSOR_AGENT]` Ensure mobile and desktop responsiveness.
- [x] `[CURSOR_AGENT]` Write frontend tests for chat interface.

---

### Task 5: Cost Monitoring & Usage Management
**Assigned to:** Mixed (Backend + Frontend)
**Description:** Track AI/model usage in points, display usage in settings, and implement recharge reminders and data summarization/foldering for large datasets.

#### Subtasks:
- [ ] `[CLAUDE_CODE]` Implement backend logic for tracking usage in points.
- [ ] `[CLAUDE_CODE]` Add summarization/foldering logic for large datasets.
- [ ] `[CURSOR_AGENT]` Display usage points and recharge reminders in settings UI.
- [ ] `[CURSOR_AGENT]` Notify user when usage is high or recharge is needed.
- [ ] `[CLAUDE_CODE]` Write tests for usage tracking and summarization.

---

### Task 6: GDPR Compliance & Data Privacy
**Assigned to:** Backend
**Description:** Ensure all data handling, storage, and export/delete features are GDPR compliant.

#### Subtasks:
- [ ] `[CLAUDE_CODE]` Implement data export and delete endpoints for user data.
- [ ] `[CLAUDE_CODE]` Ensure all data storage and processing is GDPR compliant.
- [ ] `[CLAUDE_CODE]` Add privacy policy and compliance documentation.
- [ ] `[CLAUDE_CODE]` Write tests for data privacy features.

---

### Task 7: Executive Summary & Sharing
**Assigned to:** Frontend
**Description:** Build a dashboard for executive-level reports and enable easy sharing/export of insights.

#### Subtasks:
- [ ] `[CURSOR_AGENT]` Design and implement executive summary dashboard UI.
- [ ] `[CURSOR_AGENT]` Integrate dashboard with analytics/reporting backend.
- [ ] `[CURSOR_AGENT]` Add sharing/export functionality (PDF, link, etc.).
- [ ] `[CURSOR_AGENT]` Write frontend tests for dashboard and sharing features.

---

## Relevant Files

### Backend Files (Claude Code)
- `supabase/functions/ai-analytics/index.ts` - Main Edge Function for AI analytics and model routing *(DISCARDED)*
- `supabase/functions/voice-sales-input/index.ts` - Voice-to-text sales input handler *(DISCARDED)*
- `src/integrations/deepseek/` - DeepSeek API integration logic *(DISCARDED)*
- `src/integrations/deepgram/` - Deepgram API integration logic *(DISCARDED)*
- `src/lib/contextManagement.ts` - Data summarization/foldering utilities *(DISCARDED)*
- `src/lib/usagePoints.ts` - Usage/cost tracking logic *(DISCARDED)*
- `test/ai-analytics.test.ts` - Backend analytics and model routing tests *(DISCARDED)*

### Frontend Files (Cursor Agent)
- `src/pages/AnalyticsDashboard.tsx` - Main analytics/reporting dashboard *(DISCARDED)*
- `src/components/SalesInputForm.tsx` - Manual sales entry form *(DISCARDED)*
- `src/components/VoiceSalesInput.tsx` - Voice input component *(DISCARDED)*
- `src/components/ChatInterface.tsx` - Conversational AI chat UI
- `src/components/UsageMonitor.tsx` - Usage/cost points display *(DISCARDED)*
- `src/components/ExecutiveReportShare.tsx` - Report sharing/export UI *(DISCARDED)*
- `test/AnalyticsDashboard.test.tsx` - Frontend analytics/reporting tests *(DISCARDED)*

### Shared/Config Files
- `src/types/analytics.d.ts` - Shared types/interfaces for analytics *(DISCARDED)*
- `public/locales/` - i18n files for multi-language support

## Implementation Notes
- All tasks must follow GDPR and privacy best practices.
- Usage/cost is tracked in points, not currency.
- Data summarization/foldering is required for large datasets.
- Mobile and desktop UX must be considered for all user-facing features. 