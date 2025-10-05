# JakDoczłapię Admin Dashboard

## Overview

JakDoczłapię is an admin dashboard application for bus/transport operators to manage routes, schedules, reports, and real-time vehicle tracking. The application serves as a utility-focused admin tool prioritizing data clarity, operational efficiency, and rapid task completion for monitoring public transportation systems.

The system is built as a full-stack TypeScript application with a React frontend and Express backend, featuring a proxy architecture to communicate with an external transportation API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 18 with TypeScript
- **Routing**: wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state and caching
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens
- **Build Tool**: Vite with React plugin

**Design System**:
- Custom dashboard design inspired by Linear + Material Design
- Dark mode optimized with neutral palette
- Primary brand color: HSL(239 90% 57%) - JakDoczłapię blue
- Typography: Inter (UI) and JetBrains Mono (monospace data)
- Semantic color system for status indicators (success, warning, danger, info)

**Key UI Patterns**:
- Collapsible sidebar navigation with mobile responsiveness
- Card-based layout for data presentation
- Form handling with react-hook-form and Zod validation
- Toast notifications for user feedback
- Real-time data updates with automatic refetching

### Backend Architecture

**Framework**: Express.js with TypeScript
- **Server Setup**: HTTP server with JSON/URL-encoded body parsing
- **API Pattern**: Proxy architecture forwarding requests to external API
- **Development Tools**: Vite middleware for HMR in development

**Proxy Implementation**:
- All `/api/v1/*` requests are proxied to `https://jak-doczlapie-hackyeah.b.solvro.pl/api/v1`
- Preserves HTTP methods, headers, and request bodies
- Handles both JSON and text responses
- Authorization headers passed through when present

**Data Layer**:
- Drizzle ORM configured for PostgreSQL (via Neon serverless)
- Schema definitions with Zod validation in shared directory
- Database configuration in `drizzle.config.ts`
- Migration support with `drizzle-kit`

**Storage Interface**:
- Abstracted storage layer with `IStorage` interface
- In-memory implementation (`MemStorage`) for user data
- Prepared for database-backed implementation

### Application Structure

**Monorepo Layout**:
- `/client` - React frontend application
- `/server` - Express backend server
- `/shared` - Shared TypeScript schemas and types
- `/attached_assets` - Static assets and API documentation

**Key Routes**:
1. **Dashboard** (`/`) - Overview statistics and recent reports
2. **Routes** (`/routes`) - Bus/train route management
3. **Reports** (`/reports`) - Incident and delay reporting
4. **Schedules** (`/schedules`) - Stop schedules and timetables
5. **Tracking** (`/tracking`) - Real-time vehicle location monitoring

**Data Models** (from shared schema):
- Routes: Transportation routes with type, operator, stops
- Stops: Bus/train/tram stops with geolocation (GeoJSON Point)
- Schedules: Timetables with sequence, time, conditions
- Reports: Incident reports (delays, accidents, failures, etc.)
- Conditions: Service conditions affecting schedules

### External Dependencies

**Third-Party Services**:
- **External API**: `https://jak-doczlapie-hackyeah.b.solvro.pl/api/v1` - Primary data source for routes, stops, schedules, and tracking
- **Neon Database**: PostgreSQL serverless database (configured but not actively used in current proxy setup)

**Key NPM Packages**:
- **UI Components**: @radix-ui/* primitives, shadcn/ui components
- **Data Fetching**: @tanstack/react-query
- **Forms**: react-hook-form, @hookform/resolvers
- **Validation**: zod, drizzle-zod
- **Database**: drizzle-orm, @neondatabase/serverless
- **Date Handling**: date-fns with Polish locale
- **Styling**: tailwindcss, class-variance-authority, clsx
- **Development**: Replit-specific plugins for runtime errors and cartographer

**API Integration**:
- RESTful API consumed through proxy
- OpenAPI/Swagger documentation available in attached_assets
- Endpoints for routes, stops, schedules, reports, and tracking data
- Support for geospatial queries (latitude/longitude/radius parameters)

**Authentication Flow**:
- Authorization headers supported in proxy
- Basic/Bearer/API Key authentication schemes defined in API spec
- Currently no active session management (storage layer prepared)