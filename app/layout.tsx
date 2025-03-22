import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Navbar from "@/components/navbar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Jordan Oakes | UX Designer & AI Specialist",
    template: "%s | Jordan Oakes"
  },
  description: "UX Designer and AI Specialist showcasing innovative projects and expertise in design and artificial intelligence.",
  keywords: ["UX Design", "AI", "Portfolio", "Jordan Oakes", "Design", "Development"],
  authors: [{ name: "Jordan Oakes" }],
  creator: "Jordan Oakes",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://jordanoakes.com",
    title: "Jordan Oakes | UX Designer & AI Specialist",
    description: "UX Designer and AI Specialist showcasing innovative projects and expertise in design and artificial intelligence.",
    siteName: "Jordan Oakes Portfolio"
  },
  twitter: {
    card: "summary_large_image",
    title: "Jordan Oakes | UX Designer & AI Specialist",
    description: "UX Designer and AI Specialist showcasing innovative projects and expertise in design and artificial intelligence.",
    creator: "@jordanoakes"
  },
  robots: {
    index: true,
    follow: true
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange={false}>
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            <main>{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'