# Technology Stack Recommendation

**Document Version**: 2.3  
**Last Updated**: January 12, 2026  
**Implementation Status**: ✅ Production Deployed (v0.4.0)

## Overview
This document outlines the recommended technology stack for the WekangTradingJournal performance tracking system.

> **App Icon**: 🏍️💰 Fast motorcycle with money element

## Critical Constraint Analysis

### Vercel + SQLite Limitation
**IMPORTANT**: Vercel's serverless architecture is **NOT compatible** with traditional SQLite file-based databases because:
- Serverless functions are stateless and ephemeral
- No persistent file system across invocations
- SQLite requires file system access for database file storage

### Recommended Solutions

#### Option 1: **Turso (SQLite on Edge)** - RECOMMENDED ✅
- **Database**: Turso (distributed SQLite at the edge)
- **Why**: 
  - SQLite-compatible syntax and behavior
  - Built for edge/serverless environments
  - Works perfectly with Vercel
  - Free tier available
  - Low latency with edge replication
  - Supports your requirement for SQLite

#### Option 2: Vercel Postgres
- **Database**: Vercel Postgres (serverless PostgreSQL)
- **Why**: Native Vercel integration, but NOT SQLite

#### Option 3: PlanetScale (MySQL)
- **Database**: PlanetScale (serverless MySQL)
- **Why**: Good for scaling, but NOT SQLite

---

## Recommended Stack (Production-Ready & Scalable)

### Frontend
- **Framework**: **Next.js 15** (App Router)
  - Server-side rendering (SSR)
  - API routes included
  - Optimized for Vercel deployment
  - Built-in TypeScript support
  - React 19 support

### Backend
- **Runtime**: Next.js API Routes (serverless functions)
- **ORM**: **Drizzle ORM** ✅ PRODUCTION
  - ✅ **Migration Complete**: Fully migrated from Prisma (January 11, 2026)
  - Type-safe database access with better TypeScript inference
  - Native LibSQL/Turso support (no adapters needed)
  - SQL-like query syntax
  - Lightweight and fast (50% faster cold starts vs Prisma)
  - Schema migration management via drizzle-kit
  - Single source of truth for data models
  - **Production Stats**: 51 functions migrated, 12 services, 100% complete

### Database
- **Primary Choice**: **Turso** (libSQL - SQLite for serverless)
  - Connection: `@libsql/client` (direct, no adapter)
  - Native Drizzle ORM support
  - SQLite syntax compatibility
  - Edge-optimized with global replication

### Authentication
- **Library**: **NextAuth.js v5 (Auth.js)**
  - Multi-user support
  - Role-based access (User/Admin)
  - Session management
  - Built for Next.js

### UI/Styling
- **CSS Framework**: **Tailwind CSS**
  - Utility-first styling
  - Responsive design
  - Highly customizable
  - Small bundle size

- **Component Library**: **shadcn/ui**
  - Accessible components
  - Built on Radix UI
  - Fully customizable
  - Copy-paste components (no package bloat)

### Data Visualization
- **Library**: **Recharts**
  - React-based charting
  - Responsive charts
  - Simple API
  - Supports bar charts, line charts, pie charts
  - Lightweight alternative: **Chart.js** with react-chartjs-2

### Form Handling
- **Library**: **React Hook Form**
  - Performance optimization
  - Built-in validation
  - TypeScript support

- **Validation**: **Zod**
  - Type-safe validation
  - Works seamlessly with React Hook Form
  - Shared validation between frontend and backend

### Date Handling
- **Library**: **date-fns**
  - Lightweight (vs moment.js)
  - Modular imports
  - For week/month/year calculations

### State Management
- **Library**: **Zustand** (if needed)
  - Minimal boilerplate
  - TypeScript-friendly
  - For complex client state (optional for MVP)

### Development Tools
- **Language**: **TypeScript**
  - Type safety
  - Better IDE support
  - Catch errors at compile time

