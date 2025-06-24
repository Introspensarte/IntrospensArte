# Introspens/arte Community Platform

## Overview

Introspens/arte is a creative writing community platform built with React, Express.js, and PostgreSQL. The application provides a space for writers to share their work, track their creative progress, and participate in a ranking system based on their contributions. Users can register, upload various types of writing activities, and interact with news and announcements from the community.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **Authentication**: Local storage-based authentication with custom useAuth hook
- **UI Framework**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom design system (dark theme with purple accents)
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **API Design**: RESTful API with JSON responses
- **Session Management**: Local storage on frontend (no server-side sessions)

### Key Components

#### Authentication System
- Signature-based authentication (users have unique signatures starting with #)
- No password system - users authenticate with their unique signature
- Local storage persistence for user sessions
- Role-based access (user/admin)

#### Activity Tracking System
- Multiple activity types: narrativa, microcuento, drabble, hilo, rol, otro
- Trace calculation system based on word count and activity type
- User statistics tracking (total traces, words, activities)
- Ranking system based on traces and word count

#### Content Management
- News system for community updates
- Announcements for administrative communications
- Planned activities organized by "aristas" (creative dimensions) and albums
- User profiles with customizable information

#### Database Schema
- **Users**: Personal info, statistics, roles, and ranks
- **Activities**: User submissions with word counts, types, and trace calculations
- **News**: Community news with author attribution
- **Additional tables**: Announcements, planned activities, notifications (referenced but not fully implemented)

## Data Flow

1. **User Registration**: Users provide personal info and unique signature, stored in PostgreSQL
2. **Authentication**: Signature-based login with user data cached in localStorage
3. **Activity Submission**: Users submit writing activities, traces are calculated automatically
4. **Statistics Update**: User totals are recalculated when new activities are added
5. **Rankings**: Real-time calculation of user rankings based on traces and word count
6. **Content Display**: News, announcements, and activities fetched via React Query

## External Dependencies

### Core Dependencies
- `@neondatabase/serverless`: Serverless PostgreSQL connection
- `drizzle-orm`: Type-safe ORM for database operations
- `@tanstack/react-query`: Server state management
- `@radix-ui/*`: Headless UI components
- `react-hook-form`: Form handling with validation
- `zod`: Schema validation
- `wouter`: Lightweight React router

### Development Tools
- `vite`: Build tool and dev server
- `tsx`: TypeScript execution for server
- `esbuild`: Production bundling
- `tailwindcss`: Utility-first CSS framework

## Deployment Strategy

### Environment Configuration
- Development: `npm run dev` - runs both client (Vite) and server (tsx)
- Production: `npm run build` - builds client assets and bundles server
- Database: Requires `DATABASE_URL` environment variable for Neon connection

### Build Process
1. Client build: Vite compiles React app to `dist/public`
2. Server build: esbuild bundles Express server to `dist/index.js`
3. Static assets served by Express in production

### Replit Configuration
- Modules: nodejs-20, web, postgresql-16
- Auto-deployment to autoscale environment
- Development server runs on port 5000

## Changelog

```
Changelog:
- June 23, 2025: Initial full-stack setup with React frontend and Express backend
- June 23, 2025: Design improvements - lavender title colors, black form backgrounds, user info in portal
- June 23, 2025: Complete restructure for Render deployment - static HTML files in /public folder
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```