/**
 * Centralized Supabase Configuration
 * 
 * This file provides a single source of truth for Supabase configuration
 * to ensure consistency across the application.
 */

// Remote Supabase configuration - used across the application
export const SUPABASE_CONFIG = {
  // URL for the Supabase instance
  URL: "https://lgtldjzglbzlmmxphfxw.supabase.co",
  
  // Anonymous API key for public operations
  ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndGxkanpnbGJ6bG1teHBoZnh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE3MTkyNTksImV4cCI6MjA1NzI5NTI1OX0.TH_nrrp0W0MIJ7jaFZGPSe1vIYc6S7Oydl0Kw8UNe-c",
  
  // Cookie names used by Supabase Auth
  COOKIE_NAMES: {
    // Session cookie name pattern - used for cookie management
    SESSION: "sb-lgtldjzglbzlmmxphfxw-auth-token",
    
    // Refresh cookie name (if separate from session)
    REFRESH: "sb-refresh-token",
  },
  
  // Default cookie options
  COOKIE_OPTIONS: {
    // For local development with HTTP
    DEV: {
      path: "/",
      sameSite: "lax" as const,
      secure: false, // Since local dev is often not HTTPS
    },
    
    // For production with HTTPS
    PROD: {
      path: "/",
      sameSite: "lax" as const,
      secure: true, // For HTTPS
      maxAge: 60 * 60 * 24 * 7, // 1 week
    }
  }
};

// Helper function to determine which cookie options to use
export function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";
  return isProduction ? SUPABASE_CONFIG.COOKIE_OPTIONS.PROD : SUPABASE_CONFIG.COOKIE_OPTIONS.DEV;
}

// Function to clear all Supabase auth cookies (useful for troubleshooting)
export function getAuthCookieNames() {
  return [
    SUPABASE_CONFIG.COOKIE_NAMES.SESSION,
    SUPABASE_CONFIG.COOKIE_NAMES.REFRESH,
    // Other related cookies that might be set
    "sb-provider-token",
    "sb-access-token",
  ];
} 