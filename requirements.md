# Requirements: Next-Gen Todo App

## 1. Product Vision (Product Manager)
**Job to be Done:** "When I have a gap in my schedule (e.g., waiting for a meeting), I want to see the highest-priority task that fits my available time, so that I can be productive without starting something I can't finish."

### User Stories
- **Capture & NLP:** As a user, I want to type "Buy milk (15m) tomorrow at 9am" and have the duration, date, and time automatically extracted.
- **Time-Fitting (Core Feature):** As a user, I want to say "I have 15 minutes" and see the highest-priority tasks that fit that estimate, so I can fill small schedule gaps efficiently.
- **Focus Mode:** As a user, I want a one-tap toggle to hide all but my top 3 tasks, so I can eliminate noise instantly.
- **Hierarchical Tagging:** As a user, I want to tag tasks (e.g., #Work/Urgent), limited to 3 levels of depth to maintain performance and clarity.
- **Quiet Hours (MVP):** As a user, I want to define "Do Not Disturb" windows for task notifications, so I can avoid notification fatigue during deep work or rest.
- **Time-Zone Intelligence (MVP):** As a user, I want my reminders to intelligently handle travel (Floating vs. Fixed time), so that I never miss a deadline regardless of my current location.
- **Smart Reminders (v1.2):** Advanced context-aware notifications.

### Feature Roadmap (Prioritized)
1. **MVP (v1.0):** Task CRUD with **Estimated Duration**, Time-Fitting Logic, NLP Capture, Sync, Hierarchical Tags, Quiet Hours, Time-Zone Logic, Web & iOS.
2. **Next (v1.1):** Focus Mode (One-tap), Batch Actions (Bulk APIs), Priority Levels, Dark Mode (Theme Tokens).
3. **Future (v1.2):** Smart Reminders, Calendar Integration, Native Desktop App.

---

## 2. Technical Architecture (Architect)
- **Monorepo Structure (Turborepo):**
  - `/apps/web`: React (Vite) - Web interface.
  - `/apps/ios`: React Native - Mobile interface.
  - `/apps/api`: Next.js (App Router) - Backend API.
  - `/packages/core`: Shared logic (Zod schemas, HLC Sync, NLP, Types).
  - `/packages/ui`: Shared UI Component Library (Theme-driven).
  - `/packages/config`: Shared ESLint, TS, and Prettier configs.
- **Architectural Directives:**
  - **Shared State:** All **HLC sync**, **Time-Fitting logic**, and NLP parsing logic (`chrono-node` + custom regex) must reside in `@packages/core`.
  - **Strict Typing:** Every API response and data model must be validated by a Zod schema defined in core, shared between Next.js and frontend.
  - **Time Management:** Use `Luxon` in `@packages/core` for all duration and timezone-aware arithmetic.
  - **Repository Pattern:** Implement a unified `TaskRepository` interface in core that delegates to WatermelonDB (iOS) and a local-first adapter for Web.
  - **Theme Tokens:** The UI package must use a theme object to support dynamic switching for Dark Mode (v1.1).
- **Offline-First & Sync:** 
  - **Strategy:** Hybrid Logical Clocks (HLC) for reliable event ordering and conflict resolution.
  - **Frequency:** "Smart Batching"—push changes every 30s or on app backgrounding using the Native BackgroundTasks API (iOS).
- **Backend:** 
  - Next.js API Routes + PostgreSQL (Drizzle ORM).
  - **Type-Safe Schema:** Drizzle schema derived directly from Zod models in `@packages/core`.

---

## 3. User Experience & Design (UX/Visual)
- **Optimistic UI:** Instant feedback loop for NLP parsing; local extraction ensures zero latency for duration and date recognition.
- **Theme Tokens:** Implement a design system using tokens from Day 1 to ensure seamless transition to Dark Mode (v1.1).
- **Glanceable UI:** High-contrast task cards that change appearance based on `task_type`.
- **Accessibility:** WCAG 2.1 AA standards, 44x44px touch targets, and full keyboard navigation.

---

## 4. Quality & Performance (Reviewer/Coder)
- **Performance:** `FlashList` (iOS) and Drizzle's prepared statements for high-speed rendering and data transfer.
- **Security:** 
  - JWT with **Refresh Token strategy** (Short-lived access tokens).
  - **Rate Limiting:** Protect Sync and Authentication endpoints.
  - **Auth:** NextAuth.js or custom logic with strict Pundit-style authorization checks.
- **Data Policy:** Soft-delete with a 30-day recovery window before permanent purging.
- **Testing:** 
  - **Property-Based Testing:** `fast-check` for testing the "Time-Fitting" algorithm and HLC logic in core.
  - **Integration:** Vitest (Core/API/Web), Jest (React Native), Maestro (Mobile E2E).
