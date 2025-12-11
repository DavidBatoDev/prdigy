import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuthStore } from "../stores/authStore";
import type { Profile } from "../types/profile.types";

export const Route = createFileRoute("/profile")({
  component: RouteComponent,
});

function RouteComponent() {
  const session = useAuthStore((state) => state.session);
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoadingAuth = useAuthStore((state) => state.isLoading);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      // Wait for auth to initialize
      if (isLoadingAuth) {
        return;
      }

			if (!session?.access_token || !isAuthenticated) {
				setError("Not authenticated");
				setLoading(false);
				return;
			}

			try {
				const response = await axios.get(
					`${import.meta.env.VITE_API_URL}/api/auth/profile`,
					{
						headers: {
							Authorization: `Bearer ${session.access_token}`,
						},
					}
				);

				setProfile(response.data.data);
			} catch (err) {
				if (axios.isAxiosError(err)) {
					setError(err.response?.data?.error?.message || err.message);
				} else {
					setError(err instanceof Error ? err.message : "Failed to load profile");
				}
			} finally {
				setLoading(false);
			}
		};

		fetchProfile();
	}, [session, isAuthenticated, isLoadingAuth]);

  if (loading || isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white text-xl">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-6 py-4 rounded-lg mb-4">
            {error}
          </div>
          <p className="text-gray-400 mb-4">
            You need to be logged in to view your profile.
          </p>
          <div className="space-y-2">
            <Link
              to="/auth/signup"
              className="block w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Sign Up
            </Link>
            <Link
              to="/auth/login"
              className="block w-full bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-gray-800 rounded-lg shadow-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Profile</h1>

          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-cyan-600 flex items-center justify-center text-white text-2xl font-bold">
                  {profile?.display_name?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase() ||
                    "?"}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {profile?.display_name || "No name set"}
                </h2>
                <p className="text-gray-400">{profile?.email}</p>
              </div>
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  User ID
                </label>
                <p className="text-white font-mono text-sm bg-gray-700 px-3 py-2 rounded">
                  {profile?.id}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Active Persona
                </label>
                <p className="text-white bg-gray-700 px-3 py-2 rounded capitalize">
                  {profile?.active_persona || "Not set"}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Consultant Verified
                </label>
                <p className="text-white bg-gray-700 px-3 py-2 rounded">
                  {profile?.is_consultant_verified ? (
                    <span className="text-green-500">✓ Verified</span>
                  ) : (
                    <span className="text-gray-400">Not verified</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Member Since
                </label>
                <p className="text-white bg-gray-700 px-3 py-2 rounded">
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString()
                    : "Unknown"}
                </p>
              </div>
            </div>

            {/* Bio Section */}
            {profile?.bio && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Bio
                </label>
                <p className="text-white bg-gray-700 px-3 py-2 rounded">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* Debug: Raw Profile Data */}
            <details className="mt-6">
              <summary className="text-gray-400 cursor-pointer hover:text-white">
                View Raw Data (Debug)
              </summary>
              <pre className="mt-2 bg-gray-700 text-gray-300 p-4 rounded overflow-x-auto text-sm">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
