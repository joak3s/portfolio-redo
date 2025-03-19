export interface Project {
  id: string;
  title: string;
  description: string;
  slug: string;
  featured: boolean;
  date: string;
  technologies: string[];
  images: {
    main: string;
    gallery?: string[];
    thumbnail?: string;
  };
  content: string;
  liveUrl?: string;
  githubUrl?: string;
  caseStudy?: {
    problem: string;
    solution: string;
    results: string;
  };
}

export interface ProjectMetadata {
  title: string;
  description: string;
  date: string;
  technologies: string[];
  featured: boolean;
}

export interface NavItem {
  title: string;
  href: string;
  external?: boolean;
}

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  links: {
    github: string;
    linkedin: string;
    email: string;
  };
  nav: NavItem[];
  social: SocialLink[];
} 