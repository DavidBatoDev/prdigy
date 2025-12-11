/**
 * Auth utility functions
 */

import type { PersonaType, Profile } from "../types/profile.types";

/**
 * Check if user has a specific persona
 */
export function hasPersona(
  profile: Profile | null,
  persona: PersonaType
): boolean {
  return profile?.active_persona === persona;
}

/**
 * Check if user has any of the specified personas
 */
export function hasAnyPersona(
  profile: Profile | null,
  personas: PersonaType[]
): boolean {
  return profile ? personas.includes(profile.active_persona) : false;
}

/**
 * Check if user is verified consultant
 */
export function isVerifiedConsultant(profile: Profile | null): boolean {
  return profile?.is_consultant_verified === true;
}

/**
 * Check if user can switch to a specific persona
 */
export function canSwitchToPersona(
  profile: Profile | null,
  persona: PersonaType
): boolean {
  if (!profile) return false;

  // Everyone can be client or freelancer
  if (persona === "client" || persona === "freelancer") {
    return true;
  }

  // Consultant requires verification
  if (persona === "consultant") {
    return profile.is_consultant_verified;
  }

  // Admin requires existing admin status
  if (persona === "admin") {
    return profile.active_persona === "admin";
  }

  return false;
}

/**
 * Get display name or fallback to email
 */
export function getDisplayName(
  profile: Profile | null,
  email?: string
): string {
  if (profile?.display_name) {
    return profile.display_name;
  }

  if (email) {
    return email.split("@")[0];
  }

  return "User";
}

/**
 * Get avatar URL or initials
 */
export function getAvatarDisplay(profile: Profile | null): {
  type: "url" | "initials";
  value: string;
} {
  if (profile?.avatar_url) {
    return { type: "url", value: profile.avatar_url };
  }

  const name = profile?.display_name || profile?.email || "U";
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return { type: "initials", value: initials };
}

/**
 * Format persona for display
 */
export function formatPersona(persona: PersonaType): string {
  return persona.charAt(0).toUpperCase() + persona.slice(1);
}

/**
 * Get available personas for a user
 */
export function getAvailablePersonas(profile: Profile | null): PersonaType[] {
  const available: PersonaType[] = ["client", "freelancer"];

  if (profile?.is_consultant_verified) {
    available.push("consultant");
  }

  if (profile?.active_persona === "admin") {
    available.push("admin");
  }

  return available;
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get persona color for UI
 */
export function getPersonaColor(persona: PersonaType): string {
  const colors: Record<PersonaType, string> = {
    client: "blue",
    freelancer: "green",
    consultant: "purple",
    admin: "red",
  };

  return colors[persona];
}

/**
 * Get persona icon name
 */
export function getPersonaIcon(persona: PersonaType): string {
  const icons: Record<PersonaType, string> = {
    client: "briefcase",
    freelancer: "code",
    consultant: "users",
    admin: "shield",
  };

  return icons[persona];
}

/**
 * Check if profile is complete
 */
export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;

  return !!(profile.display_name && profile.active_persona && profile.email);
}

/**
 * Get profile completion percentage
 */
export function getProfileCompletion(profile: Profile | null): number {
  if (!profile) return 0;

  const fields = [
    profile.display_name,
    profile.avatar_url,
    profile.bio,
    profile.active_persona,
  ];

  const completedFields = fields.filter(Boolean).length;
  return Math.round((completedFields / fields.length) * 100);
}
