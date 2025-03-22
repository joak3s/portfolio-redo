# Jordan Oakes Portfolio

A modern, performant portfolio website built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Interactive Portfolio**: Dynamic showcase of projects and work experience
- **Playground Section**: Interactive demos and experiments
- **Journey Timeline**: Visual representation of professional experience
- **Contact System**: Modern contact form with validation
- **Admin Dashboard**: Protected admin area for content management
- **Responsive Design**: Mobile-first approach with modern UI components
- **Performance Optimized**: Server-side rendering with Next.js 15
- **Accessibility**: WCAG compliant with proper ARIA attributes
- **Dark Mode**: System-aware theme switching with next-themes

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Tailwind Typography
- **Components**: Shadcn UI + Radix UI primitives
- **Animations**: Framer Motion
- **Form Handling**: React Hook Form
- **Validation**: Zod
- **State Management**: React Context + Hooks
- **UI Enhancements**: 
  - Embla Carousel
  - React Day Picker
  - React Dropzone
  - React Resizable Panels
  - TSParticles
  - Recharts
  - Sonner (Toast notifications)
  - Vaul (Drawer components)

## 🏗 Project Structure

```
├── app/                  # Next.js 15 app directory
│   ├── admin/           # Admin dashboard
│   ├── api/             # API routes
│   ├── carousel-demo/   # Carousel component demos
│   ├── contact/         # Contact page
│   ├── featured/        # Featured projects
│   ├── journey/         # Professional journey
│   ├── playground/      # Interactive demos
│   ├── work/           # Work portfolio
│   ├── layout.tsx      # Root layout
│   ├── page.tsx        # Home page
│   ├── error.tsx       # Error boundary
│   └── loading.tsx     # Loading states
├── components/          # UI components
│   ├── ui/             # Shadcn UI components
│   └── [feature]/      # Feature-specific components
├── hooks/              # Custom React hooks
├── lib/               # Utilities and helpers
├── styles/            # Global styles
├── data/              # Static data and content
└── public/            # Static assets
```