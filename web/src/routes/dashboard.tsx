import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    const { isAuthenticated, profile } = useAuthStore.getState();

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      throw redirect({
        to: "/auth/login",
      });
    }

    // Redirect to onboarding if not completed
    if (!profile?.has_completed_onboarding) {
      throw redirect({
        to: "/onboarding",
      });
    }
  },
  component: DashboardPage,
});

function DashboardPage() {
  const { profile } = useAuthStore();

  return (
    <div className="min-h-screen bg-background">
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
