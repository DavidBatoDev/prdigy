import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LogIn, Check, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/stores/authStore";
import { getOrCreateGuestUser } from "@/lib/guestAuth";
import { Link } from "@tanstack/react-router";
import { roadmapService } from "@/services/roadmap.service";
import {
  Step1,
  Step2,
  StepIndicator,
  type FormData,
} from "@/components/project-brief";
import Header from "@/components/layout/Header";
import Logo from "/prodigylogos/light/logovector.svg";

export const Route = createFileRoute("/project/roadmap/")({
  validateSearch: (search: Record<string, unknown>): { projectId?: string } => {
    return {
      projectId: search.projectId as string | undefined,
    };
  },
  component: RoadmapBuilderPage,
});

function RoadmapBuilderPage() {
  // Navigation
  const navigate = useNavigate();
  const { projectId } = Route.useSearch();

  // Auth state
  const authenticatedUser = useUser();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(false);

  // Initialize user (authenticated or guest)
  useEffect(() => {
    const initializeUser = async () => {
      setIsLoadingUser(true);

      if (authenticatedUser) {
        // User is authenticated
        setCurrentUserId(authenticatedUser.id);
        setIsGuest(false);
      } else {
        // Get or create guest user
        const guestId = await getOrCreateGuestUser();
        setCurrentUserId(guestId);
        setIsGuest(true);
      }

      setIsLoadingUser(false);
    };

    initializeUser();
  }, [authenticatedUser]);

  // Form state for  (Steps 1-2)
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    description: "",
    problemSolving: "",
    projectState: "idea",
    skills: [],
    customSkills: [],
    duration: "1-3_months",
  });

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (currentStep < 2) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!currentUserId && authenticatedUser) return;

    if (!authenticatedUser) {
      const guestId = await getOrCreateGuestUser();
      if (!guestId) {
        console.error("Failed to create guest user");
        return;
      }
      setCurrentUserId(guestId);
    }

    setIsCreatingRoadmap(true);
    try {
      const roadmap = await roadmapService.create({
        name: formData.title || "Untitled Roadmap",
        description: formData.description,
        project_id: projectId || undefined,
        status: "draft",
        settings: {
          category: formData.category,
          problemSolving: formData.problemSolving,
          projectState: formData.projectState,
          skills: [...formData.skills, ...formData.customSkills],
          duration: formData.duration,
        },
      });

      console.log("Roadmap created:", roadmap);

      // Navigate to the dynamic roadmap route
      navigate({
        to: "/project/$projectId/roadmap/$roadmapId",
        params: { projectId: projectId || "n", roadmapId: roadmap.id },
      });
    } catch (error) {
      console.error("Failed to create roadmap:", error);
      // Could add toast notification here
    } finally {
      setIsCreatingRoadmap(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] relative overflow-hidden">
      <Header />

      {/* Guest User Banner */}
      {isGuest && !isLoadingUser && (
        <div className="relative z-50 bg-linear-to-r from-primary/90 to-primary text-white px-4 py-2 text-sm flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-medium">🔓 Guest Mode</span>
            <span className="opacity-90">
              Your roadmap will be saved for 30 days. Sign in to save
              permanently.
            </span>
          </div>
          <Link
            to="/auth/signup"
            search={{ redirect: window.location.pathname }}
            className="flex items-center gap-2 px-4 py-1.5 bg-white text-primary rounded-md hover:bg-gray-50 transition-colors font-medium"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </Link>
        </div>
      )}

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Wave SVG at bottom */}
        <motion.svg
          className="absolute bottom-0 left-0 w-full h-[700px] opacity-30"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          animate={{
            y: [0, -30, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <motion.path
            d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,144C960,149,1056,139,1152,128C1248,117,1344,107,1392,101.3L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            fill={currentStep === 1 ? "#FF9933" : "#e91e63"}
            fillOpacity="0.3"
            animate={{
              fill: currentStep === 1 ? "#FF9933" : "#e91e63",
            }}
            transition={{
              duration: 0.5,
              ease: "easeInOut",
            }}
          />
        </motion.svg>

        {/* Gradient Blobs */}
        <motion.div
          className="absolute top-20 left-10 w-[400px] h-[400px] bg-[#ff993326] rounded-full blur-3xl opacity-40"
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-[350px] h-[350px] bg-pink-200 rounded-full blur-3xl opacity-30"
          animate={{
            scale: [1, 1.4, 1],
            x: [0, -40, 0],
            y: [0, 35, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute bottom-40 left-1/3 w-[300px] h-[300px] bg-orange-200 rounded-full blur-3xl opacity-25"
          animate={{
            scale: [1, 1.5, 1],
            x: [0, 30, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />
      </div>

      <div className="max-w-[1440px] mx-auto px-20 py-8 pb-40 relative z-10">
        {/* Progress Stepper */}
        <div className="flex items-center justify-center mb-14 relative">
          <StepIndicator
            step={1}
            currentStep={currentStep}
            label="Vision & Scope"
            totalSteps={2}
          />
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-2 overflow-hidden -mt-6">
            <motion.div
              className="h-full bg-linear-to-r from-[#ff9933] to-[#e91e63]"
              initial={{ width: "0%" }}
              animate={{ width: currentStep > 1 ? "100%" : "0%" }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
          <StepIndicator
            step={2}
            currentStep={currentStep}
            label="Skills & Duration"
            totalSteps={2}
          />
        </div>

        {/* Step Content */}
        <div className="grid grid-cols-[400px_1fr] gap-12">
          {/* Left Info Panel */}
          <div className="relative">
            <div className="sticky top-8">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <img src={Logo} alt="Prodigy" className="h-8 mb-6" />
                    <h3 className="text-2xl font-bold text-[#333438] mb-3">
                      Step 1: Vision & Scope
                    </h3>
                    <p className="text-[#61636c] leading-relaxed">
                      Tell us about your project. What do you want to build?
                      Describe your vision so we can generate an accurate
                      roadmap.
                    </p>
                  </motion.div>
                )}
                {currentStep === 2 && (
                  <motion.div
                    key="step2-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                  >
                    <img src={Logo} alt="Prodigy" className="h-8 mb-6" />
                    <h3 className="text-2xl font-bold text-[#333438] mb-3">
                      Step 2: Skills & Duration
                    </h3>
                    <p className="text-[#61636c] leading-relaxed">
                      What skills are needed? How long do you expect the project
                      to take? This helps us create a realistic timeline.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Form Content */}
          <div className="min-h-[500px] bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-gray-200/50">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <Step1 formData={formData} updateFormData={updateFormData} />
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div
                  key="step2-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                >
                  <Step2 formData={formData} updateFormData={updateFormData} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation Buttons - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-8 pt-4 bg-linear-to-t from-[#f6f7f8] via-[#f6f7f8]/80 to-transparent">
        <div className="max-w-[1440px] mx-auto px-6 flex justify-between pointer-events-auto">
          {currentStep > 1 ? (
            <button
              onClick={prevStep}
              className="px-8 py-3 bg-white text-[#61636c] font-semibold rounded-lg border-2 border-gray-200 hover:border-gray-300 transition-all uppercase tracking-wide"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}
          {currentStep < 2 ? (
            <button
              onClick={nextStep}
              className="px-8 py-3 bg-[#ff9933] text-white font-semibold rounded-lg hover:bg-[#e68829] transition-all uppercase tracking-wide shadow-lg"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isCreatingRoadmap}
              className="px-8 py-3 bg-[#e91e63] text-white font-semibold rounded-lg hover:bg-[#c2185b] transition-all uppercase tracking-wide shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isCreatingRoadmap ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Create Roadmap
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
