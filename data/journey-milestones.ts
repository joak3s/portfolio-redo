export interface Milestone {
  title: string
  year: string
  description: string
  skills: string[]
  icon: string
  color: string
  image: string
}

export const milestones: Milestone[] = [
  {
    title: "First Graphic Poster (Youth)",
    year: "2010",
    description:
      "Created my first digital poster at age 13 using Photoshop, sparking my interest in visual design. This project for a school event taught me the basics of digital composition and typography.",
    skills: ["Photoshop", "Typography", "Visual Design"],
    icon: "image",
    color: "bg-blue-500/10 dark:bg-blue-500/20",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    title: "UX Redesign Project",
    year: "2015",
    description:
      "Completed my first comprehensive UX redesign for a local business website. Conducted user interviews, created wireframes, and delivered a prototype that improved customer engagement by 40%.",
    skills: ["User Research", "Wireframing", "Prototyping", "Figma"],
    icon: "layout",
    color: "bg-purple-500/10 dark:bg-purple-500/20",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    title: "Web Development Prototype",
    year: "2018",
    description:
      "Built a fully responsive web application using React and Node.js. This project helped me understand full-stack development and the importance of creating seamless user experiences across devices.",
    skills: ["React", "Node.js", "Responsive Design", "API Integration"],
    icon: "code",
    color: "bg-green-500/10 dark:bg-green-500/20",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    title: "AI Chatbot Experiment",
    year: "2021",
    description:
      "Developed an AI-powered chatbot that could understand and respond to customer inquiries. This project introduced me to machine learning concepts and natural language processing.",
    skills: ["Machine Learning", "NLP", "Python", "Conversational UI"],
    icon: "message-square",
    color: "bg-orange-500/10 dark:bg-orange-500/20",
    image: "/placeholder.svg?height=400&width=600",
  },
  {
    title: "Integrated Portfolio App",
    year: "2023",
    description:
      "Created this portfolio application using Next.js, combining all my previous skills. This project represents the culmination of my journey so far, showcasing my ability to create comprehensive digital experiences.",
    skills: ["Next.js", "TypeScript", "Tailwind CSS", "Framer Motion"],
    icon: "briefcase",
    color: "bg-pink-500/10 dark:bg-pink-500/20",
    image: "/placeholder.svg?height=400&width=600",
  },
]

