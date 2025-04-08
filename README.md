# Portfolio Website

A modern, high-performance portfolio website built with Next.js and Supabase leveraging Server Components and the App Router for optimal performance and SEO. This portfolio showcases my work and journey as a developer with a focus on modern web technologies and best practices.

## Tech Stack

- **Framework:** Next.js 14.2.x with App Router
- **Runtime:** React 18 with Server Components
- **Language:** TypeScript
- **Database & Auth:** Supabase with SSR client
- **Styling:** 
  - Tailwind CSS
  - CSS Modules
  - Tailwind CSS Animations
- **UI Components:** 
  - Radix UI (Accessible primitives)
  - Shadcn UI (Beautiful, accessible components)
- **Animations:** Framer Motion 11
- **Form Handling:** React Hook Form with Zod validation
- **State Management:** React Server Components + Client Hooks
- **Date Handling:** date-fns 3.6
- **Deployment:** Vercel
- **Image Optimization:** Sharp
- **Security:** Next.js Middleware
- **AI Integration:** OpenAI API with RAG capabilities
- **Interactive Elements:**
  - Embla Carousel
  - Drag and Drop with react-dropzone
  - Toast notifications with Sonner
- **Environment:** Configured with multiple environments (.env.local, .env)

## Features

- ⚡ Server-side Rendering & Static Generation
- 🎨 Modern, responsive design with Tailwind CSS
- 🔒 Secure authentication with Supabase
- 🌙 Dark/Light mode with next-themes
- 🖼️ Optimized image loading with Sharp
- 📱 Mobile-first approach
- ♿ ARIA-compliant accessible components
- 🚀 Performance optimized
  - Minimal client-side JavaScript
  - Optimized font loading
  - Image optimization
  - Route prefetching
- 📝 Journey/Timeline section with milestone tracking
- 🎮 Interactive components and playground
- 📬 Type-safe forms with React Hook Form + Zod
- 🔍 SEO optimized with Next.js metadata
- 🔄 Smooth page transitions with Framer Motion
- 📊 Admin dashboard for content management
- 🖼️ File upload capabilities with image previews
- 📱 Responsive image galleries and carousels
- 💬 AI-powered chat interface with RAG (Retrieval Augmented Generation)
  - Context-aware responses
  - Project information retrieval
  - Hybrid search for relevant content

## Project Structure

```
├── app/                      # Next.js App Router
│   ├── page.tsx              # Home page with AI Chatbot
│   ├── layout.tsx            # Root layout
│   ├── loading.tsx           # Global loading state
│   ├── error.tsx             # Global error handling
│   ├── globals.css           # Global styles
│   ├── about/                # About page
│   ├── actions/              # Server actions
│   ├── admin/                # Admin dashboard
│   │   ├── page.tsx          # Project management
│   │   └── journey/          # Journey management
│   ├── api/                  # API routes
│   │   ├── admin/            # Admin-only endpoints
│   │   ├── auth/             # Authentication endpoints
│   │   ├── chat/             # AI chat with RAG endpoint
│   │   ├── debug/            # Debugging endpoints
│   │   ├── journey/          # Journey data endpoints
│   │   ├── projects/         # Project data endpoints
│   │   ├── tools/            # Tools data endpoints
│   │   ├── upload-image/     # Image upload endpoints
│   │   └── upload-journey-image/ # Journey image uploads
│   ├── auth/                 # Authentication pages
│   ├── contact/              # Contact section
│   ├── featured/             # Featured projects
│   ├── playground/           # Interactive demos
│   ├── test-rag/             # RAG testing interface
│   └── work/                 # Portfolio work section
│       └── [slug]/           # Individual project pages
├── components/               # Reusable components
│   ├── AIChat.tsx            # AI Chat component
│   ├── navbar.tsx            # Navigation component
│   ├── project-card.tsx      # Project card component
│   ├── project-carousel.tsx  # Projects carousel
│   ├── project-content.tsx   # Project detail component
│   ├── project-image-gallery.tsx # Image gallery
│   ├── project-image-upload.tsx # Image upload component
│   ├── streaming-text-joakes.tsx # Text streaming component
│   ├── theme-provider.tsx    # Theme context provider
│   ├── theme-toggle.tsx      # Theme switcher
│   ├── auth/                 # Authentication components
│   ├── journey/              # Journey components
│   ├── playground/           # Interactive components
│   └── ui/                   # Shadcn UI components
├── lib/                      # Utility functions
│   ├── api/                  # API utilities
│   ├── supabase/             # Supabase utilities
│   ├── types/                # TypeScript type definitions
│   ├── cms.ts                # CMS helper functions
│   ├── database.types.ts     # Generated Supabase types
│   ├── project-helpers.ts    # Project helper functions
│   ├── rag-utils.ts          # RAG utilities
│   ├── storage.ts            # Storage utilities
│   ├── supabase.ts           # Supabase client exports
│   ├── supabase-admin.ts     # Admin Supabase client
│   ├── supabase-browser.ts   # Browser Supabase client
│   ├── supabase-server.ts    # Server Supabase client
│   ├── types.ts              # Common type definitions
│   └── utils.ts              # General utilities
├── public/                   # Static assets
├── styles/                   # Additional styles
├── hooks/                    # Custom React hooks
├── supabase/                 # Supabase configuration
│   ├── migrations/           # Database migrations
│   └── migrations_backup/    # Backup of old migrations
├── scripts/                  # Build/deployment scripts
└── middleware.ts             # Next.js middleware
```

