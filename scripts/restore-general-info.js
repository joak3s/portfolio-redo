#!/usr/bin/env node

/**
 * Script to restore the original general_info records
 * This script removes all the granular records and restores the original content
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(rootDir, '.env.local') });

// Verify environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  process.exit(1);
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// The original 24 general_info records
const originalRecords = [
  {
    title: "Industry Experience",
    category: "Experience",
    content: "Jordan has worked across multiple industries including e-commerce, healthcare, education, and SaaS platforms. This diverse experience allows him to bring versatile approaches to each new project and understand unique industry requirements.",
    keywords: ["industries", "e-commerce", "healthcare", "education", "SaaS", "versatility", "industry", "experience", "jordan", "worked", "across", "multiple", "including", "e-commerce,", "healthcare,", "education,", "saas"],
    priority: "medium"
  },
  {
    title: "Accessibility Commitment",
    category: "Values",
    content: "Jordan prioritizes accessibility in all his work, ensuring digital products are usable by everyone, regardless of abilities. He builds with WCAG guidelines in mind and tests regularly with assistive technologies to ensure inclusive experiences.",
    keywords: ["accessibility", "WCAG", "inclusive", "assistive technology", "digital inclusion", "accessible", "products", "abilities", "prioritizes", "work", "digital", "usable", "everyone", "regardless"],
    priority: "high"
  },
  {
    title: "Education Background",
    category: "Education",
    content: "Jordan holds a B.S. in Cognitive Science from UC Santa Cruz, with a specialization in Human-Computer Interaction. This interdisciplinary background combines psychology, computer science, linguistics, and neuroscience—providing a scientific foundation for his design approach.",
    keywords: ["education", "cognitive science", "UCSC", "human-computer interaction", "HCI", "psychology", "computer science", "linguistics", "neuroscience", "interdisciplinary", "background", "scientific", "foundation", "design approach"],
    priority: "medium"
  },
  {
    title: "JavaScript Expertise",
    category: "Skills",
    content: "Jordan is skilled in modern JavaScript development, leveraging frameworks like React and Next.js. He writes clean, maintainable code with TypeScript and implements state management solutions tailored to project needs.",
    keywords: ["javascript", "react", "nextjs", "typescript", "state management", "frameworks", "modern", "development", "clean code", "maintainable"],
    priority: "high"
  },
  {
    title: "Supabase & Backend Skills",
    category: "Skills",
    content: "Jordan integrates Supabase for authentication, database, and storage solutions. He designs efficient data models and implements row-level security policies for protecting sensitive information while maintaining high performance.",
    keywords: ["supabase", "backend", "authentication", "database", "storage", "data models", "row-level security", "rls", "postgres", "performance", "security"],
    priority: "high"
  },
  {
    title: "Project Workflow",
    category: "Methodology",
    content: "Jordan employs a collaborative iterative workflow, beginning with user research and ending with usability testing. He values regular feedback cycles and adapts quickly based on user insights to ensure the final product meets real-world needs.",
    keywords: ["workflow", "process", "user research", "usability testing", "iterative", "collaboration", "feedback", "adaptation", "methodology", "product development"],
    priority: "medium"
  },
  {
    title: "AI Vision",
    category: "Vision",
    content: "Jordan believes AI will transform UX by enabling more personalized, intuitive interfaces. He sees potential in using AI to reduce cognitive load while still maintaining human control and ethical considerations in design decisions.",
    keywords: ["ai", "artificial intelligence", "vision", "future", "ux", "personalization", "intuitive interfaces", "cognitive load", "ethics", "design decisions"],
    priority: "medium"
  },
  {
    title: "AI in Healthcare",
    category: "Vision",
    content: "Jordan envisions AI revolutionizing healthcare interfaces by making complex medical information more accessible to patients. He's particularly interested in how AI can bridge knowledge gaps while maintaining the essential human connection in care.",
    keywords: ["ai", "healthcare", "medical interfaces", "patient experience", "medical information", "accessibility", "human connection", "technology", "medicine"],
    priority: "low"
  },
  {
    title: "Self-Driving Future",
    category: "Vision",
    content: "Jordan is fascinated by the design challenges in autonomous vehicle interfaces. He believes successful adoption will depend on interfaces that build trust, provide appropriate situational awareness, and smoothly transition between AI and human control.",
    keywords: ["autonomous vehicles", "self-driving", "user interfaces", "trust", "situational awareness", "control transition", "ai", "human factors", "transportation"],
    priority: "low"
  },
  {
    title: "AI Wearables",
    category: "Vision",
    content: "Jordan sees potential in AI-powered wearables that seamlessly integrate into daily life. He's interested in designing interfaces that provide value without demanding constant attention, enhancing human capabilities without creating dependence.",
    keywords: ["wearables", "ai", "daily life", "seamless", "integration", "attention", "human enhancement", "technology dependence", "ambient computing"],
    priority: "low"
  },
  {
    title: "AI in Defense",
    category: "Vision",
    content: "Jordan believes responsible AI application in defense requires exceptional interface design. Systems must maintain human moral judgment in decision loops while providing rapid situational awareness and preventing cognitive overload during critical situations.",
    keywords: ["defense", "ai", "moral judgment", "human in the loop", "situational awareness", "cognitive load", "critical decisions", "ethics", "responsibility"],
    priority: "low"
  },
  {
    title: "Professional Snapshot",
    category: "Background",
    content: "Jordan Oakes is a UX designer with over four years of professional experience, blending his B.S. in Cognitive Science from UCSC with practical industry knowledge. His multidisciplinary approach combines cognitive psychology principles with practical design solutions.",
    keywords: ["experience", "cognitive science", "UCSC", "design", "career", "professional", "snapshot", "jordan", "oakes", "designer", "with", "over", "four", "years", "experience,", "blending"],
    priority: "high"
  },
  {
    title: "Coding Start",
    category: "Journey",
    content: "Jordan's journey into development began with front-end web technologies while studying cognitive science. This combination naturally led him to user interface design, where he found his passion for creating experiences that align with human cognitive patterns.",
    keywords: ["coding", "journey", "beginning", "front-end", "cognitive science", "user interface", "passion", "experiences", "cognitive patterns", "development"],
    priority: "medium"
  },
  {
    title: "Career Ambition",
    category: "Career Vision",
    content: "Jordan aims to shape digital experiences that feel intuitive and enhance human capabilities. His long-term vision is to lead design teams that create products recognized for both their usability excellence and technical innovation.",
    keywords: ["career", "ambition", "vision", "goals", "digital experiences", "intuitive", "human capabilities", "leadership", "usability", "innovation"],
    priority: "medium"
  },
  {
    title: "Rugby",
    category: "Personal Interests",
    content: "Outside of design and development, Jordan is passionate about rugby. The sport's emphasis on teamwork, strategy, and adaptation has influenced his collaborative approach to product development and problem-solving.",
    keywords: ["rugby", "sports", "personal", "interests", "teamwork", "strategy", "adaptation", "collaboration", "problem-solving", "outside work"],
    priority: "low"
  },
  {
    title: "Background Origin",
    category: "Background",
    content: "Jordan's interest in design and technology began during his childhood in California's Bay Area. Growing up surrounded by technology innovation, he became fascinated with how interfaces could either frustrate or delight users, sparking his passion for user-centered design.",
    keywords: ["origin", "background", "childhood", "bay area", "california", "technology", "interfaces", "user experience", "passion", "design"],
    priority: "medium"
  },
  {
    title: "UX/UI Mastery",
    category: "Skills",
    content: "Jordan specializes in creating user interfaces that balance aesthetics with functionality. He's skilled in wireframing, prototyping, and visual design, using tools like Figma and Adobe Creative Suite to transform concepts into polished interfaces.",
    keywords: ["ux", "ui", "user experience", "user interface", "design", "wireframing", "prototyping", "visual design", "figma", "adobe", "interfaces"],
    priority: "high"
  },
  {
    title: "User-Centered Design Approach",
    category: "Background",
    content: "Jordan's approach to design is deeply rooted in understanding user needs, motivations, and pain points. He conducts thorough research before beginning the design process, ensuring that solutions address real problems rather than assumed ones.",
    keywords: ["user-centered", "design approach", "user needs", "research", "motivations", "pain points", "solutions", "real problems", "process", "methodology"],
    priority: "high"
  },
  {
    title: "Design Philosophy",
    category: "Philosophy",
    content: "Jordan believes that great design is invisible—it should feel so natural that users don't notice the interface, only the seamless experience. He strives for simplicity without sacrificing functionality, creating products that are accessible to everyone.",
    keywords: ["design philosophy", "invisible design", "natural", "seamless", "experience", "simplicity", "functionality", "accessibility", "products", "beliefs"],
    priority: "high"
  },
  {
    title: "Academic Roots",
    category: "Education",
    content: "Jordan's academic foundation in cognitive science provides him with unique insights into how people process information, make decisions, and interact with technology. This scientific background informs his evidence-based approach to design problems.",
    keywords: ["academic", "cognitive science", "information processing", "decision making", "technology interaction", "scientific", "evidence-based", "design problems", "background", "education"],
    priority: "medium"
  },
  {
    title: "Web Dev Expertise",
    category: "Skills",
    content: "Jordan brings strong web development skills to his design practice, with expertise in HTML, CSS, and JavaScript. This technical knowledge allows him to collaborate effectively with development teams and create designs that account for technical constraints.",
    keywords: ["web development", "html", "css", "javascript", "technical", "collaboration", "development teams", "constraints", "design practice", "expertise"],
    priority: "high"
  },
  {
    title: "AI Integration",
    category: "Skills",
    content: "Jordan has experience integrating AI capabilities into user interfaces, making complex technology accessible through thoughtful design. He's skilled at creating experiences that leverage AI while maintaining transparency and user control.",
    keywords: ["ai", "artificial intelligence", "integration", "user interfaces", "complex technology", "accessibility", "thoughtful design", "transparency", "user control", "experiences"],
    priority: "high"
  },
  {
    title: "Toolkit",
    category: "Skills",
    content: "Jordan's technical toolkit includes Figma, Adobe Creative Suite, React, Next.js, TypeScript, Tailwind CSS, and Supabase. He continuously expands his skills, recently adding Framer Motion for animations and OpenAI integrations to his repertoire.",
    keywords: ["toolkit", "technical skills", "figma", "adobe", "react", "next.js", "typescript", "tailwind", "supabase", "framer motion", "openai", "animations"],
    priority: "high"
  },
  {
    title: "Why Jordan?",
    category: "Career",
    content: "Clients and colleagues choose to work with Jordan for his unique combination of design sensibility, technical knowledge, and cognitive science background. He brings both empathy and analytical thinking to every project, resulting in solutions that are both human-centered and technically sound.",
    keywords: ["value proposition", "unique selling point", "design sensibility", "technical knowledge", "cognitive science", "empathy", "analytical thinking", "human-centered", "technically sound", "solutions"],
    priority: "high"
  }
];

async function main() {
  try {
    console.log('Starting restoration of original general_info records...');
    
    // First, check how many records currently exist
    const { data: currentRecords, error: countError } = await supabase
      .from('general_info')
      .select('*');
      
    if (countError) {
      console.error('Error counting current records:', countError);
      process.exit(1);
    }
    
    console.log(`Found ${currentRecords.length} current records. Will restore to ${originalRecords.length} original records.`);
    
    // Delete all current records
    console.log('Deleting all current records...');
    const { error: deleteError } = await supabase
      .from('general_info')
      .delete()
      .filter('id', 'neq', '00000000-0000-0000-0000-000000000000');
      
    if (deleteError) {
      console.error('Error deleting current records:', deleteError);
      process.exit(1);
    }
    
    console.log('Successfully deleted all current records.');
    
    // Insert the original records
    console.log('Inserting original records...');
    const { data: insertedData, error: insertError } = await supabase
      .from('general_info')
      .insert(originalRecords)
      .select();
      
    if (insertError) {
      console.error('Error inserting original records:', insertError);
      process.exit(1);
    }
    
    console.log(`Successfully restored ${insertedData.length} original records.`);
    
    // Verify the restoration
    const { data: verifyRecords, error: verifyError } = await supabase
      .from('general_info')
      .select('*');
      
    if (verifyError) {
      console.error('Error verifying restoration:', verifyError);
      process.exit(1);
    }
    
    console.log(`Verification complete. General_info table now has ${verifyRecords.length} records.`);
    console.log('Restoration successfully completed!');
    
  } catch (error) {
    console.error('Error in restoration process:', error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 