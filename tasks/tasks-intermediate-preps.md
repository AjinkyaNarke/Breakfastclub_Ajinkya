# Task List: Intermediate Preps for Cost Tracking
**Based on PRD:** `tasks/prd-intermediate-preps.md`
**Generated:** 2025-07-26

## High-Level Tasks

### Task 1: Database Schema and Migration
**Assigned to:** Backend (Claude Code)
**Description:** Create the database schema for preps and update existing tables to support prep references

#### Subtasks:
- [x] `[CLAUDE_CODE]` Create migration file for preps table with multilingual support
- [x] `[CLAUDE_CODE]` Create migration for prep_ingredients junction table
- [x] `[CLAUDE_CODE]` Update menu_item_ingredients table to support prep references
- [x] `[CLAUDE_CODE]` Add RLS policies for preps tables
- [x] `[CLAUDE_CODE]` Create database triggers for cost calculations
- [x] `[CLAUDE_CODE]` Add indexes for performance optimization

### Task 2: Backend API Development
**Assigned to:** Backend (Claude Code)
**Description:** Implement CRUD operations for preps and update existing APIs

#### Subtasks:
- [x] `[CLAUDE_CODE]` Create prep CRUD endpoints (create, read, update, delete)
- [x] `[CLAUDE_CODE]` Implement prep cost calculation logic
- [x] `[CLAUDE_CODE]` Update menu item endpoints to handle preps
- [x] `[CLAUDE_CODE]` Add validation for prep data
- [x] `[CLAUDE_CODE]` Implement prep search and filtering
- [x] `[CLAUDE_CODE]` Write backend tests for prep functionality

### Task 3: AI Chat Integration
**Assigned to:** Backend (Claude Code)
**Description:** Enhance AI chat to understand and manage preps

#### Subtasks:
- [x] `[CLAUDE_CODE]` Update admin-ai-chat function to include prep context
- [x] `[CLAUDE_CODE]` Add prep creation parsing logic
- [x] `[CLAUDE_CODE]` Implement prep query responses
- [x] `[CLAUDE_CODE]` Add prep cost analysis to AI responses
- [x] `[CLAUDE_CODE]` Update business context to include preps data

### Task 4: Frontend Prep Management
**Assigned to:** Frontend (Cursor Agent)
**Description:** Create admin interface for managing preps

#### Subtasks:
- [x] `[CURSOR_AGENT]` Create PrepManagement component
- [x] `[CURSOR_AGENT]` Build prep creation/editing dialog
- [x] `[CURSOR_AGENT]` Implement prep list view with search
- [x] `[CURSOR_AGENT]` Add prep cost display and breakdown
- [x] `[CURSOR_AGENT]` Create prep ingredient selector component
- [x] `[CURSOR_AGENT]` Add multilingual support for prep forms

### Task 5: Menu Item Integration
**Assigned to:** Frontend (Cursor Agent)
**Description:** Update menu item management to include preps

#### Subtasks:
- [x] `[CURSOR_AGENT]` Update MenuItemDialog to support preps
- [x] `[CURSOR_AGENT]` Add prep selector to ingredient management
            - [x] `[CURSOR_AGENT]` Update cost calculation display
            - [x] `[CURSOR_AGENT]` Enhance cost breakdown visualization
            - [x] `[CURSOR_AGENT]` Add prep usage tracking

### Task 6: TypeScript Types and Integration
**Assigned to:** Mixed (Backend + Frontend)
**Description:** Update type definitions and ensure proper integration

#### Subtasks:
- [x] `[CLAUDE_CODE]` Update Supabase types to include preps
- [x] `[CURSOR_AGENT]` Create frontend type definitions for preps
- [x] `[CURSOR_AGENT]` Update existing components to use new types
- [x] `[CLAUDE_CODE]` Add prep-related API response types
- [x] `[CURSOR_AGENT]` Update hooks to handle prep data

### Task 7: Testing and Validation
**Assigned to:** Mixed (Backend + Frontend)
**Description:** Comprehensive testing of the prep system

#### Subtasks:
- [x] `[CLAUDE_CODE]` Write integration tests for prep APIs
- [x] `[CURSOR_AGENT]` Create component tests for prep management
- [x] `[CURSOR_AGENT]` Add E2E tests for prep workflow
- [x] `[CLAUDE_CODE]` Test cost calculation accuracy
- [x] `[CURSOR_AGENT]` Test multilingual functionality
- [x] `[CLAUDE_CODE]` Validate AI chat integration

## Relevant Files

### Backend Files (Claude Code)
- `supabase/migrations/20250726000000_add_preps_table.sql` - Database migration for preps
- `supabase/migrations/20250726000001_add_prep_ingredients_table.sql` - Junction table migration
- `supabase/migrations/20250726000002_update_menu_item_ingredients.sql` - Update existing table
- `supabase/functions/admin-ai-chat/index.ts` - AI chat integration
- `src/integrations/supabase/types.ts` - TypeScript type definitions

### Frontend Files (Cursor Agent)
- `src/pages/admin/PrepManagement.tsx` - Main prep management page
- `src/components/admin/PrepDialog.tsx` - Prep creation/editing dialog
- `src/components/admin/PrepIngredientSelector.tsx` - Ingredient selection for preps
- `src/components/admin/PrepCostBreakdown.tsx` - Cost visualization
- `src/components/admin/EnhancedMenuItemDialog.tsx` - Updated menu item dialog
- `src/hooks/usePreps.ts` - Prep management hooks

### Shared/Config Files
- `src/types/preps.d.ts` - Frontend prep type definitions
- `public/locales/en/admin.json` - English translations
- `public/locales/de/admin.json` - German translations

## Implementation Notes
- Preps should be simple in MVP (no nested preps)
- Cost calculations should be real-time and accurate
- AI chat should be the primary interface for prep creation
- Multilingual support is required from the start
- Integration with existing ingredient and menu systems is critical
- Performance should be optimized for cost calculations

## Dependencies
- Task 1 must be completed before Task 2
- Task 2 must be completed before Task 3
- Task 4 depends on Task 2 completion
- Task 5 depends on Task 4 completion
- Task 6 should be done in parallel with other tasks
- Task 7 should be done after all other tasks are complete 