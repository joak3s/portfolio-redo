/**
 * This script updates the journey_milestones in Supabase with a narrative arc structure
 * 
 * Run with: npx tsx scripts/update-journey-milestones.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Initialize Supabase client with values from the .env files
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables. Please check your .env file.')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Narrative arc structure milestones
const narrativeArcMilestones = [
  {
    title: "First Graphic Design Commission",
    year: "2015",
    description: "Created my first paid graphic design project, developing a logo and brand identity for a local business. This project sparked my passion for visual communication and design thinking.",
    skills: ["Adobe Illustrator", "Brand Design", "Typography", "Client Communication"],
    icon: "image",
    color: "bg-yellow-500/10 dark:bg-yellow-500/20",
    image: "/placeholder.svg",
    display_order: 1
  },
  {
    title: "UC Santa Cruz - Cognitive Science",
    year: "2018",
    description: "Graduated with a degree that combines psychology, computer science, and design. My studies in how humans interact with technology have formed the foundation of my user-centered approach to design.",
    skills: ["Cognitive Psychology", "Programming Fundamentals", "HCI Research", "Information Architecture"],
    icon: "briefcase",
    color: "bg-blue-500/10 dark:bg-blue-500/20",
    image: "/placeholder.svg",
    display_order: 2
  },
  {
    title: "Precision Mercedes",
    year: "2020",
    description: "Secured my first web design client, creating a comprehensive digital presence including website design, graphic elements, and motion graphics. This project marked my transition from graphic design to digital experiences, and taught me the value of client presentations and deployment workflows.",
    skills: ["Web Design", "HTML/CSS", "Motion Graphics", "Client Presentations"],
    icon: "layout",
    color: "bg-green-500/10 dark:bg-green-500/20",
    image: "/placeholder.svg",
    display_order: 3
  },
  {
    title: "Off The Leash Lifestyle",
    year: "2021",
    description: "Designed and developed a complete e-commerce platform for a lifestyle brand, integrating social media strategy with online shopping. This project expanded my skills in conversion-focused design and user journey mapping.",
    skills: ["E-commerce", "UI/UX Design", "Social Media Integration", "Brand Strategy"],
    icon: "layout",
    color: "bg-purple-500/10 dark:bg-purple-500/20",
    image: "/placeholder.svg",
    display_order: 4
  },
  {
    title: "Aletheia Digital Media",
    year: "2022",
    description: "Joined a digital agency as lead designer and developer, where I rebuilt their company website and created digital solutions for multiple clients. This role strengthened my project management skills and ability to translate business requirements into technical solutions.",
    skills: ["Team Leadership", "WordPress", "Client Management", "Project Planning"],
    icon: "briefcase",
    color: "bg-blue-500/10 dark:bg-blue-500/20",
    image: "/placeholder.svg",
    display_order: 5
  },
  {
    title: "Swyvvl Real Estate Platform",
    year: "2023",
    description: "Designed and developed a comprehensive real estate platform combining elegant UI with complex functionality. This project showcased my evolution into a complete product designer with both front-end and back-end capabilities.",
    skills: ["React", "Next.js", "UI Design", "Database Architecture", "Full-Stack Development"],
    icon: "code",
    color: "bg-red-500/10 dark:bg-red-500/20",
    image: "/placeholder.svg",
    display_order: 6
  },
  {
    title: "AI Integration Specialist",
    year: "2024",
    description: "Advanced to creating AI-enhanced applications that combine my design expertise with cutting-edge technology. These projects represent the culmination of my journey from graphic designer to full-stack developer and AI specialist.",
    skills: ["OpenAI Integration", "Vector Databases", "TypeScript", "Supabase", "Modern UI Frameworks"],
    icon: "code",
    color: "bg-indigo-500/10 dark:bg-indigo-500/20",
    image: "/placeholder.svg",
    display_order: 7
  }
]

async function updateJourneyMilestones() {
  try {
    console.log('Starting update of journey milestones...')

    // First check if there are any existing milestones
    const { data: existingMilestones, error: fetchError } = await supabase
      .from('journey_milestones')
      .select('id')
    
    if (fetchError) {
      throw new Error(`Error fetching existing milestones: ${fetchError.message}`)
    }

    if (existingMilestones && existingMilestones.length > 0) {
      console.log(`Found ${existingMilestones.length} existing milestones. Deleting them...`)
      
      // Delete existing milestones
      const { error: deleteError } = await supabase
        .from('journey_milestones')
        .delete()
        .in('id', existingMilestones.map(m => m.id))
      
      if (deleteError) {
        throw new Error(`Error deleting existing milestones: ${deleteError.message}`)
      }
      
      console.log('Successfully deleted existing milestones')
    }

    // Insert new milestones
    const { data: insertedData, error: insertError } = await supabase
      .from('journey_milestones')
      .insert(narrativeArcMilestones)
      .select()
    
    if (insertError) {
      throw new Error(`Error inserting new milestones: ${insertError.message}`)
    }

    console.log(`Successfully inserted ${insertedData?.length || 0} new milestones`)
    console.log('Journey milestones updated successfully!')
    
  } catch (error) {
    console.error('Failed to update journey milestones:', error)
    process.exit(1)
  }
}

// Run the update function
updateJourneyMilestones()
