import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/useToast";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { completeOnboarding } from "@/lib/auth-api";
import { fetchProfile } from "@/queries/profile";
import { Button } from "@/ui/button";
import BusinessCenterIcon from "@mui/icons-material/BusinessCenter";
import CodeIcon from "@mui/icons-material/Code";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import decorativePatternBottom from "/svgs/patterns/decorative-bottom-side.svg";

export const Route = createFileRoute("/onboarding")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();

    console.log('[ONBOARDING BEFORELOAD] isAuthenticated:', isAuthenticated);

    // Only check authentication here
    if (!isAuthenticated) {
      throw redirect({
        to: "/auth/login",
      });
    }
  },
  loader: async () => {
    const { user, setProfile } = useAuthStore.getState();
    
    console.log('[ONBOARDING LOADER] User:', user);
    
    if (!user) {
      console.log('[ONBOARDING LOADER] No user found, returning null');
      return null;
    }

    // Fetch and sync profile to store
    const profile = await fetchProfile(user.id);
    console.log('[ONBOARDING LOADER] Fetched profile:', profile);
    console.log('[ONBOARDING LOADER] has_completed_onboarding:', profile?.has_completed_onboarding);
    setProfile(profile);
    
    // Check if onboarding is already completed AFTER fetching profile
    if (profile?.has_completed_onboarding) {
      console.log('[ONBOARDING LOADER] Redirecting to dashboard - already completed');
      throw redirect({
        to: "/dashboard",
      });
    }
    
    return { profile };
  },
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { refetch: refetchProfile } = useProfileQuery();
  const assets = useMemo(
    () => ({
      ellipseLeft:
        "https://www.figma.com/api/mcp/asset/ebe4b2ef-391d-4d0c-b657-d8261121afd3",
      gradientHills: decorativePatternBottom,
      ellipseCenter:
        "https://www.figma.com/api/mcp/asset/4aac7a25-1ae2-4fd7-ac3e-d6a8287b18c5",
    }),
    []
  );

  const [isFreelancer, setIsFreelancer] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleContinue = async () => {
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

      await refetchProfile();
      toast.success("Onboarding completed!");
      navigate({ to: "/dashboard" });
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to complete onboarding."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Decorative accents */}
      <img
        src={assets.ellipseLeft}
        alt=""
        className="pointer-events-none absolute -left-36 top-1/2 h-[250px] w-[250px] -translate-y-1/2 opacity-60"
      />
      <img
        src={assets.gradientHills}
        alt=""
        className="absolute left-0 bottom-[-300px] w-full object-cover pointer-events-none"
      />
      <img
        src={assets.ellipseCenter}
        alt=""
        className="pointer-events-none absolute left-1/2 top-8 h-[190px] w-[190px] -translate-x-1/2"
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-start px-6 py-16 lg:px-12">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 text-center mb-10">
          <h1 className="text-5xl font-semibold text-black">
            How will you use Prodigy?
          </h1>
          <p className="text-xl text-[#020202]/80 max-w-2xl">
            Choose your primary goal to customize your dashboard. You can switch
            roles at any time.
          </p>
        </div>

        {/* Cards */}
        <div className="flex w-full max-w-4xl flex-col items-center gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full">
            {/* Hire card */}
            <div
              className={`rounded-[10px] bg-white p-10 shadow-[0_1px_8px_rgba(0,0,0,0.12),0_3px_4px_rgba(0,0,0,0.14),0_3px_3px_-2px_rgba(0,0,0,0.2)] border-4 transition-all relative flex flex-col items-center justify-between h-full ${
                isClient ? "border-green-500" : "border-transparent"
              }`}
            >
              {isClient && (
                <div className="absolute top-4 right-4">
                  <CheckCircleIcon sx={{ fontSize: 32, color: "#22c55e" }} />
                </div>
              )}
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[#ff9933]">
                  <BusinessCenterIcon sx={{ fontSize: 56, color: "white" }} />
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-2xl font-semibold text-black">
                    I want to Hire
                  </h3>
                  <p className="text-base text-[#020202]">
                    I have a vision and need a managed team to build it. Match
                    me with an expert Consultant.
                  </p>
                </div>
                <ul className="mt-2 w-60 text-left text-black text-base list-disc list-outside">
                  <li className="ms-6">Zero Management Overhead</li>
                  <li className="ms-6">AI-Driven Linear Roadmaps</li>
                  <li className="ms-6">Secured Milestone Escrow</li>
                </ul>
              </div>
              <Button
                onClick={() => setIsClient(!isClient)}
                className="cursor-pointer w-[255px] bg-[#ff9933] px-10 py-2 text-lg font-semibold text-white shadow-[0_1px_5px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.14),0_3px_1px_-2px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5 mt-4"
              >
                Hire a Vetted Team
              </Button>
            </div>

            {/* Work card */}
            <div
              className={`rounded-[10px] bg-white p-10 shadow-[0_1px_8px_rgba(0,0,0,0.12),0_3px_4px_rgba(0,0,0,0.14),0_3px_3px_-2px_rgba(0,0,0,0.2)] border-4 transition-all relative flex flex-col items-center justify-between h-full ${
                isFreelancer ? "border-green-500" : "border-transparent"
              }`}
            >
              {isFreelancer && (
                <div className="absolute top-4 right-4">
                  <CheckCircleIcon sx={{ fontSize: 32, color: "#22c55e" }} />
                </div>
              )}
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-[#ff3366]">
                  <CodeIcon sx={{ fontSize: 56, color: "white" }} />
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-2xl font-semibold text-black">
                    I want to Work
                  </h3>
                  <p className="text-base text-[#020202]">
                    Join the top 3% talent pool. Focus on coding while our
                    Architects handle the clients and requirements.
                  </p>
                </div>
                <ul className="mt-2 w-60 text-left text-black text-base list-disc list-outside">
                  <li className="ms-6">Guaranteed Payouts</li>
                  <li className="ms-6">Clear, Architected Tasks</li>
                  <li className="ms-6">No Unpaid Scope Creep</li>
                </ul>
              </div>
              <Button
                onClick={() => setIsFreelancer(!isFreelancer)}
                className="cursor-pointer w-[255px] bg-[#ff3366] px-10 py-2 text-lg font-semibold text-white shadow-[0_1px_5px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.14),0_3px_1px_-2px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5 mt-4"
              >
                Apply as a Talent
              </Button>
            </div>
          </div>

        {/* Helper Text */}
        <p className="text-white text-center text-sm">
          You can choose both options and switch between them anytime
        </p>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={isLoading || (!isFreelancer && !isClient)}
            className="w-[280px] bg-[#ff9900] px-10 py-3 text-lg font-semibold text-white shadow-[0_1px_5px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.14),0_3px_1px_-2px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
          >
            {isLoading ? "Setting up your account..." : "Continue"}
          </Button>
        </div>


      </div>
    </div>
  );
}
