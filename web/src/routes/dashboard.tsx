import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import Header from "@/components/layout/Header";
import { fetchProfile } from "@/queries/profile";
import { LeftSide } from "@/components/home/LeftSide";
import { RightSide } from "@/components/home/RightSide";
import { useEffect } from "react";
import { useTutorial } from "@/contexts/TutorialContext";
import { dashboardTutorial } from "@/tutorials/dashboardTutorial";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();

    console.log("[DASHBOARD BEFORELOAD] isAuthenticated:", isAuthenticated);

    // Only check authentication here
    if (!isAuthenticated) {
      throw redirect({
        to: "/auth/login",
      });
    }
  },
  loader: async () => {
    const { user } = useAuthStore.getState();

    console.log("[DASHBOARD LOADER] User:", user);

    if (!user) {
      console.log("[DASHBOARD LOADER] No user found, returning null");
      return null;
    }

    return { user };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { profile, user, setProfile } = useAuthStore();
  const { startTutorial, isActive } = useTutorial();
  const navigate = useNavigate();

  // Fetch profile on mount if not exists
  useEffect(() => {
    if (user && !profile) {
      const loadProfile = async () => {
        try {
          const fetchedProfile = await fetchProfile(user.id);
          setProfile(fetchedProfile);

          if (!fetchedProfile?.has_completed_onboarding) {
            navigate({ to: "/onboarding" });
          }
        } catch (error) {
          console.error("Failed to load profile:", error);
        }
      };
      loadProfile();
    }
  }, [user, profile, setProfile, navigate]);

  // Auto-start tutorial on first visit
  useEffect(() => {
    if (!profile || isActive) return;

    const hasCompletedTutorial = profile.tutorials_completed?.dashboard;
    
    if (!hasCompletedTutorial) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        startTutorial(dashboardTutorial);
      }, 500);
    }
  }, [profile, startTutorial, isActive]);

  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <Header />

      <div className="max-w-[1440px] mx-auto px-10 py-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-[1fr_372px] gap-6">
          {/* Left Column */}
          <div data-tutorial="projects-section">
            <LeftSide />
          </div>

          {/* Right Column */}
          <div data-tutorial="right-sidebar">
            <RightSide />
          </div>
        </div>
      </div>
    </div>
  );
}
