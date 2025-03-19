# Portfolio Project

A modern, performant portfolio website built with Next.js 15 and React 18.

## Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Animations:** Framer Motion
- **State Management:** React Hooks
- **Form Handling:** React Hook Form
- **Validation:** Zod
- **Deployment:** Vercel

## Project Structure

```
├── app/
│   ├── (routes)/           # All route components
│   ├── components/         # Reusable components
│   ├── hooks/             # Custom React hooks
│   ├── lib/              # Utility functions and shared logic
│   ├── styles/           # Global styles and Tailwind config
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
└── package.json         # Project dependencies and scripts
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Project Features

- Modern UI with Shadcn components
- Smooth animations with Framer Motion
- Responsive design with Tailwind CSS
- Type-safe development with TypeScript
- Server-side rendering with Next.js
- Optimized for performance and SEO

## Best Practices

- Use Server Components by default
- Client Components only when necessary (state, effects)
- Implement loading states with loading.tsx
- Handle errors with error.tsx
- Follow TypeScript best practices
- Keep components modular and reusable

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

This project is licensed under the MIT License. 