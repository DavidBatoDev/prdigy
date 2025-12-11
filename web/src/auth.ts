/**
 * Auth module exports
 * Central export point for all authentication-related functionality
 */

// Components
export { AuthInitializer } from "./components/AuthInitializer";
export { ProtectedRoute } from "./components/ProtectedRoute";

// Auth API client
export {
  completeOnboarding,
  getProfile,
  switchPersona,
  updateProfile,
} from "./lib/auth-api";

// Auth utilities
export * from "./lib/auth-utils";
// Supabase client and helpers
export {
  getAccessToken,
  getCurrentProfile,
  getCurrentUser,
  supabase,
} from "./lib/supabase";
// Zustand store and selectors
export {
  useAuthStore,
  useIsAuthenticated,
  useIsLoading,
  useProfile,
  useSession,
  useUser,
} from "./stores/authStore";
// Types
export * from "./types";