- **Linting**: ESLint + Prettier
- **Git Hooks**: Husky (optional)
- **Testing**: Vitest + React Testing Library (Phase 2)

---

## Architecture Pattern

### Single Source of Truth Strategy

```
prisma/schema.prisma          → Database schema (SSOT for data models)
lib/types.ts                  → Shared TypeScript types (SSOT for app types)
lib/constants.ts              → App constants (SSOT for enums, configs)
lib/validations.ts            → Zod schemas (SSOT for validation rules)
app/api/                      → Backend API routes
app/(routes)/                 → Frontend pages
components/                   → Reusable UI components
```

### Naming Conventions
- **Files**: kebab-case (`user-profile.tsx`)
- **Components**: PascalCase (`UserProfile`)
- **Functions**: camelCase (`calculateWinRate`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_TRADES_PER_DAY`)
- **Database Tables**: snake_case (`trade_records`)
- **API Routes**: kebab-case (`/api/trade-records`)

---

## Technology Decision Matrix

| Requirement | Technology | Justification |
|------------|-----------|---------------|
| Serverless Hosting | Vercel | Required by client |
| SQLite Compatibility | Turso (libSQL) | Only serverless SQLite solution |
| Full-stack Framework | Next.js 15 | Industry standard, Vercel-optimized |
| Type Safety | TypeScript | Prevents runtime errors, SSOT enforcement |
| Database Access | Prisma | Type-safe ORM, migration management |
| Authentication | NextAuth.js v5 | Built for Next.js, role-based access |
| Charts/Graphs | Recharts | React-native, simple API |
| Forms | React Hook Form + Zod | Performance + type-safe validation |
| Styling | Tailwind + shadcn/ui | Fast development, consistent design |
| Date Operations | date-fns | Lightweight, modular |

---

## Scalability Considerations

### Current (MVP)
- Turso free tier: 500 MB storage, 1 billion row reads/month
- Vercel Hobby: Sufficient for small teams

### Future Scaling Options
1. **Database**: Upgrade Turso plan for more capacity
2. **Hosting**: Upgrade Vercel plan for more bandwidth
3. **Caching**: Add Redis (Upstash) for frequently accessed data
4. **CDN**: Vercel's built-in edge network
5. **Background Jobs**: Vercel Cron or Inngest for scheduled tasks

---

## Security Considerations
- NextAuth.js for secure authentication
- Server-side session validation
- API route protection with middleware
- Input validation with Zod (client + server)
- SQL injection prevention via Prisma
- HTTPS enforced by Vercel

---

## File Structure (Proposed)

```
WekangTradingJournal/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (dashboard)/
│   │   ├── admin/
│   │   └── user/
│   ├── api/
│   │   ├── auth/
│   │   ├── trades/
│   │   └── users/
│   └── layout.tsx
├── components/
│   ├── ui/              # shadcn components
│   ├── charts/
│   └── forms/
├── lib/
│   ├── auth.ts
│   ├── constants.ts
│   ├── db.ts
│   ├── types.ts
│   └── validations.ts
├── prisma/
│   └── schema.prisma
├── public/
├── docs/
└── package.json
```

---

## Next Steps

1. **Client Approval Required**: 
   - Approve Turso as SQLite replacement (only viable option for Vercel)
   - Approve Next.js + TypeScript stack
   
2. **After Approval**:
   - Detailed system architecture
   - Database schema design
   - API specification
   - Implementation milestones

---

## Questions for Client

**CRITICAL**: 
- ✅ Accept Turso (SQLite for edge) instead of traditional SQLite file?
- ✅ Approve Next.js + TypeScript as primary stack?

**Optional**:
- Expected number of users? (impacts free tier limits)
- Expected trades per day per user?
- Data retention requirements (how many years of history)?

---

**Status**: ✅ APPROVED & IMPLEMENTED  
**Current Version**: 0.2.0 (Phase 2 Complete)  
**Next Document**: [System Architecture Design](./02-SYSTEM-ARCHITECTURE.md)
