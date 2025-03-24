# Portfolio Website

A modern, performant portfolio website built with Next.js 15 and React 19, showcasing my work and journey as a developer.

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** 
  - Radix UI (Accessible primitives)
  - Shadcn UI (Beautiful, accessible components)
- **Animations:** Framer Motion
- **Form Handling:** React Hook Form with Zod validation
- **State Management:** React Hooks
- **Deployment:** Vercel

## Features

- 🎨 Modern, responsive design
- ⚡ Server-side rendering with Next.js
- 🎭 Dark/Light mode support
- 🖼️ Project showcase with image galleries
- 📱 Mobile-first approach
- ♿ Accessibility-first components
- 🚀 Optimized performance
- 📝 Blog-like journey section
- 🎮 Interactive playground
- 📬 Contact form

## Project Structure

### API Routes

The project uses Next.js API routes for handling data operations:

#### Public Routes
- `/api/projects` - List all published projects
- `/api/projects/[slug]` - Get a single project by slug

#### Admin Routes
- `/api/admin/projects` - List all projects (including drafts) and create new projects
- `/api/admin/projects/[id]` - Get, update, or delete a specific project by ID

### Image Storage

Project images are stored in the `/public/projects` directory with the following structure:
```
public/
  projects/
    project-slug/
      image1.jpg
      image2.jpg
      ...
```

The first image in the array is automatically used as the project thumbnail.

### Data Storage

Project data is stored in `/public/data/projects.json`. This file is automatically created when needed.

```
├── app/                    # Next.js 15 App Router
│   ├── (routes)/          # Route components
│   ├── api/               # API routes
│   ├── admin/             # Admin dashboard
│   ├── journey/           # Journey/blog section
│   ├── playground/        # Interactive demos
│   └── work/              # Project showcase
├── components/            # Reusable components
├── data/                  # Static data and content
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions
├── public/               # Static assets
└── styles/               # Global styles
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/joak3s/portfolio-redo.git
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Best Practices

- Use Server Components by default
- Client Components only when necessary (state, effects)
- Implement loading states with `loading.tsx`
- Handle errors with `error.tsx`
- Follow TypeScript best practices
- Keep components modular and reusable

## Contributing

While this is a personal portfolio project, suggestions and feedback are welcome! Please feel free to:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the MIT License.

## Contact

Feel free to reach out through the contact form on the website or directly via GitHub.