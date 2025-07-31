# Healthcare Management System

## Overview

This is a modern healthcare management system built with a full-stack architecture using React, TypeScript, Express.js, and PostgreSQL. The application provides comprehensive patient management, appointment scheduling, clinical documentation, billing, and communication features for healthcare practices.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing
- **shadcn/ui** component library with Radix UI primitives
- **Tailwind CSS** for styling with CSS variables for theming
- **TanStack Query** for server state management and data fetching
- **React Hook Form** with Zod validation for form handling

### Backend Architecture
- **Express.js** server with TypeScript
- **RESTful API** design with structured route handlers
- **JWT-based authentication** with bcrypt for password hashing
- **Custom middleware** for request logging and error handling
- **Modular route structure** separating concerns

### Database Layer
- **PostgreSQL** with **Neon Database** as the serverless provider
- **Drizzle ORM** for type-safe database operations and migrations
- **Connection pooling** using Neon's serverless pool
- **Schema-first approach** with shared type definitions

## Key Components

### Authentication & Authorization
- JWT token-based authentication system
- Role-based access control (admin, practitioner, staff, patient)
- Secure password hashing with bcrypt
- Protected routes with middleware verification

### User Management
- Multi-role user system with extended profile tables
- Patient profiles with medical history, allergies, and insurance info
- Practitioner profiles with specializations and credentials
- User registration and login with form validation

### Database Schema
- **Users table**: Core user information with roles
- **Patients table**: Extended patient-specific data
- **Practitioners table**: Healthcare provider details
- **Appointments table**: Scheduling with status tracking
- **Clinical Notes table**: SOAP format documentation
- **Invoices table**: Billing and payment tracking
- **Messages table**: Secure communication system
- **Enum types**: Standardized status values and categories

### Frontend Features
- Responsive dashboard with statistics and quick actions
- Patient management with search and pagination
- Appointment scheduling with calendar integration
- Clinical notes with SOAP format
- Billing and invoice management
- Secure messaging system
- Reports and analytics views

## Data Flow

1. **Authentication Flow**: 
   - User login → JWT token generation → Token storage → Protected route access
   - Token verification middleware on API requests

2. **Data Fetching**:
   - TanStack Query handles caching and synchronization
   - API client with automatic token injection
   - Error handling with toast notifications

3. **Form Submission**:
   - React Hook Form validation → API request → Database update → UI refresh
   - Optimistic updates for better user experience

4. **Real-time Updates**:
   - Query invalidation triggers fresh data fetching
   - Toast notifications for user feedback

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL with connection pooling
- **Drizzle Kit**: Database migrations and schema management

### UI Components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **date-fns**: Date formatting and manipulation
- **class-variance-authority**: Type-safe CSS class variants

### Development Tools
- **Vite**: Fast development server with HMR
- **ESBuild**: Production bundling
- **TypeScript**: Type checking and compilation
- **PostCSS**: CSS processing with Tailwind

## Deployment Strategy

### Development Environment
- Vite development server with hot module replacement
- Express server running in development mode
- Database migrations handled by Drizzle Kit
- Environment variables for database connection

### Production Build
- Frontend: Static assets built with Vite and served by Express
- Backend: Bundled with ESBuild for Node.js runtime
- Database: Automated migrations on deployment
- Environment: Production optimizations enabled

### Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for token signing
- `NODE_ENV`: Environment mode (development/production)

### Build Process
1. TypeScript compilation and type checking
2. Frontend asset bundling with Vite
3. Backend bundling with ESBuild
4. Database schema push with Drizzle
5. Static file serving configuration

The application follows modern full-stack patterns with clear separation of concerns, type safety throughout, and scalable architecture suitable for healthcare environments requiring security and reliability.

## Recent Changes: Latest modifications with dates

