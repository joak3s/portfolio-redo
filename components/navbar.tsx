"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "./theme-toggle"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import StreamingTextLogo from "./streaming-text-joakes"
import { useWindowSize } from "../hooks/use-window-size"

const navItems = [
  { name: "Home", path: "/" },
  { name: "Featured", path: "/featured" },
  { name: "Work", path: "/work" },
  { name: "About", path: "/about" },
  { name: "Contact", path: "/contact" },
]

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
  const { width } = useWindowSize() || { width: 0 }

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Close mobile menu when screen size changes to desktop
  useEffect(() => {
    if (width >= 768) {
      setMobileMenuOpen(false)
    }
  }, [width])

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (!mounted) return
    
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [mobileMenuOpen, mounted])

  const toggleMobileMenu = useCallback(() => {
    setMobileMenuOpen(prev => !prev)
  }, [])

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container flex h-16 items-center justify-between" aria-label="Main navigation">
          <Link href="/" className="flex items-center" aria-label="Go to homepage">
            <ClientOnly>
              <div className="flex items-center">
                <StreamingTextLogo textSize="text-2xl" />
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
                aria-current={pathname === item.path ? "page" : undefined}
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
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu - Placed outside the header */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop - lower z-index than navbar and doesn't cover it */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 top-16 bg-background/80 z-30 md:hidden"
              onClick={toggleMobileMenu}
              aria-hidden="true"
            />

            {/* Menu Panel - same z-index as navbar */}
            <motion.div
              id="mobile-menu"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ 
                type: "spring", 
                damping: 30, 
                stiffness: 300,
                duration: 0.3
              }}
              className="fixed top-16 right-0 bottom-0 w-3/4 max-w-sm z-40 md:hidden
                         overflow-y-auto overscroll-contain
                         bg-background border-l border-border shadow-lg"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation menu"
            >
              <nav className="flex flex-col p-4" aria-label="Mobile navigation">
                <ul className="space-y-2">
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={cn(
                          "flex items-center justify-between px-4 py-3 rounded-md transition-all",
                          "text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          pathname === item.path
                            ? "bg-accent text-accent-foreground font-semibold"
                            : "text-foreground hover:bg-muted/50 active:bg-muted"
                        )}
                        aria-current={pathname === item.path ? "page" : undefined}
                        onClick={toggleMobileMenu}
                      >
                        <span>{item.name}</span>
                        <ChevronRight className="h-4 w-4 opacity-70" />
                      </Link>
                    </li>
                  ))}
                </ul>
                
                {/* Admin section with visual separator */}
                <div className="mt-6 pt-6 border-t border-border">
                  <Link
                    href="/admin"
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-md transition-all",
                      "text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      pathname === "/admin"
                        ? "bg-accent text-accent-foreground font-semibold"
                        : "text-foreground hover:bg-muted/50 active:bg-muted"
                    )}
                    aria-current={pathname === "/admin" ? "page" : undefined}
                    onClick={toggleMobileMenu}
                  >
                    <span>Admin</span>
                    <ChevronRight className="h-4 w-4 opacity-70" />
                  </Link>
                </div>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

