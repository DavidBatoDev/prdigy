import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
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
import Logo from "/prodigylogos/light/logo1.svg";

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
      ellipseCenter:
        "https://www.figma.com/api/mcp/asset/4aac7a25-1ae2-4fd7-ac3e-d6a8287b18c5",
    }),
    []
  );

  const [isFreelancer, setIsFreelancer] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(0);

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
      
      <motion.svg
        className="absolute bottom-0 left-0 w-[200%] h-[500px] opacity-40 z-0"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        initial={{ y: "100%", x: "-25%" }}
        animate={{ 
          y: "0%",
          x: ["-25%", "0%", "-25%"] 
        }}
        transition={{
          y: { duration: 1.4, ease: [0.22, 1, 0.36, 1] }, // Professional easeOut
          x: { duration: 10, repeat: Infinity, ease: "linear" } // Slower, subtle horizontal flow
        }}
      >
        <path
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill="#ff9933"
            fillOpacity="0.3"
        />
      </motion.svg>
      <img
        src={assets.ellipseCenter}
        alt=""
        className="pointer-events-none absolute left-1/2 top-8 h-[190px] w-[190px] -translate-x-1/2"
      />

      <div className="relative mx-auto flex h-screen max-w-6xl flex-col items-center justify-center px-6 lg:px-12 z-10">
        <AnimatePresence mode="wait">
        {step === 0 ? (
          <motion.div
             key="welcome"
             initial="hidden"
             animate="visible"
             exit="exit"
             variants={{
                hidden: { opacity: 0 },
                visible: { 
                   opacity: 1,
                   transition: { staggerChildren: 0.2, delayChildren: 0.3 }
                },
                exit: { 
                   opacity: 0, 
                   y: -20, 
                   transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } 
                }
             }}
             className="flex flex-col items-center justify-center h-full text-center gap-10 w-full"
          >
             <div className="space-y-6 max-w-3xl flex flex-col items-center">
                <div className="text-6xl -mx-16 md:text-7xl font-bold text-black tracking-tight flex flex-col md:flex-row items-center justify-center gap-6">
                  <motion.span 
                    className="whitespace-nowrap flex overflow-hidden"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: { 
                        opacity: 1,
                        transition: { staggerChildren: 0.08, delayChildren: 0.2 }
                      }
                    }}
                  >
                    {Array.from("Welcome to").map((char, index) => (
                      <motion.span
                        key={index}
                        variants={{
                          hidden: { opacity: 0, x: -10 },
                          visible: { opacity: 1, x: 0 }
                        }}
                        transition={{ type: "spring", damping: 12, stiffness: 200 }}
                      >
                        {char === " " ? "\u00A0" : char}
                      </motion.span>
                    ))}
                  </motion.span>
                  
                  <motion.img 
                    src={Logo} 
                    alt="Prodigy" 
                    className="h-24 md:h-28 w-auto object-contain mt-2"
                    initial={{ opacity: 0, scale: 0.8, x: -20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.8, delay: 1.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>

                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
                  className="text-2xl text-[#020202]/70 leading-relaxed"
                >
                   Your journey to seamless project management and expert collaboration starts here.
                </motion.p>
             </div>
             
             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2.2, ease: [0.22, 1, 0.36, 1] }}
             >
             <Button
                onClick={() => setStep(1)}
                className="min-w-[280px] bg-[#ff9900] px-12 py-6 text-xl font-semibold text-white rounded-full shadow-lg hover:bg-[#ff3366] transition-all hover:-translate-y-1 hover:shadow-xl"
             >
                Get Started
             </Button>
             </motion.div>
          </motion.div>
        ) : (
          <motion.div
             key="selection"
             initial={{ opacity: 0, x: 50 }}
             animate={{ opacity: 1, x: 0 }}
             transition={{ duration: 0.5 }}
             className="w-full flex flex-col items-center"
          >
            {/* Header */}
            <motion.div 
              className="flex flex-col items-center gap-4 text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h1 className="text-5xl font-semibold text-black">
                How will you use Prodigy?
              </h1>
              <p className="text-xl text-[#020202]/80 max-w-2xl">
                Choose your primary goal to customize your dashboard. You can switch
                roles at any time.
              </p>
            </motion.div>
    
            {/* Cards */}
            <div className="flex w-full max-w-4xl flex-col items-center gap-8">
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-2 gap-10 w-full"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              >
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
                    className="cursor-pointer w-[255px] bg-[#ff3366] px-10 py-2 text-lg font-semibold text-white shadow-[0_1px_5px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.14),0_3px_1px_-2px_rgba(0,0,0,0.2)] mt-4"
                  >
                    Apply as a Talent
                  </Button>
                </div>
              </motion.div>
    
            {/* Helper Text */}
            <motion.p 
              className="text-black text-center text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              You can choose both options and switch between them anytime
            </motion.p>
    
              {/* Continue Button */}
              <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              >
                 <Button
                    onClick={handleContinue}
                    disabled={isLoading || (!isFreelancer && !isClient)}
                    className="w-[280px] bg-[#ff9900] px-10 py-3 text-lg font-semibold text-white shadow-[0_1px_5px_rgba(0,0,0,0.12),0_2px_2px_rgba(0,0,0,0.14),0_3px_1px_-2px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
                 >
                    {isLoading ? "Setting up your account..." : "Continue"}
                 </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}
