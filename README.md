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

## 🧪 Development

### Prerequisites

- Node.js 18+ and pnpm
- Git

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy `.env.example` to `.env` and configure your environment variables
4. Start the development server:
   ```bash
   pnpm dev
   ```

### Commands

- `pnpm dev`: Start development server
- `pnpm build`: Build production bundle
- `pnpm start`: Start production server
- `pnpm lint`: Run ESLint
- `pnpm type-check`: Run TypeScript compiler

### Code Style

- Follow TypeScript best practices
- Use functional components
- Implement proper error boundaries
- Add JSDoc comments for complex functions
- Follow the Airbnb Style Guide

## 🚀 Deployment

The site is configured for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy!

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Jordan Oakes**
- Website: [jordanoakes.com](https://jordanoakes.com)
- GitHub: [@yourusername](https://github.com/yourusername)

## 🙏 Acknowledgments

- [Shadcn UI](https://ui.shadcn.com/) for the component library
- [Vercel](https://vercel.com) for hosting
- [Next.js](https://nextjs.org) team for the amazing framework 