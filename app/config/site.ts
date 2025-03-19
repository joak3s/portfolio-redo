import { SiteConfig } from '@/app/types/project';

export const siteConfig: SiteConfig = {
  name: 'Jordan Oakes',
  description: 'UX Designer and AI Specialist showcasing innovative projects and expertise in design and artificial intelligence.',
  url: 'https://jordanoakes.com',
  ogImage: '/og.jpg',
  links: {
    github: 'https://github.com/yourusername',
    linkedin: 'https://linkedin.com/in/yourusername',
    email: 'your.email@example.com',
  },
  nav: [
    {
      title: 'Home',
      href: '/',
    },
    {
      title: 'Work',
      href: '/work',
    },
    {
      title: 'Featured',
      href: '/featured',
    },
    {
      title: 'Journey',
      href: '/journey',
    },
    {
      title: 'Contact',
      href: '/contact',
    },
  ],
  social: [
    {
      platform: 'GitHub',
      url: 'https://github.com/yourusername',
      icon: 'github',
    },
    {
      platform: 'LinkedIn',
      url: 'https://linkedin.com/in/yourusername',
      icon: 'linkedin',
    },
    {
      platform: 'Email',
      url: 'mailto:your.email@example.com',
      icon: 'mail',
    },
  ],
}; 