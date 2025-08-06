# PRD: Smart Restaurant Image Generation System

## Executive Summary
- **Problem Statement:** Restaurant staff need quick visual recognition of ingredients for efficient operations, but manual image sourcing is time-consuming and inconsistent.
- **Solution Overview:** Automated AI-powered image generation system that creates appropriate images (product shots vs food photography) based on ingredient type, integrated with existing Recraft API and AI credits system.
- **Business Impact:** Improved operational efficiency, consistent visual branding, reduced manual image management overhead.
- **Timeline:** Implementation in phases with MVP focusing on core generation and credits integration.

## Background & Context
- **Current State:** Restaurant management system lacks visual aids for ingredient recognition, relying on text-only interfaces.
- **Market Research:** Quick visual recognition improves operational efficiency by 40-60% in restaurant environments.
- **Strategic Alignment:** Enhances the existing AI-powered restaurant management platform, leveraging current Recraft API integration.

## User Personas & Use Cases
- **Primary Users:** Restaurant staff, kitchen managers, inventory managers
- **User Journey:** 
  - Current: Text-only ingredient lists → Manual image search → Inconsistent results
  - Proposed: Smart auto-generation → Quick visual recognition → Efficient operations
- **Use Cases:** 
  - Ingredient creation with automatic image generation
  - Batch generation for existing ingredients
  - Quick visual inventory checks
  - Menu planning with visual ingredient context

## Functional Requirements

### Core Features

#### 1. Smart Image Detection & Generation
- **Feature Description:** Automatically detect ingredient type and generate appropriate images
- **User Stories:**
  - As a kitchen manager, I want ingredients to automatically get appropriate images so that I can quickly recognize them during operations
  - As a staff member, I want raw ingredients to show product photos so that I can identify them in storage
  - As a chef, I want prepared dishes to show food photography so that I can understand the final presentation
- **Acceptance Criteria:**
  - Raw ingredients generate product photography with white background
  - Prepared dishes generate restaurant-quality food photography
  - Automatic detection based on ingredient category and name
  - 256x256px images for fast loading
- **Business Rules:**
  - Use existing Recraft API configuration
  - Connect to AI credits system in settings
  - Cache images permanently (one-time generation)
  - Maximum 500 images total limit

#### 2. AI Credits Integration
- **Feature Description:** All image generation consumes AI credits from the settings system
- **User Stories:**
  - As an admin, I want image generation to use AI credits so that I can control costs
  - As a user, I want to see credit consumption so that I can manage usage
- **Acceptance Criteria:**
  - Image generation deducts credits from settings
  - Credit consumption is tracked and displayed
  - Insufficient credits prevent generation
  - Credit usage is logged for analytics

#### 3. Batch Generation System
- **Feature Description:** Generate images for multiple existing ingredients at once
- **User Stories:**
  - As an admin, I want to batch generate images for existing ingredients so that I can quickly populate the system
- **Acceptance Criteria:**
  - Select multiple ingredients for batch generation
  - Progress indicator during batch processing
  - Error handling for failed generations
  - Cost estimation before batch generation

#### 4. Smart Prompting Strategy
- **Feature Description:** Intelligent prompt generation based on ingredient characteristics
- **User Stories:**
  - As a system, I want to generate appropriate prompts so that images match ingredient types
- **Acceptance Criteria:**
  - Raw ingredients: "product photography, white background, professional"
  - Prepared dishes: "restaurant quality food photography, appetizing presentation"
  - Spices/herbs: "ingredient photography, clear detail, professional lighting"
  - Automatic language detection (German/English)

### Non-Functional Requirements
- **Performance:** 256x256px images for fast loading (<2s load time)
- **Security:** API keys stored in Supabase secrets
- **Scalability:** Support for up to 500 images
- **Accessibility:** Alt text for generated images
- **Reliability:** Fallback placeholders for failed generations

## Technical Considerations

### Architecture
- **Frontend:** React/TypeScript components with custom hooks
- **Backend:** Supabase Edge Functions for API integration
- **Storage:** Supabase storage for generated images
- **Database:** PostgreSQL with new image-related columns

