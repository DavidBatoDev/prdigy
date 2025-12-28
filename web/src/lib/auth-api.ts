/**
 * Auth API client for interacting with backend auth endpoints
 */

import { useAuthStore } from "@/stores/authStore";
import type { PersonaType, Profile, ProfileUpdateData } from "../types";
import { getAccessToken } from "./supabase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Make authenticated API request
 */
async function authenticatedFetch(endpoint: string, options: RequestInit = {}) {
  console.log("Getting access token...");
  
  // Try to get token from Supabase with a timeout
  const tokenPromise = getAccessToken();
  const timeoutPromise = new Promise<null>((_, reject) => 
    setTimeout(() => reject(new Error("Token retrieval timed out")), 5000)
  );

  let token: string | null = null;
  try {
    token = await (Promise.race([tokenPromise, timeoutPromise]) as Promise<string | null>);
  } catch (error) {
    console.error("Token retrieval error:", error);
    // If it fails or times out, try checking the auth store as a fallback
    const session = useAuthStore.getState().session;
    token = session?.access_token ?? null;
  }

  console.log("Token retrieved:", !!token);

  if (!token) {
    throw new Error("No authentication token available");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    console.log("Making API request to:", `${API_BASE_URL}${endpoint}`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    console.log("API response status:", response.status);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ error: { message: "Request failed" } }));
      throw new Error(error.error?.message || "Request failed");
    }

    return response.json();
  } catch (err) {
    console.error("API error:", err);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Complete onboarding by setting user intent (freelancer/client/both)
 */
export async function completeOnboarding(data: {
  intent: {
    freelancer: boolean;
    client: boolean;
  };
}): Promise<{ data: Profile }> {
  return authenticatedFetch("/api/auth/onboarding/complete", {
    method: "PATCH",
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
