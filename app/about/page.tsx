'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Download, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Testimonials } from '@/components/testimonials-grid'
import TimelineMilestone from '@/components/journey/timeline-milestone'
import { useState, useEffect, useCallback, useRef } from 'react'

// Temporary journey data (would typically come from a database)
const journeyData = [
  {
    id: 1,
    year: "2015",
    title: "First Graphic Design Commission",
    subtitle: "Logo Design & Brand Identity",
    description: "Created my first paid graphic design project, developing a logo and brand identity for a local business. This project sparked my passion for visual communication and design thinking.",
    skills: ["Adobe Illustrator", "Brand Design", "Typography", "Client Communication"],
    icon: "image",
    color: "bg-yellow-500/10",
    image: "/placeholder.svg"
  },
  {
    id: 2, 
    year: "2018",
    title: "UC Santa Cruz - Cognitive Science",
    subtitle: "B.S. with focus on AI & Human-Computer Interaction",
    description: "Graduated with a degree that combines psychology, computer science, and design. My studies in how humans interact with technology have formed the foundation of my user-centered approach to design.",
    skills: ["Cognitive Psychology", "Programming Fundamentals", "HCI Research", "Information Architecture"],
    icon: "briefcase",
    color: "bg-blue-500/10",
    image: "/placeholder.svg"
  },
  {
    id: 3,
    year: "2020",
    title: "Precision Mercedes",
    subtitle: "First Web Design Client",
    description: "Secured my first web design client, creating a comprehensive digital presence including website design, graphic elements, and motion graphics. This project marked my transition from graphic design to digital experiences, and taught me the value of client presentations and deployment workflows.",
    skills: ["Web Design", "HTML/CSS", "Motion Graphics", "Client Presentations"],
    icon: "layout",
    color: "bg-green-500/10",
    image: "/placeholder.svg"
  },
  {
    id: 4,
    year: "2021",
    title: "Off The Leash Lifestyle",
    subtitle: "E-commerce & Brand Platform",
    description: "Designed and developed a complete e-commerce platform for a lifestyle brand, integrating social media strategy with online shopping. This project expanded my skills in conversion-focused design and user journey mapping.",
    skills: ["E-commerce", "UI/UX Design", "Social Media Integration", "Brand Strategy"],
    icon: "layout",
    color: "bg-purple-500/10",
    image: "/placeholder.svg"
  },
  {
    id: 5,
    year: "2022",
    title: "Aletheia Digital Media",
    subtitle: "Agency Position",
    description: "Joined a digital agency as lead designer and developer, where I rebuilt their company website and created digital solutions for multiple clients. This role strengthened my project management skills and ability to translate business requirements into technical solutions.",
    skills: ["Team Leadership", "WordPress", "Client Management", "Project Planning"],
    icon: "briefcase",
    color: "bg-blue-500/10",
    image: "/placeholder.svg"
  },
  {
    id: 6,
    year: "2023",
    title: "Swyvvl Real Estate Platform",
    subtitle: "Full-Stack Development",
    description: "Designed and developed a comprehensive real estate platform combining elegant UI with complex functionality. This project showcased my evolution into a complete product designer with both front-end and back-end capabilities.",
    skills: ["React", "Next.js", "UI Design", "Database Architecture", "Full-Stack Development"],
    icon: "code",
    color: "bg-red-500/10",
    image: "/placeholder.svg"
  },
  {
    id: 7,
    year: "2024",
    title: "AI Integration Specialist",
    subtitle: "Next-Generation Digital Experiences",
    description: "Advanced to creating AI-enhanced applications that combine my design expertise with cutting-edge technology. These projects represent the culmination of my journey from graphic designer to full-stack developer and AI specialist.",
    skills: ["OpenAI Integration", "Vector Databases", "TypeScript", "Supabase", "Modern UI Frameworks"],
    icon: "code",
    color: "bg-indigo-500/10",
    image: "/placeholder.svg"
  }
];

