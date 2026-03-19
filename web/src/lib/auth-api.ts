/**
 * Auth API client for interacting with backend auth endpoints
 */

import axios from "axios";
import { apiClient } from "@/api";
import { supabase } from "./supabase";
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
  try {
    const response = await apiClient.patch("/api/auth/onboarding/complete", data);
    return response.data;
  } catch (error) {
    // Allow onboarding to proceed in local/dev when backend API is temporarily unavailable.
    if (axios.isAxiosError(error) && !error.response) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw error;

      const { data: existingProfile, error: existingError } = await supabase
        .from("profiles")
        .select("settings")
        .eq("id", user.id)
        .single();

      if (existingError) throw existingError;

      const existingSettings =
        existingProfile &&
        typeof existingProfile.settings === "object" &&
        existingProfile.settings !== null
          ? (existingProfile.settings as Record<string, unknown>)
          : {};

      const { data: profile, error: updateError } = await supabase
        .from("profiles")
        .update({
          has_completed_onboarding: true,
          settings: {
            ...existingSettings,
            onboarding: {
              intent: {
                freelancer: Boolean(data.intent.freelancer),
                client: Boolean(data.intent.client),
              },
              completed_at: new Date().toISOString(),
            },
          },
        })
        .eq("id", user.id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      return { data: profile as Profile };
    }

    throw error;
  }
}

/**
 * Switch active persona
 */
export async function switchPersona(
  persona: PersonaType,
): Promise<{ data: Profile }> {
  try {
    const response = await apiClient.patch("/api/auth/persona", { persona });
    return response.data;
  } catch (error) {
    // Fallback for local/dev when backend API is unavailable.
    if (axios.isAxiosError(error) && !error.response) {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw error;

      const { data: profile, error: updateError } = await supabase
        .from("profiles")
        .update({ active_persona: persona })
        .eq("id", user.id)
        .select("*")
        .single();

      if (updateError) throw updateError;

      return { data: profile as Profile };
    }

    throw error;
  }
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
  data: ProfileUpdateData,
): Promise<{ data: Profile }> {
  const response = await apiClient.patch("/api/auth/profile", data);
  return response.data;
}
