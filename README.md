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

## Using Supabase CLI

The project leverages Supabase CLI for database management:

### Installation & Setup

```bash
# Install Supabase CLI via Homebrew
brew install supabase/tap/supabase

# Add to your PATH if needed
export PATH="/opt/homebrew/bin:$PATH"

# Start local Supabase instance
supabase start
```

### Managing Migrations

```bash
# Create a new migration
supabase migration new migration_name

# Apply migrations to local database
supabase db reset

# Push migrations to remote
supabase db push

# Diff between local and remote
supabase db diff --use-migra --linked
```

### Working with Remote Database

```bash
# Get remote schema changes
supabase db pull

# Get tables from the remote database
supabase db remote tables 

# Backup remote database
supabase db dump --linked -f backup.sql
```

### Troubleshooting Migrations

```bash
# Repair migration history
supabase migration repair --status applied migration_id

# Show migration status
supabase migration list
```

### Best Practices

1. Always backup before pushing migrations
2. Use idempotent SQL (`IF NOT EXISTS`, etc.)
3. Test migrations locally before pushing
4. Keep migration files small and focused
5. Document complex migrations

## Environment Setup

The project uses environment files for different contexts:
- `.env.local` - Local development variables (not committed to git)
- `.env` - Base environment variables

For local development with Supabase:
- `.env.development.local` - Local Supabase configuration

## Development Status

Currently implementing:
- AI Chat integration with RAG capabilities
- Conversation context for multi-turn interactions
- Project detail pages with related content

Next steps:
- Enhancing AI feedback mechanisms
- Integrating chat component throughout the site
- Adding analytics for chat interactions

## Deployment

The project is optimized for deployment on Vercel with:
- Automatic preview deployments
- Edge functions support
- Asset optimization
- Analytics integration
- Environment variable management
- Custom deployment scripts

