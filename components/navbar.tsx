"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { motion, AnimatePresence, Variants } from "framer-motion"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { name: "Home", path: "/" },
  { name: "Featured", path: "/featured" },
  { name: "Work", path: "/work" },
  { name: "Journey", path: "/journey" },
  { name: "Contact", path: "/contact" },
  { name: "Playground", path: "/playground" },
]

const letterVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: (custom: number) => ({
    opacity: 1,
    transition: {
      duration: 0.8,
      delay: custom * 0.15 + 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
}

// Client-side only wrapper component
function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  return <>{children}</>
}

export default function Navbar() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLogoVisible, setIsLogoVisible] = useState(false)
  const letters = 'OAKES'.split('')

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Set logo visibility after component mounts to trigger animation
  useEffect(() => {
    if (mounted) {
      const timer = setTimeout(() => {
        setIsLogoVisible(true)
      }, 100) // Small delay for reliability
      
      return () => clearTimeout(timer)
    }
  }, [mounted])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [mobileMenuOpen])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-baseline text-2xl font-bold">
          <ClientOnly>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: isLogoVisible ? 1 : 0 }}
              transition={{ 
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="text-primary"
            >
              J
            </motion.span>
            <div className="flex">
              {letters.map((letter, index) => (
                <motion.span
                  key={index}
                  custom={index}
                  variants={letterVariants}
                  initial="hidden"
                  animate={isLogoVisible ? "visible" : "hidden"}
                  className="inline-block text-muted-foreground"
                >
                  {letter}
                </motion.span>
              ))}
            </div>
          </ClientOnly>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={cn(
                "relative px-2 py-1 text-sm font-medium transition-colors",
                pathname === item.path ? "text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {pathname === item.path && mounted && (
                <ClientOnly>
                  <motion.span
                    layoutId="navbar-indicator"
                    className="absolute inset-0 z-[-1] rounded-md bg-accent/40"
                    transition={{ type: "spring", duration: 0.6 }}
                  />
                </ClientOnly>
              )}
              {item.name}
            </Link>
          ))}
          {mounted && <ThemeToggle />}
        </div>

        {/* Mobile Navigation Button */}
        <div className="flex items-center md:hidden">
          {mounted && <ThemeToggle />}
          <Button
            variant="ghost"
            size="icon"
            className="ml-2"
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            onClick={toggleMobileMenu}
          />
        )}
      </AnimatePresence>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed top-16 right-0 bottom-0 w-3/4 max-w-sm bg-background border-l border-border z-50 md:hidden"
          >
            <div className="flex flex-col p-6 space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "px-4 py-3 text-base font-medium rounded-md transition-colors",
                    pathname === item.path
                      ? "bg-accent/40 text-foreground"
                      : "text-muted-foreground hover:bg-accent/20 hover:text-foreground",
                  )}
                >
                  {item.name}
                </Link>
              ))}
              <div className="pt-4 mt-4 border-t border-border">
                <Link
                  href="/admin"
                  className={cn(
                    "px-4 py-3 text-base font-medium rounded-md transition-colors block",
                    pathname === "/admin"
                      ? "bg-accent/40 text-foreground"
                      : "text-muted-foreground hover:bg-accent/20 hover:text-foreground",
                  )}
                >
                  Admin
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}

