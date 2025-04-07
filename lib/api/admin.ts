'use client'

/**
 * Admin API helpers for client-side usage
 * These functions call secure API endpoints that use the admin client server-side
 * This approach avoids exposing service role keys to the client
 */

/**
 * Generic API fetcher with error handling and type safety
 */
async function fetchAPI<T>(url: string, options: RequestInit = {}): Promise<T> {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `API request failed: ${response.status} ${
          errorData.message || response.statusText
        }`
      );
    }

    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

/**
 * Get all users (admin-only)
 * Uses a secure API endpoint that runs with admin privileges
 */
export async function getUsers() {
  return fetchAPI('/api/admin/users');
}

/**
 * Delete a project (admin-only)
 */
export async function deleteProject(projectId: string) {
  return fetchAPI(`/api/admin/projects/${projectId}`, {
    method: 'DELETE',
  });
}

/**
 * Update a project (admin-only)
 */
export async function updateProject(projectId: string, data: any) {
  return fetchAPI(`/api/admin/projects/${projectId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/**
 * Create a project (admin-only)
 */
export async function createProject(data: any) {
  return fetchAPI('/api/admin/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Run database maintenance tasks (admin-only)
 */
export async function runDatabaseMaintenance(type: string) {
  return fetchAPI('/api/admin/maintenance', {
    method: 'POST',
    body: JSON.stringify({ type }),
  });
} 