export default function AboutPage() {
  const [milestones, setMilestones] = useState(journeyData);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0); // Track navigation direction for animations
  const timelineRef = useRef<HTMLDivElement>(null); // Reference to maintain height
  
  // Calculate and update container height
  useEffect(() => {
    if (timelineRef.current && milestones.length > 0) {
      const updateHeight = () => {
        const currentMilestone = document.querySelector('.timeline-milestone');
        if (currentMilestone) {
          const height = currentMilestone.getBoundingClientRect().height;
          timelineRef.current!.style.height = `${height + 32}px`; // Add some padding
        }
      };
      
      // Update after a slight delay to ensure content is rendered
      const timer = setTimeout(updateHeight, 100);
      
      // Also update on window resize
      window.addEventListener('resize', updateHeight);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', updateHeight);
      };
    }
  }, [activeIndex, milestones]);
  
  // Simulate data fetching (in a real app, this would fetch from an API/database)
  useEffect(() => {
    setIsLoading(true);
    // Simulate network delay
    const timer = setTimeout(() => {
      setMilestones(journeyData);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleTimelineClick = (index: number) => {
    // Set direction for animation
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
  }

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (activeIndex < milestones.length - 1) {
      setDirection(1);
      setActiveIndex(prev => prev + 1);
    }
  }, [activeIndex, milestones.length]);

  const handlePrevious = useCallback(() => {
    if (activeIndex > 0) {
      setDirection(-1);
      setActiveIndex(prev => prev - 1);
    }
  }, [activeIndex]);

  // Keyboard navigation for timeline
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Only handle keyboard events when timeline section is in view
    const timelineSection = document.getElementById('journey-section');
    if (!timelineSection) return;
    
    const rect = timelineSection.getBoundingClientRect();
    const isInView = rect.top < window.innerHeight && rect.bottom >= 0;
    
    if (!isInView) return;
    
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      handleNext();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      handlePrevious();
    }
  }, [handleNext, handlePrevious]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const fadeInUp = {
    hidden: { opacity: 0, y: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.1 * i, duration: 0.4, ease: 'easeOut' }
    })
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="container pt-24 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row gap-8 items-center mb-10">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <Image
                src="/jordan-headshot.jpg"
                alt="Jordan Oakes"
                width={240}
                height={240}
                className="rounded-xl shadow-lg"
                priority
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: 'easeOut' }}
              className="flex-1"
            >
              <h1 className="text-4xl font-bold mb-2">Jordan Oakes</h1>
              <h2 className="text-xl text-primary mb-3">UX Designer & AI Specialist</h2>
              
              <p className="text-muted-foreground mb-4">
                Multi-disciplinary designer and developer specializing in user-centered digital experiences, 
                bridging human needs with technological innovation through UX expertise and AI knowledge.
              </p>

              <motion.div 
                className="flex flex-wrap gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Button asChild>
                  <Link href="/contact">
                    <Mail className="mr-2 h-4 w-4" />
                    Contact Me
                  </Link>
                </Button>

                <Button variant="outline" asChild>
                  <Link href="/Jordan-Oakes-Resume.pdf" target="_blank">
                    <Download className="mr-2 h-4 w-4" />
                    Resume
                  </Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
          
          {/* Condensed Bio Content */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8"
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            custom={1}
          >
            <div className="space-y-4">
              <section>
                <h3 className="text-xl font-bold mb-2">Expertise</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>10+ years design experience (graphic → digital)</li>
                  <li>4+ years UX/UI specialization</li>
                  <li>Next.js, React, and Supabase development</li>
                  <li>AI integration & human-computer interaction</li>
                </ul>
              </section>
              
              <section>
                <h3 className="text-xl font-bold mb-2">Education</h3>
                <p className="text-sm text-muted-foreground">
                  B.S. in Cognitive Science from UC Santa Cruz, with a focus on AI & Human-Computer Interaction.
                </p>
              </section>
            </div>
            
            <div className="space-y-4">
              <section>
                <h3 className="text-xl font-bold mb-2">Technical Toolkit</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Design: Adobe Creative Suite, Figma, Webflow</li>
                  <li>Development: TypeScript, React, Next.js, Tailwind</li>
                  <li>AI/ML: OpenAI, Supabase, Vector Databases</li>
                  <li>Project: Agile methodologies, Version Control</li>
                </ul>
              </section>
              
              <section>
                <h3 className="text-xl font-bold mb-2">Philosophy</h3>
                <p className="text-sm text-muted-foreground">
                  Creating experiences that are both visually stunning and deeply functional by combining 
                  data-driven insights with creative innovation for measurable impact.
                </p>
              </section>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div 
          className="flex justify-center mt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <ChevronDown className="animate-pulse h-6 w-6 text-muted-foreground" />
        </motion.div>
      </section>

      {/* Professional Journey Section */}
      <section id="journey-section" className="bg-muted/30 py-16">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            viewport={{ once: true, margin: "-100px" }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-3">My Professional Journey</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Key milestones that have shaped my career and expertise in design and technology.
            </p>
          </motion.div>

          {isLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="animate-pulse text-muted-foreground">Loading journey...</div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              {/* Timeline navigation */}
              <motion.div 
                className="flex justify-center mb-8"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="relative h-1 bg-muted/50 w-full max-w-xl rounded-full">
                  {milestones?.map((milestone, index) => (
                    <button
                      key={index}
                      onClick={() => handleTimelineClick(index)}
                      className={`absolute top-1/2 -translate-y-1/2 h-${index === activeIndex ? '5' : '3'} w-${index === activeIndex ? '5' : '3'} rounded-full transition-all duration-300 border-2 border-background ${index === activeIndex ? 'bg-primary' : 'bg-muted hover:bg-primary/50'}`}
                      style={{ left: `${(index / Math.max(milestones.length - 1, 1)) * 100}%` }}
                      aria-label={`Go to milestone: ${milestone?.title}`}
                    />
                  ))}
                  <div 
                    className="absolute h-full bg-primary rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(activeIndex / Math.max(milestones?.length - 1, 1)) * 100}%` }}
                  />
                </div>
              </motion.div>

              {/* Current milestone content with AnimatePresence */}
              <div 
                ref={timelineRef} 
                className="relative overflow-hidden" 
                style={{ minHeight: '400px' }}
              >
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={activeIndex}
                    custom={direction}
                    initial={{ 
                      opacity: 0, 
                      x: direction * 30,
                      position: 'absolute',
                      width: '100%'
                    }}
                    animate={{ 
                      opacity: 1, 
                      x: 0,
                      position: 'relative',
                      transition: { 
                        duration: 0.4, 
                        ease: [0.25, 0.1, 0.25, 1.0], 
                        opacity: { duration: 0.25 }
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      x: direction * -30,
                      position: 'absolute',
                      transition: { 
                        duration: 0.3, 
                        ease: [0.25, 0.1, 0.25, 1.0], 
                        opacity: { duration: 0.15 }
                      }
                    }}
                    className="timeline-milestone w-full"
                  >
                    {milestones && milestones.length > 0 && (
                      <TimelineMilestone 
                        milestone={milestones[activeIndex]} 
                        onNext={handleNext}
                        onPrevious={handlePrevious}
                        hasNext={activeIndex < milestones.length - 1}
                        hasPrevious={activeIndex > 0}
                        currentIndex={activeIndex}
                        totalMilestones={milestones.length}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Year indicators */}
              <div className="flex justify-between text-sm text-muted-foreground mt-8 max-w-xl mx-auto">
                {milestones?.length > 0 && (
                  <>
                    <span>{milestones[0]?.year}</span>
                    {milestones.length > 2 && <span>{milestones[Math.floor(milestones.length / 2)]?.year}</span>}
                    <span>{milestones[milestones.length - 1]?.year}</span>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section>
        <Testimonials />
      </section>
      
      {/* Final CTA */}
      <section className="bg-primary/5 py-16">
        <div className="container">
          <motion.div 
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl font-bold mb-4">Let's Create Something Amazing</h2>
            <p className="text-muted-foreground mb-8">
              Looking for a designer and developer who can transform your ideas into engaging digital experiences?
              I'd love to hear about your project and discuss how we can work together.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/contact">Get in Touch</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/work">View My Work</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
} 