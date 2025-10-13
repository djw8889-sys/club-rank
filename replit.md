# Overview

ClubRank is a comprehensive club management and competition platform built with React, TypeScript, and Express.js. Originally Match Point (a tennis partner matching app), it has been transformed into a club-centric management platform that serves tennis clubs with advanced features for inter-club competitions, member coordination, and analytics.

The platform provides club identity customization, automated bracket generation, member management, inter-club competitions, and detailed analytics. It features a mobile-first design with Smash-style vibrant UI (lime green + dark blue theme) using Tailwind CSS and shadcn/ui components, delivering a native-like experience for club administrators and members.

**MVP Transformation Complete (5 Phases):**
- **Phase 1**: Service rebranding to "Club Rank" with shield emblem logo and navigation restructure
- **Phase 2**: Database expansion with club management schemas and gameFormat support for 5 match types
- **Phase 3**: Core club features including identity customization, management dashboard, automated bracket generation, and analytics
- **Phase 4**: Personal records enhancement and location-based matching optimization
- **Phase 5**: Complete transition to club-centric platform - removed all personal matching features, rebranded to "ClubRank", applied Smash-style UI (lime green #C7F244 + dark blue #1A2332), 4-tab navigation (내 클럽/랭킹/커뮤니티/내 정보)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: React Context for auth state, TanStack React Query for server state
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Build Tool**: Vite for fast development and optimized builds

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful API with `/api` prefix
- **Storage Interface**: Abstracted storage layer with in-memory implementation
- **Development**: Hot module replacement via Vite middleware

## Authentication & User Management
- **Primary Auth**: Firebase Authentication with Google OAuth
- **User Profiles**: Custom user data stored in Firestore
- **Session Management**: Firebase handles auth state persistence
- **Profile Setup**: Multi-step onboarding for tennis-specific data (NTRP, region, availability)

## Database Schema
- **Users Table**: Comprehensive player profiles including tennis skill level (NTRP), region, age, bio, and club membership data
- **Clubs Table**: Club profiles with identity customization, member rosters, and competition history
- **Club Matches Table**: Inter-club competition records with game format tracking and automated bracket generation
- **Posts Table**: Community features for user-generated content
- **Chats Table**: Real-time messaging system for club communications

## Data Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Configured for Neon serverless PostgreSQL
- **Migrations**: Automated schema management via drizzle-kit
- **Validation**: Zod schemas for type-safe data validation

## Mobile-First Design
- **Responsive**: Tailwind CSS with mobile breakpoints
- **PWA-Ready**: Service worker configuration for offline capability
- **Touch Optimization**: Touch-friendly UI components and gestures
- **Performance**: Optimized bundle splitting and lazy loading
- **Smash-Style UI**: Vibrant color theme with lime green (#C7F244) primary and dark blue (#1A2332) accent colors, gradient backgrounds, and animated elements

## Real-Time Features
- **Chat System**: Firestore real-time listeners for instant messaging within clubs
- **Competition Updates**: Live updates for inter-club match results and standings
- **Community Posts**: Real-time feed updates for club announcements and discussions

## Club Ranking System
- **Club ELO Rating**: Inter-club competition ranking based on match results
- **Member Statistics**: Individual performance tracking within club context
- **Leaderboards**: Dual ranking system - individual player rankings and club rankings
- **Competition Analytics**: Detailed statistics by game format (5 types: 남단, 여단, 복식, 혼복, 단식)

# External Dependencies

## Firebase Services
- **Firebase Auth**: Google OAuth integration for user authentication
- **Firestore**: NoSQL database for real-time data and user profiles
- **Firebase Storage**: File uploads for profile pictures and media
- **Firebase Hosting**: Configured for production deployment

## Database & ORM
- **Neon Database**: Serverless PostgreSQL for production data
- **Drizzle ORM**: Type-safe database queries and migrations
- **Connection Pooling**: Built-in connection management for serverless environments

## UI & Styling
- **Radix UI**: Accessible component primitives for complex UI elements
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **shadcn/ui**: Pre-built component library with consistent styling
- **Lucide React**: Icon system with tree-shaking support

## Development & Build Tools
- **Vite**: Fast build tool with HMR and optimized production builds
- **TypeScript**: Static type checking across frontend and backend
- **ESLint**: Code quality and consistency enforcement
- **PostCSS**: CSS processing with Tailwind integration

## Third-Party Integrations
- **Google Fonts**: Inter font family for modern typography
- **Font Awesome**: Icon library for enhanced UI elements
- **React Hook Form**: Efficient form handling with validation
- **Date-fns**: Lightweight date manipulation library

## Deployment & Production
- **Replit Integration**: Development environment optimizations
- **Environment Variables**: Secure configuration management
- **Build Optimization**: Code splitting and asset optimization
- **Error Handling**: Comprehensive error boundaries and logging