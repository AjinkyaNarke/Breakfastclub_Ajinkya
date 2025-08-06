# PRD: AI Restaurant Analytics Platform

## Executive Summary

- **Problem Statement:**  
Restaurant owners currently rely on manual spreadsheets for sales and profitability analysis, which is time-consuming, error-prone, and lacks actionable insights.

- **Solution Overview:**  
Build an AI-powered analytics platform that enables owners to input weekly sales (via text or voice), receive instant profitability analysis, and get strategic recommendations—leveraging DeepSeek models for advanced reasoning and Deepgram for voice input.

- **Business Impact:**  
- 3-5x faster business analysis  
- 10-20% profit margin improvement  
- Data-driven, proactive decision-making  
- Scalable intelligence for future growth

- **Timeline:**  
- Phase 1: Foundation (Weeks 1-2)  
- Phase 2: Intelligence (Weeks 3-4)  
- Phase 3: Optimization (Weeks 5-6)

---

## Background & Context

- **Current State:**  
Owners manually track sales and costs in spreadsheets, with no AI-driven insights or automation.

- **Market Research:**  
Most independent restaurants lack affordable, AI-powered analytics. Competitors are either too complex or require POS integration.

- **Strategic Alignment:**  
This platform positions the business as a tech-forward, data-driven operation, supporting growth and efficiency.

---

## User Personas & Use Cases

- **Primary User:**  
  - **Owner**: Wants to maximize profit, optimize menu, and save time on analysis.

- **User Journey:**  
  - Owner logs in (on laptop or mobile), inputs weekly sales (text or voice), reviews instant analysis, and receives actionable recommendations.

- **Use Cases:**  
  1. Input weekly sales via form or voice.
  2. View profitability and cost breakdown.
  3. Compare performance to previous weeks.
  4. Edit or backdate sales data.
  5. Receive AI-generated recommendations.
  6. Monitor usage/cost points and receive recharge reminders.

---

## Functional Requirements

### Core Features

- **Sales Data Input**
  - Manual entry: Owner enters sales per menu item for any week.
  - Voice input: Owner can record sales using a mic; Deepgram parses the input.
  - Backdating: Owner can enter/edit sales for previous weeks.
  - Data validation: System marks weeks with missing data.

- **AI Analytics & Reporting**
  - Real-time profitability and cost analysis.
  - Historical comparison (week-over-week growth).
  - Strategic recommendations (menu, pricing, inventory).
  - Executive summary reports (downloadable/viewable).

- **Conversational Interface**
  - Owner can ask questions (e.g., “How can I improve profit margins?”).
  - Simple, natural language chat powered by DeepSeek-V3.

- **Cost Monitoring**
  - Usage tracked in “points” (not actual currency).
  - Settings page shows points used and prompts to recharge when low.
  - When data volume is high, system summarizes old data into folders for context management.

- **GDPR Compliance**
  - All data stored and processed in accordance with GDPR.
  - Clear privacy policy and data export/delete options.

### Non-Functional Requirements

- **Performance:**  
  - <10 seconds for complex analysis.

- **Security:**  
  - Role-based access (owner only).
  - Data encrypted at rest and in transit.

- **Scalability:**  
  - System can handle growing data by summarizing and archiving old data.

- **Accessibility:**  
  - Mobile and desktop friendly.
  - Voice input accessible via mic button.

---

## Technical Considerations

- **Architecture:**  
  - Single Edge Function with dual DeepSeek model support.
  - Deepgram integration for voice-to-text.
  - Context management for large data (summarization, foldering).

- **Dependencies:**  
  - DeepSeek API (R1 and V3 models)
  - Deepgram API
  - Supabase (database, auth, edge functions)

- **Constraints:**  
  - No POS integration (manual input only).
  - Usage cost shown as points, not currency.

- **API Requirements:**  
  - Endpoints for sales input, analytics, reporting, and cost monitoring.

---

## Success Metrics & KPIs

- **Primary Metrics:**  
  - Time to insight (analysis speed)
  - Profit margin improvement
  - Weekly active usage

- **Secondary Metrics:**  
  - User satisfaction (feedback)
  - Data completeness (weeks with data entered)
  - Cost point usage and recharge rates

- **Tracking Method:**  
  - In-app analytics and periodic user surveys

---

## Risk Assessment

- **Technical Risks:**  
  - Voice input accuracy (Deepgram parsing errors)
  - Model cost overruns (mitigated by points system and usage monitoring)
  - Data volume management (solved by summarization/foldering)

- **Business Risks:**  
  - User adoption (mitigated by simple UX and onboarding)
  - GDPR compliance (mitigated by clear privacy controls)

- **Mitigation Strategies:**  
  - Regular user feedback
  - Automated alerts for high usage
  - Continuous UX refinement

---

## Implementation Plan

- **Phase 1: Foundation (Weeks 1-2)**
  - Integrate DeepSeek and Deepgram APIs
  - Build sales input (form + voice)
  - Set up database and context pipeline

- **Phase 2: Intelligence (Weeks 3-4)**
  - Implement analytics and reporting
  - Build conversational interface
  - Add cost monitoring and points system

- **Phase 3: Optimization (Weeks 5-6)**
  - Summarization/foldering for large data
  - Mobile UX refinement
  - GDPR/data privacy features

---

## Open Questions & Assumptions

- Will owners want to export or share reports? (Assume yes for future phase)
- Is there a need for multi-user support? (Assume single owner for now)
- How will onboarding and support be handled? (Assume simple in-app guide)
- Assume owner is comfortable with basic digital tools (form, chat, voice input)

---

**This PRD is designed for rapid implementation, best-in-class UX, and future scalability. If you want wireframes, user stories, or technical breakdowns for any section, just ask!** 