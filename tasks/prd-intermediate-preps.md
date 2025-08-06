# PRD: Intermediate Preps for Cost Tracking

## Executive Summary
- **Problem Statement:** Admins cannot track costs of intermediate preps (pastes, sauces, etc.) made from ingredients, leading to inaccurate dish cost calculations.
- **Solution Overview:** Add "preps" as a new entity that can be created from ingredients and used in dishes, with automatic cost calculation and AI chat integration for easy management.
- **Business Impact:** Accurate cost tracking, better menu pricing, improved profitability insights.
- **Timeline:** 1-2 weeks for MVP.

---

## Background & Context
- **Current State:** Only raw ingredients are tracked; preps are not represented in the system.
- **Market Research:** Standard practice in restaurant management systems.
- **Strategic Alignment:** Supports cost control and menu optimization.

---

## User Personas & Use Cases
- **Primary Users:** Admins managing menu and costs.
- **User Journey:** Admin creates preps via AI chat or admin panel, uses them in dishes, system auto-calculates costs.
- **Use Cases:**
  - Create prep via AI chat: "Create a green curry paste with 100g ginger, 50g garlic, 30ml oil"
  - Use prep in dish: "Add green curry paste to Thai curry dish"
  - Get cost analysis: "What's the cost breakdown of our curry dishes?"

---

## Functional Requirements

### Core Features
- **Prep Entity:**
  - Name (multilingual: German/English)
  - Recipe (list of ingredients with quantities)
  - Batch yield (e.g., "makes 500ml")
  - Cost per batch (auto-calculated)
  - Notes/instructions

- **AI Chat Integration:**
  - "Create a prep called [name] with [ingredients]"
  - "What preps do we have?"
  - "Show me the cost of [prep name]"
  - "Use [prep] in [dish]"

- **Dish Integration:**
  - Add preps as ingredients in dishes
  - Auto-calculate total dish cost including preps
  - Show cost breakdown

### Non-Functional Requirements
- Multilingual support (German/English)
- Simple admin interface
- AI chat knowledge of preps
- Fast cost calculations

---

## Technical Considerations
- **Architecture:** New `preps` table, update `menu_item_ingredients` to support prep references
- **Dependencies:** Existing ingredient and menu systems
- **Constraints:** Keep it simple, no complex nesting in MVP
- **API Requirements:** CRUD for preps, update dish endpoints

---

## Success Metrics
- **Primary:** % of dishes with accurate cost tracking
- **Secondary:** Admin adoption of prep creation via AI chat
- **Tracking:** System usage logs

---

## Implementation Plan
- **Phase 1 (MVP):** Database schema, basic prep CRUD, AI chat integration
- **Phase 2:** Enhanced UI, batch operations
- **Phase 3:** Advanced features (optional)

---

## Open Questions & Assumptions
- Assume simple prep structure (no nested preps in MVP)
- AI chat will be primary interface for prep management
- Multilingual support required from start 