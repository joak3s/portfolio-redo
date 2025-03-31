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
- 💬 AI-powered chat interface

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home page
│   ├── layout.tsx          # Root layout
│   ├── journey/            # Journey/timeline section
│   ├── work/               # Portfolio work section
│   ├── contact/            # Contact section  
│   ├── featured/           # Featured projects
│   ├── playground/         # Interactive demos
│   ├── admin/              # Admin dashboard
│   └── api/                # API routes
├── components/             # Reusable components
│   ├── ui/                 # Shadcn UI components
│   ├── auth/               # Authentication components
│   ├── journey/            # Journey components
│   └── playground/         # Interactive components
├── lib/                    # Utility functions
│   └── supabase/           # Supabase client
├── styles/                 # Global styles
├── hooks/                  # Custom React hooks
├── public/                 # Static assets
├── supabase/               # Supabase configuration
│   └── migrations/         # Database migrations
├── scripts/                # Build/deployment scripts
└── middleware.ts           # Next.js middleware
```

### Environment Setup

The project uses environment files for different contexts:
- `.env.local` - Local development variables (not committed to git)
- `.env` - Base environment variables

### Data Management

Data is managed through Supabase, providing:
- Real-time data synchronization
- Secure authentication with SSR support
- Row-level security
- Type-safe database operations
- Image and file storage

### SQL Migrations

The project includes SQL migration files for:
- Journey/milestone data structure and images
- Project showcase structure
- User authentication and permissions
- Media storage configuration

### Deployment

The project is optimized for deployment on Vercel with:
- Automatic preview deployments
- Edge functions support
- Asset optimization
- Analytics integration
- Environment variable management
- Custom deployment scripts

