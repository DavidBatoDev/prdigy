/**
 * Auth API client for interacting with backend auth endpoints
 */

import { apiClient } from "@/api";
import type { PersonaType, Profile, ProfileUpdateData } from "../types";

/**
 * Complete onboarding by setting user intent (freelancer/client/both)
 */
export async function completeOnboarding(data: {
  intent: {
    freelancer: boolean;
    client: boolean;
  };
}): Promise<{ data: Profile }> {
  const response = await apiClient.patch("/api/auth/onboarding/complete", data);
  return response.data;
}

/**
 * Switch active persona
 */
export async function switchPersona(
  active_persona: PersonaType
): Promise<{ data: Profile }> {
  const response = await apiClient.patch("/api/auth/persona", { active_persona });
  return response.data;
}

/**
 * Get current user's profile
 */
export async function getProfile(): Promise<{ data: Profile }> {
  const response = await apiClient.get("/api/auth/profile");
  return response.data;
}

/**
 * Update user profile
 */
export async function updateProfile(
  data: ProfileUpdateData
): Promise<{ data: Profile }> {
  const response = await apiClient.patch("/api/auth/profile", data);
  return response.data;
}
