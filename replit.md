# JakDoczłapię Admin Dashboard

## Overview

JakDoczłapię is an admin dashboard application for bus/transport operators to manage routes, schedules, reports, and real-time vehicle tracking. The application serves as a utility-focused admin tool prioritizing data clarity, operational efficiency, and rapid task completion for monitoring public transportation systems.

The system is built as a frontend-only TypeScript application with React, communicating directly with an external transportation API.

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
- **Operator selection and filtering**: Global operator context with dropdown selector in header for filtering all data by transport operator

### API Integration

**Backend Proxy Architecture**:
- Express backend server acts as a proxy to external API
- Frontend calls `/api/v1/*` which proxies to `https://jak-doczlapie-hackyeah.b.solvro.pl/api/v1`
- Backend handles file uploads and AI processing for schedule imports
- All API calls handled through TanStack Query (React Query)
- OpenAI integration (gpt-5) for extracting timetables from images/PDFs

**Data Layer**:
- Schema definitions with Zod validation in shared directory
- Type-safe API responses using TypeScript interfaces
- Client-side state management via React Query cache
- **React Query Patterns**:
  - Custom `queryFn` pattern for nullable IDs: prevents invalid API calls by checking ID existence before fetch
  - Example: `queryFn: async () => { if (!id) return null; /* fetch logic */ }`
  - Used in route-details.tsx and tracking.tsx for safe data fetching
  - Auto-refresh enabled for tracking data (refetchInterval: 15000ms)

### Application Structure

**Application Layout**:
- `/client` - React frontend application (main app directory)
- `/shared` - Shared TypeScript schemas and types
- `/attached_assets` - Static assets and API documentation
- `/server` - Express backend server (proxy + AI features)

**Key Routes**:
1. **Dashboard** (`/`) - Overview statistics and recent reports
2. **Routes** (`/routes`) - Bus/train route management
   - **Route Details** (`/routes/:id`) - Displays schedule tables with stops and departure times only (no map or reports section)
3. **Reports** (`/reports`) - Incident and delay reporting
4. **Schedules** (`/schedules`) - Stop schedules and timetables
5. **Tracking** (`/tracking`) - Real-time vehicle location monitoring with map display, last vehicle location with timestamp, GPS tracks history table at bottom, and auto-refresh every 15 seconds
6. **Search** (`/search`) - Journey planning with interactive map for selecting start and end points, automatic connection search with progressive radius increase (1000m-5000m), displays journey options with routes, transfers, and distance

**Data Models** (from shared schema):
- Operators: Transport operator names (simple string array)
- Routes: Transportation routes with type, operator, stops
- Stops: Bus/train/tram stops with geolocation (GeoJSON Point)
- Schedules: Timetables with sequence, time, conditions
- Reports: Incident reports (delays, accidents, failures, etc.)
- Conditions: Service conditions affecting schedules

**Operator Filtering Feature**:
- **Context**: Global operator context (`OperatorProvider`) manages selected operator state
- **Persistence**: Selected operator stored in localStorage with key `jakdoczlapie_selected_operator`
- **UI Component**: Operator selector dropdown in header (`OperatorSelector`)
- **Filtering Behavior**:
  - When no operator selected: All data shown (routes, reports, schedules, tracking)
  - When operator selected: Data filtered to show only that operator's information
  - Selection persists across page navigation and browser sessions
- **Implementation Files**:
  - Context: `client/src/contexts/operator-context.tsx`
  - Component: `client/src/components/operator-selector.tsx`
  - API Integration: `client/src/lib/api.ts` (operators endpoints)
  - Schema: `shared/schema.ts` (Operator type)
  - Pages: All pages (routes, reports, schedules, tracking) support operator filtering

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
- RESTful API proxied through Express backend to `https://jak-doczlapie-hackyeah.b.solvro.pl/api/v1`
- OpenAPI/Swagger documentation available in `attached_assets/swagger_1759631884723.yml`
- Backend provides additional features: AI-powered schedule import from images/PDFs using OpenAI gpt-5

**Available Endpoints**:

1. **Operators API**
   - `GET /api/v1/operators` - Get list of all operators
     - Returns: Array of operator names (e.g., ["LUZ", "PKS w Strzelcach Op. S.A.", "POLREGIO"])
   - `GET /api/v1/operators/{name}/routes` - Get routes for specific operator
   - `GET /api/v1/operators/{name}/reports` - Get reports for specific operator
   - `GET /api/v1/operators/{name}/stops` - Get stops for specific operator
   - Note: Some operator-specific endpoints may not be fully implemented on backend

2. **Routes API**
   - `GET /api/v1/routes` - Find routes with journey planning
     - Query params: `fromLatitude`, `fromLongitude`, `toLatitude`, `toLongitude`, `radius` (default: 1000m), `transferRadius` (default: 200m), `maxTransfers` (default: 2)
     - Returns: Array of journey options with transfers
   - `GET /api/v1/routes/{id}` - Get route details
     - Query params: `destination` (optional filter)
     - Returns: Route with stops and schedules
   - `POST /api/v1/routes/{id}/reports` - Submit incident report
     - Body: `{ run, type, description, coordinates: { latitude, longitude }, image }`
     - Report types: delay, accident, press, failure, did_not_arrive, change, other, diffrent_stop_location, request_stop
   - `GET /api/v1/routes/{id}/reports` - Get reports for route
   - `POST /api/v1/routes/{id}/tracks` - Submit vehicle tracking data
     - Body: `{ coordinates: { latitude, longitude }, run }`

3. **Stops API**
   - `GET /api/v1/stops` - Get nearby stops
     - Query params: `latitude`, `longitude`, `radius` (meters)
   - `GET /api/v1/stops/{id}` - Get stop details with schedules

**Geospatial Features**:
- Support for coordinate-based queries (latitude/longitude/radius)
- Journey planning with multi-modal transfers (bus/train/tram)
- Distance calculations and routing optimization
- Real-time vehicle tracking with GeoJSON Point format

**Authentication Flow**:
- Authorization headers supported in proxy
- Basic/Bearer/API Key authentication schemes defined in API spec
- Currently no active session management (storage layer prepared)