import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAuthCookieNames, getCookieOptions, SUPABASE_CONFIG } from "./supabase-config";

/**
 * Clears all Supabase auth cookies from the cookie store
 * Useful for sign out and troubleshooting
 */
export async function clearAuthCookies() {
  const cookieStore = cookies();
  const cookieOptions = getCookieOptions();
  const authCookies = getAuthCookieNames();
  
  try {
    // Clear each auth cookie
    for (const name of authCookies) {
      cookieStore.set(name, "", {
        ...cookieOptions,
        maxAge: 0,
        expires: new Date(0),
      });
    }
    return { success: true };
  } catch (error) {
    console.error("Error clearing auth cookies:", error);
    return { success: false, error };
  }
}

/**
 * Creates a response that clears all Supabase auth cookies
 * Useful for middleware or API routes
 */
export function createSignOutResponse(redirectUrl = "/auth/login") {
  const response = NextResponse.redirect(new URL(redirectUrl, SUPABASE_CONFIG.URL));
  const cookieOptions = getCookieOptions();
  const authCookies = getAuthCookieNames();
  
  // Clear each auth cookie in the response
  for (const name of authCookies) {
    response.cookies.set(name, "", {
      ...cookieOptions,
      maxAge: 0,
      expires: new Date(0),
    });
  }
  
  return response;
}

/**
 * Creates debug information about the current auth state
 * Useful for troubleshooting
 */
export function getAuthDebugInfo() {
  const cookieStore = cookies();
  const authCookies = getAuthCookieNames();
  
  // Get information about each auth cookie
  const cookieInfo = authCookies.map(name => {
    const cookie = cookieStore.get(name);
    return {
      name,
      exists: !!cookie,
      // Only show first few characters of value for security
      valuePreview: cookie?.value ? `${cookie.value.substring(0, 5)}...` : null,
    };
  });
  
  return {
    cookieInfo,
    environment: process.env.NODE_ENV,
    supabaseUrl: SUPABASE_CONFIG.URL,
  };
} 