export interface Milestone {
  title: string
  date: string
  description: string
  skills?: string[]
  achievements?: string[]
}

export const milestones: Milestone[] = [
  {
    title: "Started UX Design Journey",
    date: "2020",
    description: "Began my journey in UX design, focusing on user-centered design principles and digital product development.",
    skills: ["UX Research", "Wireframing", "Prototyping"],
    achievements: ["Completed first UX certification", "Launched first portfolio project"]
  },
  {
    title: "First Professional Role",
    date: "2021",
    description: "Joined my first professional UX team, working on enterprise-level applications and design systems.",
    skills: ["Design Systems", "Enterprise UX", "Team Collaboration"],
    achievements: ["Led design system implementation", "Improved user satisfaction by 40%"]
  },
  {
    title: "AI Specialization",
    date: "2022",
    description: "Expanded expertise into AI and machine learning, focusing on AI-powered UX solutions.",
    skills: ["AI/ML", "Data Visualization", "Advanced Prototyping"],
    achievements: ["Developed AI-powered design tools", "Published research on AI in UX"]
  },
  {
    title: "Current Focus",
    date: "2023-Present",
    description: "Leading innovative projects at the intersection of UX design and artificial intelligence.",
    skills: ["AI Integration", "Strategic Design", "Team Leadership"],
    achievements: ["Launched AI design platform", "Mentored junior designers"]
  }
] 