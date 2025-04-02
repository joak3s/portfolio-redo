import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | Jordan Oakes',
  description: 'Learn about Jordan Oakes, a UX Designer and AI Specialist with 10+ years of experience creating user-centered digital experiences.',
  openGraph: {
    title: 'About Jordan Oakes | UX Designer & AI Specialist',
    description: 'Learn about Jordan Oakes, a UX Designer and AI Specialist with 10+ years of experience creating user-centered digital experiences.',
    images: [
      {
        url: '/jordan-headshot.jpg',
        width: 800,
        height: 800,
        alt: 'Jordan Oakes',
      },
    ],
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
} 