### July 27, 2025
- ✅ **Fixed Authentication System**: Resolved 401 authentication errors by adding JWT token support to React Query's default fetch function in queryClient.ts
- ✅ **Updated Logo Branding**: Changed logo title from "TinHih" to "TiNHiH Portal" in both sidebar navigation and login screen
- ✅ **Created Super Admin Account**: Set up admin@tinhih.com / admin123 for backend access with admin role
- ✅ **Fixed Dashboard API Errors**: Handled cases where admin users don't have practitioner profiles, preventing UUID parsing errors
- ✅ **Fixed Calendar Import Error**: Added missing Calendar import in today-schedule.tsx component
- ✅ **Database Migration Completed**: Successfully pushed PostgreSQL schema with all EHR tables and relationships
- ✅ **Enhanced Error Handling**: Improved API error responses for non-practitioner users accessing dashboard endpoints
- ✅ **Fixed Patient Creation**: Resolved validation issues with userId and dateOfBirth fields in patient registration
- ✅ **Date Handling**: Implemented proper date conversion in insertPatientSchema for string-to-Date transformation
- ✅ **Patient Management**: Full CRUD operations working for patient records with user account creation
- ✅ **Fixed Patient Search**: Implemented proper case-insensitive search across names, email, phone, and insurance with debouncing
- ✅ **Built Comprehensive Calendar Module**: Created Carepatron-inspired calendar with "New" dropdown, off-canvas forms, week view, and team filtering
- ✅ **Updated Navigation**: Replaced "Appointments" with "Calendar" in sidebar navigation for better workflow integration
- ✅ **Implemented Yellow Color Scheme**: Updated primary color to yellow (#ffdd00) across all UI components for consistent branding
- ✅ **Added Logo Integration**: Replaced stethoscope icons with TiNHiH-Logo.png in both login screen and sidebar navigation
- ✅ **Enhanced Mobile Responsiveness**: Added mobile-first design with hamburger menu, responsive sidebar, mobile-optimized stats cards, and improved spacing
- ✅ **Fixed TypeScript Errors**: Added proper type definitions for dashboard statistics to eliminate LSP diagnostics
- ✅ **Fixed Mobile Sidebar Issue**: Resolved sidebar content not displaying on mobile devices by creating conditional rendering
- ✅ **Updated Calendar Colors**: Changed appointment backgrounds and view toggle buttons to use yellow primary color (#ffdd00)
- ✅ **Implemented Full Calendar Views**: Built functional Month and Day views with proper event display and navigation
- ✅ **Enhanced Calendar Interaction**: Added mini-calendar date selection that switches to Day view automatically
- ✅ **Fixed Nested Anchor Warning**: Resolved React DOM nesting warning by replacing anchor tags with div elements in sidebar navigation
- ✅ **Implemented Calendar Date Restrictions**: Added validation to prevent appointment creation for past dates - only today and future dates allowed
- ✅ **Updated Dashboard New Button**: Changed "New Appointment" button to "New" with full appointment creation form including date picker
- ✅ **Enhanced Dashboard Analytics**: Verified dashboard statistics API is working correctly with real-time data updates
- ✅ **Removed Duplicate Close Icon**: Fixed the duplicate red close button in appointment form - now only uses Sheet's built-in close
- ✅ **Added Appointment Conflict Validation**: Prevents creating appointments at the same date/time for the same practitioner
- ✅ **Fixed Clinical Notes Optional Appointment**: Made appointmentId properly optional in schema and form validation
- ✅ **Implemented Full Clinical Notes Module**: Added search, pagination, view details, and edit functionality with proper SOAP note display
- ✅ **Completed Billing Module**: Built comprehensive invoice management with creation, editing, viewing, status updates, search, filtering, and financial summary cards
- ✅ **Enhanced Invoice View**: Implemented Carepatron-inspired professional invoice layout with download/print/email functionality and patient payment processing
- ✅ **Fixed Billing Search & Filtering**: Resolved API endpoint issues preventing invoice search and status filtering from working properly
- ✅ **Fixed Logo Display**: Updated invoice detail view to properly display TiNHiH logo with fallback handling for missing images
- ✅ **Enhanced Invoice Data Loading**: Improved backend methods to handle search parameters and return proper invoice data with better error handling
- ✅ **Fixed Billing FROM Information**: Added complete practitioner and healthcare facility information to invoice detail view
- ✅ **Added Comprehensive Dummy Data**: Created 5 new patients with complete profiles, medical history, insurance information, and associated invoices
- ✅ **Enhanced Invoice Display**: Fixed missing patient and practitioner data display in both invoice list and detail views
- ✅ **Improved Pagination System**: Updated patient list with proper pagination controls and better data handling

### July 28, 2025
- ✅ **Fixed Duplicate Close Icon**: Removed duplicate close button from Edit Off-Canvas panel for cleaner UI interface
- ✅ **Completed Comprehensive Notification System**: Built live notification feed with bell icon in header, database integration, real-time updates, and unread count badges
- ✅ **Fixed Notification Bell Functionality**: Resolved JavaScript errors and made notification center fully clickable and functional with proper dropdown display
- ✅ **Added Realistic Sample Data**: Created 10 comprehensive clinical notes, 10 detailed appointments, and 10 telehealth sessions with authentic US healthcare scenarios
- ✅ **Fixed Database Schema Issues**: Resolved column mismatch errors in telehealth_sessions and calendar_settings tables for proper data insertion
- ✅ **Added Calendar Settings Database Schema**: Created calendarSettings table with support for time intervals, buffer time, working hours, and custom schedule configuration
- ✅ **Implemented Calendar Settings API**: Added REST endpoints for creating, reading, and updating calendar configuration settings
- ✅ **Built Calendar Settings Component**: Created comprehensive settings panel with time interval selection (15, 30, 45, 60 minutes), buffer time configuration, and working hours setup
- ✅ **Added Settings Button to Calendar**: Integrated settings access directly into calendar header with professional off-canvas panel
- ✅ **Dynamic Time Slot Generation**: Implemented configurable time slots based on practitioner preferences and global settings
- ✅ **Enhanced Calendar Grid**: Updated calendar to use dynamic slots instead of fixed 1-hour intervals, supporting custom time intervals
- ✅ **Buffer Time Validation**: Added buffer time feature to prevent appointment bookings within defined period before time slots
- ✅ **Working Hours Configuration**: Enabled admin and practitioner users to set default working hours and override for specific days
- ✅ **Time Slot Preview**: Added real-time preview of generated time slots in calendar settings for better user experience
- ✅ **Fixed Calendar Duplicate Key Warnings**: Resolved React key duplication warnings in calendar sidebar mini-calendar component
- ✅ **Enhanced Mobile Calendar Responsiveness**: Implemented mobile-first design with sidebar hidden on mobile, simplified compact layout for small screens
- ✅ **Fixed Off-Canvas Scrolling Issues**: Made all off-canvas panels fully scrollable and properly sized for different screen sizes
- ✅ **Calendar UI Simplification**: Implemented icons-only mode for day view to reduce clutter and improve visual clarity
- ✅ **Added Cursor Pointer Styling**: Enhanced user experience by adding cursor-pointer to all interactive calendar elements
- ✅ **Fixed Appointment Detail Behavior**: Ensured appointment details view doesn't trigger create appointment form incorrectly
- ✅ **Mobile Calendar Compact Mode**: Created simplified mobile view with essential functions only for optimal small-screen experience
- ✅ **Fixed Critical Calendar Refresh Bug**: Added query invalidation and refetch to ensure calendar layout updates immediately after settings save
- ✅ **Added Mobile Menu Toggle**: Implemented hamburger menu for mobile devices, consistently accessible across all modules including Calendar
- ✅ **Fixed Sheet Dialog Accessibility**: Added required DialogTitle and Description for proper screen reader support
- ✅ **Enhanced Calendar Settings Refresh**: Calendar now properly reflects new time intervals, working hours, and all configuration changes without page reload
- ✅ **Updated Official Logo**: Replaced all logo references with the official TiNHiH SVG logo from tinhih.org throughout the entire application
- ✅ **Enhanced Login Screen**: Updated subtitle to "TiNHiH Foundation Services Management Portal" for better branding
- ✅ **Redesigned Sidebar Navigation**: Organized navigation into logical sections (Dashboard, Patient Care, Scheduling, Business Operations) with improved visual design
- ✅ **Modern Sidebar Styling**: Added gradient backgrounds, section headers, enhanced user profile area with role badges, and improved hover states
- ✅ **Updated Patient Data to US Demographics**: Replaced all example data with authentic US citizen names, addresses, phone numbers, and medical scenarios
- ✅ **Enhanced Clinical Documentation**: Updated all clinical notes with detailed SOAP format using realistic US medical conditions and treatments
- ✅ **Realistic Healthcare Billing**: Updated invoice data with proper CPT codes, US healthcare pricing, and authentic medical service descriptions
- ✅ **Comprehensive US Address System**: Added real US cities, states, ZIP codes, and area codes for all patient profiles
- ✅ **Updated Branding Text**: Changed main title to "TiNHiH Foundation" and subtitle to "Management Portal" across login screen and admin dashboard
- ✅ **Built Comprehensive Inter-Module Integration System**: Created unified workflows connecting Calendar, Appointments, Telehealth, Clinical Notes, Billing, and Messages modules for seamless healthcare operations
- ✅ **Implemented Integration Service**: Added backend service handling cross-module dependencies, appointment workflows, patient timelines, and practitioner dashboards with comprehensive data relationships
- ✅ **Created Unified Search**: Built cross-module search functionality allowing users to search across patients, appointments, clinical notes, and invoices from a single interface
- ✅ **Added Quick Actions Components**: Implemented context-aware quick action buttons for streamlined workflows between modules (schedule from patient view, create notes from appointments, etc.)
- ✅ **Built Patient Timeline**: Created comprehensive timeline view showing all patient interactions across appointments, clinical notes, invoices, telehealth sessions, and messages in chronological order
- ✅ **Enhanced Contextual Sidebar**: Added dynamic sidebar showing relevant information and quick actions based on current module context (patient details, recent activity, related records)
- ✅ **Integrated Appointment Workflows**: Enhanced appointment creation to automatically generate clinical note templates, invoices, telehealth sessions, and notification messages
- ✅ **Added Cross-Module API Endpoints**: Created integration endpoints for patient timelines, practitioner dashboards, contextual data, and unified search functionality
- ✅ **Implemented Workflow Completion**: Added comprehensive appointment completion workflow updating status, finalizing notes, sending invoices, and creating follow-up reminders automatically
- ✅ **Fixed User Menu and Settings System**: Replaced settings gear icon with proper user dropdown menu containing profile settings, password change, notifications, and logout functionality
- ✅ **Created Professional User Settings Modal**: Built comprehensive user settings form with tabbed interface for profile management, security settings, and user preferences with form validation
- ✅ **Enhanced User Profile Area**: Updated sidebar user area to display as clickable dropdown menu with proper user information, role badges, and organized menu options
- ✅ **Separated Settings from Logout**: Fixed issue where settings gear was logging users out - now settings opens user preferences while logout is clearly separated in dropdown menu
- ✅ **Added Dropdown Menu Component**: Implemented Radix UI dropdown menu component with proper accessibility features and professional styling for user interactions
- ✅ **REBUILT COMPLETE THEME SYSTEM**: Completely recreated dark/light/auto theme system with proper CSS variables, fixed sidebar theming, and comprehensive color management
- ✅ **Fixed Database Schema Duplicates**: Resolved duplicate field errors in user preferences table for reduceMotion and screenReaderOptimized
- ✅ **Enhanced CSS Variables Architecture**: Implemented proper HSL color format for all theme variables with sidebar-specific color tokens
- ✅ **Created Theme Toggle Component**: Built comprehensive theme switcher with light/dark/auto modes and proper visual feedback
- ✅ **Fixed Sidebar Theme Integration**: Updated entire sidebar component to use CSS variables and respond properly to theme changes
- ✅ **Enhanced Theme Context**: Improved theme application logic to work on both document root and body elements with system theme detection
- ✅ **Added Accessibility Features**: Implemented font size scaling, compact mode, high contrast mode, reduced motion, and screen reader optimizations
- ✅ **Comprehensive Color System**: Added sidebar-specific color variables and ensured all components inherit theme colors properly
- ✅ **Theme Transition Effects**: Added smooth transitions for theme changes across all components with 300ms duration
- ✅ **COMPLETED UNIFIED THEME SYSTEM**: Created comprehensive themed component library (ThemedCard, ThemedInput, ThemedButton) and updated entire application to use unified CSS variables for perfect dark/light/auto mode switching
- ✅ **Fixed Header Dark Mode**: Completely rewritten header component with proper theming for search bar, buttons, and all UI elements
- ✅ **Updated All Dashboard Components**: Systematically converted stats-cards, quick-actions, today-schedule, insights-cards, and recent-activity to use themed components with smooth transitions
- ✅ **Fixed Sidebar Navigation Scrolling**: Resolved navigation scroll issue by restructuring overflow properties and flex layout for proper scrollable navigation area
- ✅ **FIXED ALL DROPDOWN TRANSPARENCY ISSUES**: Created comprehensive ThemedDropdownMenu component system with solid backgrounds that properly respond to theme system across all modules (Calendar, Notifications, User Menu, Theme Toggle, Telehealth)
- ✅ **ADDED CONSISTENT MODULE HEADERS**: Created ModuleHeader component and updated Telehealth and Settings pages with proper headers matching design consistency across all modules
- ✅ **COMPLETED TELEHEALTH DARK MODE**: Completely overhauled Telehealth page with proper ThemedCard components, CSS variable styling, and comprehensive dark mode support
- ✅ **UPDATED SETTINGS PAGE THEMING**: Applied comprehensive theming to Settings page with ModuleHeader integration and ThemedCard components throughout
- ✅ **FIXED TELEHEALTH MODULE HEADER**: Resolved TypeScript compilation errors preventing telehealth header display, created professional VideoRoom and SessionDashboard components
- ✅ **COMPLETED PROFESSIONAL TELEHEALTH MODULE**: Built comprehensive telehealth system following modern healthcare application best practices with video consultation interface, session management dashboard, and multi-platform support
- ✅ **CREATED VIDEO ROOM COMPONENT**: Professional video consultation interface with picture-in-picture layout, call controls (mute, video, speaker), real-time connection quality, session chat, and clinical notes
- ✅ **BUILT SESSION DASHBOARD**: Comprehensive telehealth session management with today/upcoming/completed tabs, session statistics, platform icons, and session control actions
- ✅ **IMPLEMENTED MODERN TELEHEALTH DESIGN**: Following 2025 healthcare application standards with user-centered design, accessibility features, HIPAA-compliant security, and professional medical interface

### July 29, 2025
- ✅ **FIXED CRITICAL PAYMENT FLOW ISSUE**: Resolved premature payment intent creation that was happening on modal display instead of user confirmation
- ✅ **FIXED CRITICAL PAYMENT FLOW ISSUE**: Resolved premature payment intent creation and Stripe context errors by restructuring component architecture
- ✅ **SIMPLIFIED PAYMENT UX**: Streamlined flow to direct "Make Payment" → Payment Intent → "Confirm Payment" without extra initialization steps
- ✅ **PREVENTED DUPLICATE PAYMENT RECORDS**: Fixed payment history API to filter out duplicate payment intents for cleaner transaction records
- ✅ **AUTOMATED INVOICE STATUS UPDATES**: Ensured invoices automatically change to "paid" status immediately after successful payment completion
- ✅ **IMPLEMENTED PROFESSIONAL RECEIPT DOWNLOAD**: Added functional receipt generation with professional healthcare formatting and branding
- ✅ **RESTORED SIMPLIFIED PAYMENT FLOW**: Removed extra initialization step per user request - now direct payment intent creation when modal opens