### Dependencies
- Existing Recraft API integration
- AI credits system in settings
- Supabase secrets management
- Current ingredient management system

### API Requirements
- Recraft API for image generation
- Supabase storage for image hosting
- AI credits deduction system

## Database Schema Changes
```sql
-- Add image-related columns to ingredients table
ALTER TABLE ingredients 
ADD COLUMN image_url TEXT,
ADD COLUMN image_generated_at TIMESTAMP,
ADD COLUMN image_generation_cost DECIMAL(10,4),
ADD COLUMN image_generation_prompt TEXT;

-- Add image generation tracking to AI credits system
ALTER TABLE ai_usage_tracking 
ADD COLUMN image_generation_count INTEGER DEFAULT 0,
ADD COLUMN image_generation_cost_total DECIMAL(10,4) DEFAULT 0;
```

## Success Metrics & KPIs
- **Primary Metrics:**
  - 90% of ingredients have generated images within 30 days
  - Average image generation time <10 seconds
  - User satisfaction with image quality >80%
- **Secondary Metrics:**
  - Cost per image generation <$0.02
  - Batch generation success rate >95%
  - System uptime >99.5%
- **Tracking Method:** Supabase analytics, user feedback surveys, cost tracking

## Risk Assessment
- **Technical Risks:**
  - Recraft API rate limits or downtime
  - Image quality inconsistency
  - Storage costs exceeding budget
- **Business Risks:**
  - AI credits depletion without warning
  - User adoption resistance
  - Cost overruns
- **Mitigation Strategies:**
  - Implement retry logic and fallbacks
  - Credit monitoring and alerts
  - User training and documentation
  - Cost monitoring and limits

## Implementation Plan

### Phase 1: Core Infrastructure ✅ COMPLETED
- [x] Database migration for image columns
- [x] Recraft API integration service (Edge Function)
- [x] AI credits integration (using ai_usage_tracking)
- [x] Basic image generation logic

### Phase 2: Smart Detection ✅ COMPLETED
- [x] Smart prompt generation system
- [x] Ingredient type detection logic
- [x] Image caching and storage
- [ ] Automatic generation on ingredient creation (pending image columns)

### Phase 3: UX & Batch Features ✅ COMPLETED
- [x] Batch generation interface
- [x] Loading states and error handling
- [x] Cost tracking and monitoring
- [ ] Image display components (pending image columns)

### Phase 4: Optimization & Testing (IN PROGRESS)
- [ ] Performance optimization
- [ ] User testing and feedback
- [ ] Documentation and training
- [ ] Monitoring and analytics

## Open Questions & Assumptions
- **Assumptions:**
  - Recraft API supports the required image specifications
  - AI credits system can handle image generation costs
  - 256x256px is sufficient for all use cases
  - Users prefer automatic generation over manual approval
- **Open Questions:**
  - Should users be able to regenerate images if dissatisfied?
  - What's the maximum acceptable generation time?
  - Should there be different image sizes for different contexts?
  - How should the system handle ingredient name variations?

## Files to Create/Modify

### New Files
1. `src/services/ImageGenerationService.ts` - Core generation logic
2. `src/hooks/useImageGeneration.ts` - React hook for components
3. `src/components/IngredientImage.tsx` - Image display component
4. `src/components/BatchImageGeneration.tsx` - Batch generation UI
5. `supabase/functions/generate-ingredient-image/` - Edge function

### Modified Files
1. `src/pages/admin/IngredientManagement.tsx` - Add batch generation
2. `src/components/admin/StreamlinedIngredientDialog.tsx` - Auto-generation
3. `src/pages/admin/AdminSettings.tsx` - AI credits integration
4. Database migrations for new columns

## Success Criteria
- All ingredients have appropriate, high-quality images
- Fast loading times (<2s) for restaurant operations
- Cost-effective generation (target <$10 total for 500 images)
- Seamless UX with proper loading states and error handling
- Full integration with existing AI credits system
- 90% user satisfaction with generated image quality 