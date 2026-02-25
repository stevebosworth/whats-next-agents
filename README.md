# What's Next? (Next-Gen Todo App)

A high-performance, offline-first productivity application featuring local-first NLP, Hybrid Logical Clocks (HLC) for distributed sync, and a "Glanceable UI" shared across Web and iOS.

## 🚀 Quick Start (Development)

### 1. Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **PostgreSQL**: (Required for API persistence)

### 2. Installation
From the root of the monorepo, install all dependencies:
```bash
npm install --legacy-peer-deps
```

### 3. Environment Setup
Create a `.env` file in the `apps/api` directory:
```bash
cp apps/api/.env.example apps/api/.env
```
*Note: Update `DATABASE_URL` in `apps/api/.env` to point to your local PostgreSQL instance.*

### 4. Running the App
You can start all services (Web, API, and Core logic) simultaneously using Turbo:
```bash
npm run dev
```

Or run specific workspaces individually:
- **Web App**: `npm run dev --workspace=@apps/web` (Running at http://localhost:3001)
- **Backend API**: `npm run dev --workspace=@apps/api` (Running at http://localhost:3000)
- **Core Tests**: `npm run test --prefix packages/core`

---

## 🏗 Architecture
This project uses a **Turborepo Monorepo** structure:
- **`apps/web`**: React + Vite + Tailwind CSS v4.
- **`apps/ios`**: React Native + WatermelonDB.
- **`apps/api`**: Next.js (App Router) + Drizzle ORM + PostgreSQL.
- **`packages/core`**: Shared logic (Zod schemas, HLC sync, `chrono-node` NLP engine).
- **`packages/ui`**: Cross-platform component library (React Native Web).

## 🛠 Key Features
- **Local-First NLP**: Task duration and date extraction happens instantly on the client.
- **Distributed Sync**: Uses **Hybrid Logical Clocks (HLC)** to resolve conflicts across multiple devices without a central authority clock.
- **Time-Fitting**: Proactively suggests tasks based on your available "schedule gaps."

## 🧪 Testing
We use **Vitest** for core logic and **fast-check** for property-based testing of the HLC implementation.
```bash
npm run test
```
