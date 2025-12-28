import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/useToast";
import { completeOnboarding } from "@/lib/auth-api";
import { Button } from "@/ui/button";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: () => {
    const { isAuthenticated, profile } = useAuthStore.getState();

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      throw redirect({
        to: "/auth/login",
      });
    }

    // Redirect to dashboard if onboarding already completed
    if (profile?.has_completed_onboarding) {
      throw redirect({
        to: "/dashboard",
      });
    }
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const refreshProfile = useAuthStore((state) => state.refreshProfile);

  const [isFreelancer, setIsFreelancer] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
    // Validate that at least one option is selected
    if (!isFreelancer && !isClient) {
      toast.error("Please select at least one option to continue");
      return;
    }

    setIsLoading(true);

    try {
      await completeOnboarding({
        intent: {
          freelancer: isFreelancer,
          client: isClient,
        },
      });

      // Refresh the profile to get updated onboarding status
      await refreshProfile();

      toast.success("Onboarding completed!");

      // Redirect to dashboard
      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to complete onboarding"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-3">Welcome to Prodigy</h1>
          <p className="text-lg text-muted-foreground">
            What would you like to do?
          </p>
        </div>

        {/* Intent Selection Cards */}
        <div className="space-y-4 mb-8">
          {/* Freelancer Option */}
          <button
            onClick={() => setIsFreelancer(!isFreelancer)}
            className={`w-full p-6 rounded-lg border-2 transition-all ${
              isFreelancer
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-1">
                  Work as a Freelancer
                </h3>
                <p className="text-sm text-muted-foreground">
                  Find and complete projects from clients
                </p>
              </div>
              <div
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  isFreelancer
                    ? "border-primary bg-primary"
                    : "border-border bg-background"
                }`}
              >
                {isFreelancer && (
                  <svg
                    className="w-4 h-4 text-primary-foreground"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          </button>

          {/* Client Option */}
          <button
            onClick={() => setIsClient(!isClient)}
            className={`w-full p-6 rounded-lg border-2 transition-all ${
              isClient
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-left">
                <h3 className="text-xl font-semibold mb-1">Post Projects</h3>
                <p className="text-sm text-muted-foreground">
                  Post projects and hire talented freelancers
                </p>
              </div>
              <div
                className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                  isClient
                    ? "border-primary bg-primary"
                    : "border-border bg-background"
                }`}
              >
                {isClient && (
                  <svg
                    className="w-4 h-4 text-primary-foreground"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </div>
            </div>
          </button>
        </div>

        {/* Helper Text */}
        <p className="text-xs text-muted-foreground text-center mb-8">
          You can choose both options and switch between them anytime
        </p>

        {/* Continue Button */}
        <Button
          onClick={handleContinue}
          disabled={isLoading || (!isFreelancer && !isClient)}
          className="w-full py-6 text-base"
          size="lg"
        >
          {isLoading ? "Setting up your account..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
