/**
 * Auth Store - Zustand
 * Centralized authentication state management
 */

import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Profile, Session, User } from "../types";
import { migrateGuestData } from "../lib/migrateGuestData";

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  migrationStatus: "idle" | "migrating" | "completed" | "error";
}

interface AuthActions {
  initialize: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  profile: null,
  isLoading: true,
  isAuthenticated: false,
  migrationStatus: "idle",

  // Initialize auth - call this once when app starts
  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      set({
        session,
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        isLoading: false,
      });

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
          isLoading: false,
        });

        if (!session?.user) {
          set({
            profile: null,
            isLoading: false,
          });
        }
      });
    } catch (error) {
      console.error("Auth initialization error:", error);
      set({ isLoading: false });
    }
  },

  // Set profile (called by useProfileQuery)
  setProfile: (profile) => {
    set({ profile, isAuthenticated: !!profile });
  },



  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      // Migrate guest data if available
      if (data.user) {
        set({ migrationStatus: "migrating" });
        try {
          const result = await migrateGuestData();
          if (result.success) {
            set({ migrationStatus: "completed" });
            console.log(`Migrated ${result.migratedRoadmaps} roadmap(s) from guest session`);
          } else {
            set({ migrationStatus: "error" });
            console.error("Migration errors:", result.errors);
          }
        } catch (migrationError) {
          set({ migrationStatus: "error" });
          console.error("Migration exception:", migrationError);
        }
      }
      
      // Auth state will be updated by onAuthStateChange listener
    } catch (error) {
      throw error;
    }
  },

  // Sign up with email and password
  signUp: async (email: string, password: string) => {
    try {
      const result = await supabase.auth.signUp({
        email,
        password,
      });
      if (result.error) throw result.error;
      
      // Migrate guest data if available
      if (result.data.user) {
        set({ migrationStatus: "migrating" });
        try {
          const migrationResult = await migrateGuestData();
          if (migrationResult.success) {
            set({ migrationStatus: "completed" });
            console.log(`Migrated ${migrationResult.migratedRoadmaps} roadmap(s) from guest session`);
          } else {
            set({ migrationStatus: "error" });
            console.error("Migration errors:", migrationResult.errors);
          }
        } catch (migrationError) {
          set({ migrationStatus: "error" });
          console.error("Migration exception:", migrationError);
        }
      }
    } catch (error) {
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Auth state will be cleared by onAuthStateChange listener
    } catch (error) {
      throw error;
    }
  },
}));

// Selectors for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useProfile = () => useAuthStore((state) => state.profile);
export const useSession = () => useAuthStore((state) => state.session);
export const useIsAuthenticated = () =>
  useAuthStore((state) => state.isAuthenticated);
export const useIsLoading = () => useAuthStore((state) => state.isLoading);
