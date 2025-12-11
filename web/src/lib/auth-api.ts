/**
 * Auth API client for interacting with backend auth endpoints
 */

import type { PersonaType, Profile, ProfileUpdateData } from "../types";
import { getAccessToken } from "./supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Make authenticated API request
 */
async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAccessToken();

  if (!token) {
    throw new Error("No authentication token available");
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: { message: "Request failed" } }));
    throw new Error(error.error?.message || "Request failed");
  }

  return response.json();
}

/**
 * Complete onboarding by setting initial persona
 */
export async function completeOnboarding(data: {
  active_persona: PersonaType;
  display_name?: string;
}): Promise<{ data: Profile }> {
  return authenticatedFetch("/api/auth/onboarding", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Switch active persona
 */
export async function switchPersona(
  active_persona: PersonaType
): Promise<{ data: Profile }> {
  return authenticatedFetch("/api/auth/persona", {
    method: "PATCH",
    body: JSON.stringify({ active_persona }),
  });
}

/**
 * Get current user's profile
 */
export async function getProfile(): Promise<{ data: Profile }> {
  return authenticatedFetch("/api/auth/profile", {
    method: "GET",
  });
}

/**
 * Update user profile
 */
export async function updateProfile(
  data: ProfileUpdateData
): Promise<{ data: Profile }> {
  return authenticatedFetch("/api/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}