## Supabase Database Structure

The project uses Supabase for database, storage, and authentication:

### Core Tables
- `projects` - Portfolio projects with metadata
- `project_images` - Images associated with projects
- `tools` - Technologies used in projects
- `tags` - Categories for projects
- `journey` - Career milestones and achievements
- `journey_images` - Images for journey entries

### Junction Tables
- `project_tools` - Links projects to tools
- `project_tags` - Links projects to tags

### AI Chat Tables
- `embeddings` - Vector embeddings for RAG
- `general_info` - General information for RAG
- `chat_history` - Record of chat interactions
- `conversation_sessions` - Multi-turn conversation tracking

### Views
- `projects_with_tools` - Projects with associated tools
- `projects_with_tags` - Projects with associated tags
- `projects_with_cover_images` - Projects with their cover images
- `complete_projects` - Comprehensive project data with relations

## Supabase Configuration

This project uses Supabase for authentication, database, and storage. By default, the application connects to the remote Supabase instance in production, but a local development instance can be used for testing database changes.

### Switching Between Local and Remote Supabase

The project is set up to use the remote Supabase instance by default. To switch between remote and local instances:

1. **Using Remote Supabase (Default)**
   - The default configuration in `.env.development` points to the remote instance
   - Ensure remote instance credentials are uncommented in `.env.development`

2. **Using Local Supabase (For Development)**
   - Start the local Supabase instance: `npx supabase start`
   - Edit `.env.development` to comment out remote credentials and uncomment local credentials
   - Restart your Next.js development server

### Managing Database Changes

When making schema changes:

1. **Pull Latest Remote Schema**
   ```bash
   npx supabase db pull
   ```

2. **Create a New Migration**
   ```bash
   npx supabase migration new my_change_name
   ```

3. **Edit the Migration File**
   Edit the generated file in `supabase/migrations/` to include your changes.

4. **Push Changes to Remote**
   ```bash
   npx supabase db push
   ```

5. **Check Migration Status**
   ```bash
   npx supabase migration list
   ```

### Troubleshooting

If you encounter errors with migrations:

1. **Repair Migration History**
   ```bash
   npx supabase migration repair --status applied MIGRATION_ID
   ```

2. **Sync Local and Remote**
   ```bash
   npx supabase db reset
   npx supabase db pull
   ```

## Development

### Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

### Environment Variables

Make sure to set up your environment variables in `.env.local` or `.env.development.local` file:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase instance URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for admin operations)

## Deployment

Deploy your Next.js app to Vercel:

## Supabase Integration Improvements

Recent improvements to the Supabase integration:

### Admin Panel Security Enhancements

- **Secure Service Role Handling**: Implemented proper server-side handling of the Supabase service role key, ensuring it's never exposed to the client.
- **Server Actions**: Created dedicated server actions in `app/actions/admin.ts` for all admin operations, replacing direct client-side API calls.
- **Type Safety**: Enhanced TypeScript definitions in `lib/database.types.ts` to match the actual database schema.

### Journey Management

- **Schema Update**: Properly integrated the new "journey" and "journey_images" tables, replacing the old "journey_milestones" schema.
- **Admin Interface**: Updated the admin interface to work with the new schema while maintaining compatibility with existing frontends.
- **API Endpoint**: Created a secure API endpoint (`/api/journey`) for client-side access to journey data.

### Supabase Client Refactoring

- **Unified Client Access**: Consolidated Supabase client implementations into centralized files:
  - `lib/supabase-browser.ts` - For client-side access with anon key
  - `lib/supabase-server.ts` - For server components with user auth
  - `lib/supabase-admin.ts` - For server actions with service role

- **Error Handling**: Improved error handling throughout the application with better error messages and graceful fallbacks.

# Deployment Guide

## Fixing Vercel Deployment Issues

If you encounter these errors during deployment:

1. **Supabase Admin Import Error**: 
   - Error: `Attempted import error: 'supabaseAdmin' is not exported from '@/lib/supabase-admin'`
   - Fix: Run `npm run update-api-imports` to update all API files to use `getAdminClient()` instead of directly importing `supabaseAdmin`

2. **Prisma Generation Error**:
   - Error: `Prisma has detected that this project was built on Vercel, which caches dependencies`
   - Fix: 
     - We've updated the build process to include Prisma generation
     - Added `"postinstall": "prisma generate"` to package.json
     - Modified build script to `"build": "prisma generate && next build"`
     - Added vercel.json with explicit buildCommand

## Deployment Steps

1. **Before deploying**:
   - Run `npm run update-api-imports` locally to fix any Supabase admin import issues
   - Commit and push the changes

2. **Environment Variables**:
   Make sure these are set in your Vercel project:
   - `DATABASE_URL` - Your Supabase PostgreSQL connection string
   - `DIRECT_URL` - Direct Supabase database URL
   - `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for admin operations)
   
3. **Deployment**:
   The project should now deploy successfully to Vercel with the proper Prisma setup.

