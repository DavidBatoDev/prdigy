/**
 * Profile Types
 * Types related to user profiles
 */

// Persona enum
export type PersonaType = "client" | "freelancer" | "consultant" | "admin";

// Profile interface
export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  is_consultant_verified: boolean;
  active_persona: PersonaType;
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// Profile insert type (for creating new profiles)
export interface ProfileInsert {
  id: string;
  email: string;
  display_name?: string | null;
  avatar_url?: string | null;
  is_consultant_verified?: boolean;
  active_persona?: PersonaType;
  bio?: string | null;
}

// Profile update type (for updating existing profiles)
export interface ProfileUpdate {
  email?: string;
  display_name?: string | null;
  avatar_url?: string | null;
  is_consultant_verified?: boolean;
  active_persona?: PersonaType;
  bio?: string | null;
}
