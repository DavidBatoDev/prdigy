import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import Header from "@/components/layout/Header";
import { fetchProfile } from "@/queries/profile";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();

    console.log('[DASHBOARD BEFORELOAD] isAuthenticated:', isAuthenticated);

    // Only check authentication here
    if (!isAuthenticated) {
      throw redirect({
        to: "/auth/login",
      });
    }
  },
  loader: async () => {
    const { user, setProfile } = useAuthStore.getState();
    
    console.log('[DASHBOARD LOADER] User:', user);
    
    if (!user) {
      console.log('[DASHBOARD LOADER] No user found, returning null');
      return null;
    }

    // Fetch and sync profile to store
    const profile = await fetchProfile(user.id);
    console.log('[DASHBOARD LOADER] Fetched profile:', profile);
    console.log('[DASHBOARD LOADER] has_completed_onboarding:', profile?.has_completed_onboarding);
    setProfile(profile);
    
    // Check onboarding status AFTER fetching profile
    if (!profile?.has_completed_onboarding) {
      console.log('[DASHBOARD LOADER] Redirecting to onboarding - not completed');
      throw redirect({
        to: "/onboarding",
      });
    }
    
    return { profile };
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { profile } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Dashboard</h1>
        <p className="text-muted-foreground mb-8">
          Welcome, {profile?.display_name || profile?.email}!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Placeholder cards for future features */}
          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Projects</h2>
            <p className="text-muted-foreground">Coming soon</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Contracts</h2>
            <p className="text-muted-foreground">Coming soon</p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">Earnings</h2>
            <p className="text-muted-foreground">Coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
