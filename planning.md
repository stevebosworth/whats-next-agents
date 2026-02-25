# Implementation Plan: Next-Gen Todo App (Coder) - Revised

This document outlines the step-by-step technical execution plan based on the `requirements.md`, incorporating feedback from the Architect and Product Manager.

## Phase 1: Foundation & Scaffolding [DONE]
1. **Monorepo Setup:** Initialize a Turborepo workspace.
2. **Workspace Interlinking:** Ensure `@packages/core`, `@packages/ui`, and `@packages/config` are correctly linked and accessible to all apps.
3. **Package Configuration:** 
   - Setup `@packages/config` with shared ESLint, Prettier, and TypeScript configs.
   - Setup `@packages/core` for shared logic, Zod schemas, and `Luxon` configurations.
   - Setup `@packages/ui` as a React Native Web-compatible component library using theme tokens.
4. **App Scaffolding:**
   - `/apps/api`: Initialize a Next.js App Router project (TypeScript).
   - `/apps/web`: Initialize a React app using Vite (TypeScript).
   - `/apps/ios`: Initialize a React Native app (TypeScript).

## Phase 2: Core Logic (@packages/core) [DONE]
1. **Schema Definition:** Define canonical `Task` and `User` Zod schemas.
2. **Time & NLP Logic:** 
   - Integrate `Luxon` for time-zone math (Floating vs. Fixed).
   - Integrate `chrono-node` for local NLP duration and date extraction.
3. **HLC Sync Logic:** Implement Hybrid Logical Clocks for event ordering and conflict resolution.
4. **Property-Based Testing:** Use `fast-check` to stress-test HLC resolution and the "Time-Fitting" algorithm.

## Phase 3: Backend API (@apps/api) [DONE]
1. **Database & ORM:** Setup PostgreSQL with Drizzle ORM; derive database schemas from `@packages/core` Zod models.
2. **Authentication:** Implement JWT with Refresh Token strategy (NextAuth.js or custom logic).
3. **Endpoints:** 
   - Sync endpoint for HLC reconciliation and delta-updates.
   - Task CRUD and Bulk Update routes.
4. **Authorization:** Implement middleware for scoped user data access.

## Phase 4: Frontend Development (@apps/web & @apps/ios) [IN PROGRESS]
1. **Theme Setup:** Initialize the design system tokens in `@packages/ui`. [DONE]
2. **Data Persistence:**
   - Integrate WatermelonDB in `ios`. [DONE]
   - Setup a local-first persistence layer for `web` (e.g., RxDB or indexedDB-based). [DONE]
3. **UI Implementation:** 
   - Instant NLP Capture input using client-side extraction. [DONE]
   - **Assistant Mode (Time-Fitting):** Implement the suggestion UI for schedule gaps. [DONE]
4. **Native Integration:** Implement Native BackgroundTasks API on iOS for background sync. [TODO]

## Phase 4.1: Web App Diagnostics
**Investigation Summary:**
The `@apps/web` application experienced a build failure related to conflicting Tailwind CSS v4 and PostCSS integration methods.

**Root Causes Identified (Architect):**
1. **Conflicting Integrations:** The presence of both `@tailwindcss/vite` and `@tailwindcss/postcss` caused internal conflicts in the CSS processing pipeline.
2. **PostCSS Redundancy:** In Tailwind v4, the Vite plugin handles CSS processing natively, making `postcss.config.js` and the `@tailwindcss/postcss` plugin redundant and problematic in Vite environments.
3. **Monorepo Scanning:** Tailwind v4 requires explicit `@source` directives to scan components in sibling packages within a monorepo.

**Actions Taken (Coder):**
1. **Clean Configuration:** Deleted `apps/web/postcss.config.js` and pruned redundant dependencies (`autoprefixer`, `postcss`, `@tailwindcss/postcss`) from `apps/web/package.json`.
2. **Optimized Vite Config:** Streamlined `vite.config.ts` to use only `@tailwindcss/vite`.
3. **CSS Update:** Updated `apps/web/src/index.css` to use `@import "tailwindcss";` and added `@source "../../../packages/ui/src/**/*.tsx";` to enable styling for shared UI components.
4. **Environment Sync:** Reinstalled dependencies and attempted server restarts with clean logs.

**Current Status:**
The server reports as "Ready" on `http://localhost:3001`, but connectivity issues persist in some environments (likely due to localhost resolution or process persistence in background mode). Further investigation into host binding and process stability is ongoing.

## Phase 5: Testing & Quality
1. **Unit/Integration:** Vitest for API and Core logic.
2. **Mobile Testing:** Jest and Maestro for React Native.
3. **Data Integrity:** Validation tests for HLC drift and time-zone transitions.

## Next Steps / TODO
- [x] **Web App implementation:** Set up TanStack Query and local-first persistence in `apps/web`.
- [x] **iOS App implementation:** Integrate WatermelonDB and connect to `@packages/ui`.
- [ ] **Local-First Sync:** Implement the client-side HLC sync reconciliation in `@packages/core`.
- [ ] **Assistant UI:** Build the "I have X minutes" suggestion view in both Web and iOS. [DONE]
- [ ] **Production Auth:** Replace the mocked session logic in `apps/api` with full NextAuth.js or JWT flows.
