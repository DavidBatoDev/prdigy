import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import Header from "@/components/layout/Header";
import { fetchProfile } from "@/queries/profile";
import { LeftSide } from "@/components/home/LeftSide";
import { RightSide } from "@/components/home/RightSide";

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
    const { user, setProfile } = useAuthStore.getState();

    console.log("[DASHBOARD LOADER] User:", user);

    if (!user) {
      console.log("[DASHBOARD LOADER] No user found, returning null");
      return null;
    }

    // Fetch and sync profile to store
    const profile = await fetchProfile(user.id);
    console.log("[DASHBOARD LOADER] Fetched profile:", profile);
    console.log(
      "[DASHBOARD LOADER] has_completed_onboarding:",
      profile?.has_completed_onboarding
    );
    setProfile(profile);

    // Check onboarding status AFTER fetching profile
    if (!profile?.has_completed_onboarding) {
      console.log(
        "[DASHBOARD LOADER] Redirecting to onboarding - not completed"
      );
      throw redirect({
        to: "/onboarding",
      });
    }

    return { profile };
  },
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#f6f7f8]">
      <Header />

      <div className="max-w-[1440px] mx-auto px-10 py-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-[1fr_372px] gap-6">
          {/* Left Column */}
          <LeftSide />

          {/* Right Column */}
          <RightSide />
        </div>
      </div>
    </div>
  );
}
