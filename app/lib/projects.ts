import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { Project, ProjectMetadata } from '@/app/types/project';

const projectsDirectory = path.join(process.cwd(), 'public/projects');

export async function getAllProjects(): Promise<Project[]> {
  const fileNames = fs.readdirSync(projectsDirectory);
  
  const projects = await Promise.all(
    fileNames.map(async (fileName) => {
      const slug = fileName.replace(/\.md$/, '');
      const fullPath = path.join(projectsDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data, content } = matter(fileContents);
      
      return {
        id: slug,
        slug,
        title: data.title,
        description: data.description,
        featured: data.featured || false,
        date: data.date,
        technologies: data.technologies || [],
        images: {
          main: data.mainImage,
          gallery: data.gallery || [],
          thumbnail: data.thumbnail,
        },
        content,
        liveUrl: data.liveUrl,
        githubUrl: data.githubUrl,
        caseStudy: data.caseStudy,
      };
    })
  );

  return projects.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  try {
    const fullPath = path.join(projectsDirectory, `${slug}.md`);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      id: slug,
      slug,
      title: data.title,
      description: data.description,
      featured: data.featured || false,
      date: data.date,
      technologies: data.technologies || [],
      images: {
        main: data.mainImage,
        gallery: data.gallery || [],
        thumbnail: data.thumbnail,
      },
      content,
      liveUrl: data.liveUrl,
      githubUrl: data.githubUrl,
      caseStudy: data.caseStudy,
    };
  } catch (error) {
    return null;
  }
}

export async function getFeaturedProjects(): Promise<Project[]> {
  const projects = await getAllProjects();
  return projects.filter((project) => project.featured);
}

export async function getProjectMetadata(): Promise<ProjectMetadata[]> {
  const projects = await getAllProjects();
  return projects.map(({ title, description, date, technologies, featured }) => ({
    title,
    description,
    date,
    technologies,
    featured,
  }));
} 