# JakDoczłapię Admin Dashboard - Design Guidelines

## Design Approach
**System Selected**: Custom Dashboard Design inspired by Linear + Material Design principles
**Rationale**: Utility-focused admin tool requiring data clarity, quick scanning, and operational efficiency. The dashboard prioritizes information density, real-time updates, and rapid task completion over decorative elements.

## Core Design Principles
1. **Data First**: Every pixel serves operational needs - no decorative bloat
2. **Scan-ability**: Critical information accessible within 2 seconds
3. **Status Clarity**: Visual hierarchy that immediately communicates system health
4. **Rapid Action**: Common tasks (create report, check delays) within 1-2 clicks

## Color Palette

### Primary Brand Colors
- **Primary**: 239 90% 57% (#2f56f5 - JakDoczłapię brand blue)
- **Primary Hover**: 239 90% 47%
- **Primary Light**: 239 90% 95% (backgrounds, subtle highlights)

### Semantic Colors (Dark Mode)
- **Success**: 142 71% 45% (on-time buses, resolved issues)
- **Warning**: 38 92% 50% (minor delays, attention needed)
- **Danger**: 0 84% 60% (critical delays, accidents, failures)
- **Info**: 199 89% 48% (general notifications, tracking)

### Neutral Palette (Dark Mode Optimized)
- **Background**: 220 13% 10% (main canvas)
- **Surface**: 220 13% 15% (cards, panels)
- **Surface Elevated**: 220 13% 18% (modals, dropdowns)
- **Border**: 220 13% 25%
- **Text Primary**: 0 0% 98%
- **Text Secondary**: 0 0% 70%
- **Text Muted**: 0 0% 50%

## Typography

### Font Stack
- **Primary**: 'Inter', system-ui, sans-serif (via Google Fonts)
- **Monospace**: 'JetBrains Mono', monospace (for run IDs, coordinates)

### Type Scale
- **Display**: text-3xl font-bold (Dashboard headers)
- **H1**: text-2xl font-semibold (Page titles)
- **H2**: text-xl font-semibold (Section headers)
- **H3**: text-lg font-medium (Card titles)
- **Body**: text-base font-normal (Default text)
- **Small**: text-sm font-normal (Meta info, timestamps)
- **Tiny**: text-xs font-medium (Labels, tags, status badges)

## Layout System

### Spacing Primitives
**Core Units**: 2, 4, 6, 8, 12, 16, 20 (Tailwind scale)
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card gaps: gap-4 to gap-6
- Page margins: px-6 to px-8

### Grid Structure
- **Sidebar**: w-64 fixed (navigation, quick filters)
- **Main Content**: flex-1 with max-w-7xl container
- **Dashboard Grid**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 for stat cards
- **Data Tables**: Full-width responsive with horizontal scroll

### Responsive Breakpoints
- Mobile: Base styles (single column)
- Tablet: md: (sidebar collapses to hamburger, 2-col layouts)
- Desktop: lg: (full sidebar, 3-col grids, side panels)

## Component Library

### Navigation
- **Sidebar Navigation**: Fixed left sidebar with icon + label items, active state with primary color accent bar
- **Top Bar**: Breadcrumbs, operator name/logo, quick actions, notifications badge
- **Mobile Nav**: Hamburger menu with slide-out drawer

### Data Display Components
- **Stat Cards**: Elevated surface with icon, metric (text-3xl bold), label, trend indicator (↑↓%)
- **Route Cards**: Line number badge, operator name, type icon (bus/tram), stops count, status dot
- **Report Cards**: Type icon with semantic color, timestamp, location preview, description truncated, action menu
- **Schedule Table**: Sticky header, time column (monospace), destination, conditions tags, sequence indicators

### Status Indicators
- **Bus Status Dots**: 3px dot (h-3 w-3 rounded-full) - green (on-time), yellow (delay <5min), orange (delay 5-15min), red (>15min or failure)
- **Report Type Badges**: Pill-shaped (rounded-full px-3 py-1) with semantic colors - "delay" (warning), "accident" (danger), "failure" (danger), "change" (info)
- **Condition Tags**: Outlined pills for schedule conditions (weekday, weekend, holidays)

### Forms & Inputs
- **Input Fields**: Dark background (bg-surface-elevated), border on focus (primary color), placeholder text-muted
- **Select Dropdowns**: Custom styled with chevron icon, max-h-60 overflow scroll for long lists
- **Radio/Checkbox**: Primary color accent, larger touch targets (h-5 w-5)
- **Action Buttons**: Primary solid (bg-primary), Secondary outline (border-primary text-primary), Danger solid (bg-danger)

### Interactive Elements
- **Create Report Form**: Modal overlay with sections: Type selection (icon grid), Description textarea, Location picker (map + coordinates), Image upload
- **Route Selector**: Searchable dropdown with route number + name, operator filter
- **Date/Time Picker**: Inline calendar for schedule filtering

### Data Visualization
- **Delay Chart**: Bar chart showing delays by hour/route (Chart.js or similar)
- **Route Map**: Interactive map (Leaflet/Mapbox) showing bus positions, stops, and reported issues with color-coded markers
- **Timeline View**: Vertical timeline for report history with timestamps and status changes

### Overlays & Modals
- **Report Details Modal**: Full report info with map, images, edit/resolve actions
- **Confirmation Dialogs**: Centered card with title, message, action buttons (destructive actions in red)
- **Toasts**: Top-right positioned, auto-dismiss, semantic colors for success/error

## Animation & Interactions

### Minimal Motion Strategy
- **Card Hover**: Subtle scale (scale-[1.01]) or border glow - NO complex animations
- **Status Changes**: Smooth color transitions (transition-colors duration-200)
- **Loading States**: Subtle pulse on skeleton loaders, spinner for data fetching
- **Page Transitions**: Instant - NO page slides or fades

### Disabled Animations
- NO scroll-triggered effects
- NO parallax
- NO autoplay carousels
- Focus on instant feedback for clicks/taps

## Dashboard-Specific Patterns

### Overview Page Layout
1. **Top Stats Row**: 4 stat cards (Total Routes, Active Buses, Today's Reports, Avg Delay)
2. **Quick Actions**: Create Report button (prominent), View All Routes, Filter by Operator
3. **Recent Activity**: Split view - Recent Reports (left 60%) + Live Bus Positions Map (right 40%)
4. **Alert Banner**: Critical issues displayed at top with dismissible action

### Routes Management View
- **Filter Bar**: Route type (bus/tram), Operator dropdown, Search by name/number
- **Route List**: Cards with route badge, operator, type, stops preview, schedules count, "View Details" action
- **Route Details Panel**: Slides in from right showing full schedule tables, stop list, recent reports for that route

### Reports Dashboard
- **Filter Toolbar**: Type multi-select, Date range, Route filter, Status (open/resolved)
- **Reports Table**: Type icon, Route, Description (truncated), Location, Timestamp, Actions (View/Resolve)
- **Create Report FAB**: Fixed bottom-right floating action button (bg-primary rounded-full)

### Real-time Tracking
- **Map View**: Primary display with bus markers (colored by status), route lines, stops as pins
- **Side Panel**: Selected bus details - Route, Run ID, Last Update, Delay info, Passenger reports
- **Auto-refresh**: Live position updates every 15-30 seconds

## Accessibility & Dark Mode

### Dark Mode Implementation
- Default and only theme (operator tools used in low-light environments)
- High contrast text (WCAG AAA for body text)
- Form inputs with distinct focus states (2px primary border)
- Hover states visible even in dark mode

### Keyboard Navigation
- Tab order follows logical flow (sidebar → main content → actions)
- Escape closes modals/dropdowns
- Enter submits forms, Space toggles checkboxes
- Arrow keys navigate dropdown options

## Technical Specifications

### Icons
- **Library**: Heroicons (via CDN) - outline for navigation, solid for status/actions
- **Sizes**: w-5 h-5 (default), w-6 h-6 (prominent actions), w-4 h-4 (inline with text)

### Images
- **Operator Logos**: Small circular avatars (h-8 w-8) in route cards and top bar
- **Report Images**: Thumbnail preview (h-20 w-20) in cards, full-size in modal
- **Map Tiles**: Mapbox or OSM for tracking view with custom bus/stop markers

### Performance Priorities
- Lazy load route details and report images
- Virtual scrolling for long schedule tables
- Debounced search inputs (300ms)
- Optimistic UI updates for report creation

This dashboard prioritizes operational efficiency over visual flair - every element serves the operator's need to monitor, respond, and manage their bus network effectively.