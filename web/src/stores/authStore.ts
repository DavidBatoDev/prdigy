/**
 * Auth Store - Zustand
 * Centralized authentication state management
 */

import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { Profile, Session, User } from "../types";

interface AuthState {
	user: User | null;
	session: Session | null;
	profile: Profile | null;
	isLoading: boolean;
	isAuthenticated: boolean;
}

interface AuthActions {
	initialize: () => Promise<void>;
	loadProfile: (userId: string) => Promise<void>;
	signIn: (email: string, password: string) => Promise<void>;
	signUp: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
	refreshProfile: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
	// Initial state
	user: null,
	session: null,
	profile: null,
	isLoading: true,
	isAuthenticated: false,

	// Initialize auth - call this once when app starts
	initialize: async () => {
		try {
			const {
				data: { session },
			} = await supabase.auth.getSession();

			set({
				session,
				user: session?.user ?? null,
			});

			if (session?.user) {
				await get().loadProfile(session.user.id);
			} else {
				set({ isLoading: false });
			}

			// Listen for auth changes
			supabase.auth.onAuthStateChange(async (_event, session) => {
				set({
					session,
					user: session?.user ?? null,
				});

				if (session?.user) {
					await get().loadProfile(session.user.id);
				} else {
					set({
						profile: null,
						isLoading: false,
						isAuthenticated: false,
					});
				}
			});
		} catch (error) {
			console.error("Auth initialization error:", error);
			set({ isLoading: false });
		}
	},

	// Load user profile from database
	loadProfile: async (userId: string) => {
		try {
			const { data, error } = await supabase
				.from("profiles")
				.select("*")
				.eq("id", userId)
				.single();

			if (error) throw error;

			set({
				profile: data,
				isAuthenticated: true,
				isLoading: false,
			});
		} catch (error) {
			console.error("Load profile error:", error);
			set({
				profile: null,
				isAuthenticated: false,
				isLoading: false,
			});
		}
	},

	// Sign in with email and password
	signIn: async (email: string, password: string) => {
		set({ isLoading: true });
		try {
			const { error } = await supabase.auth.signInWithPassword({
				email,
				password,
			});
			if (error) throw error;
			// Auth state will be updated by onAuthStateChange listener
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	// Sign up with email and password
	signUp: async (email: string, password: string) => {
		set({ isLoading: true });
		try {
			const { error } = await supabase.auth.signUp({
				email,
				password,
			});
			if (error) throw error;
			// Auth state will be updated by onAuthStateChange listener
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	// Sign out
	signOut: async () => {
		set({ isLoading: true });
		try {
			const { error } = await supabase.auth.signOut();
			if (error) throw error;
			// Auth state will be cleared by onAuthStateChange listener
		} catch (error) {
			set({ isLoading: false });
			throw error;
		}
	},

	// Refresh current user's profile
	refreshProfile: async () => {
		const { user } = get();
		if (user) {
			await get().loadProfile(user.id);
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
