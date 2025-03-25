Portfolio Website

A modern, high-performance portfolio website built with Next.js 15 and React 19, leveraging Server Components and the App Router for optimal performance and SEO. This portfolio showcases my work and journey as a developer with a focus on modern web technologies and best practices.

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Runtime:** React 19 with Server Components
- **Language:** TypeScript
- **Database & Auth:** Supabase
- **Styling:** 
  - Tailwind CSS
  - CSS Modules
  - Tailwind CSS Animations
- **UI Components:** 
  - Radix UI (Accessible primitives)
  - Shadcn UI (Beautiful, accessible components)
- **Animations:** Framer Motion v11
- **Form Handling:** React Hook Form with Zod validation
- **State Management:** React Server Components + Client Hooks
- **Date Handling:** date-fns
- **Deployment:** Vercel
- **Image Optimization:** Sharp
- **Security:** Next.js Middleware
- **Environment:** Configured with multiple environments (.env.local, .env.production)

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
- 📝 Blog/Journey section
- 🎮 Interactive components
- 📬 Type-safe forms with React Hook Form + Zod
- 🔍 SEO optimized with Next.js metadata
- 🔄 Smooth page transitions
- 📊 Analytics ready

## Project Structure

```
├── app/                    # Next.js 15 App Router
│   ├── (routes)/          # Route groups
│   ├── api/               # API routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # Shadcn UI components
│   └── shared/           # Shared components
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase client
│   └── utils/            # Helper functions
├── styles/               # Global styles
├── hooks/                # Custom React hooks
├── public/               # Static assets
├── supabase/             # Supabase configuration
├── scripts/              # Build/deployment scripts
└── middleware.ts         # Next.js middleware
```

### Environment Setup

The project uses multiple environment files for different contexts:
- `.env.local` - Local development variables
- `.env.production` - Production environment variables
- `.env.example` - Template for required environment variables

### Data Management

Data is managed through Supabase, providing:
- Real-time data synchronization
- Secure authentication
- Row-level security
- Type-safe database operations

### Deployment

The project is optimized for deployment on Vercel with:
- Automatic preview deployments
- Edge functions support
- Asset optimization
- Analytics integration
- Environment variable management

# Supabase CLI (v1)

[![Coverage Status](https://coveralls.io/repos/github/supabase/cli/badge.svg?branch=main)](https://coveralls.io/github/supabase/cli?branch=main) [![Bitbucket Pipelines](https://img.shields.io/bitbucket/pipelines/supabase-cli/setup-cli/master?style=flat-square&label=Bitbucket%20Canary)](https://bitbucket.org/supabase-cli/setup-cli/pipelines) [![Gitlab Pipeline Status](https://img.shields.io/gitlab/pipeline-status/sweatybridge%2Fsetup-cli?label=Gitlab%20Canary)
](https://gitlab.com/sweatybridge/setup-cli/-/pipelines)

[Supabase](https://supabase.io) is an open source Firebase alternative. We're building the features of Firebase using enterprise-grade open source tools.

This repository contains all the functionality for Supabase CLI.

- [x] Running Supabase locally
- [x] Managing database migrations
- [x] Creating and deploying Supabase Functions
- [x] Generating types directly from your database schema
- [x] Making authenticated HTTP requests to [Management API](https://supabase.com/docs/reference/api/introduction)

