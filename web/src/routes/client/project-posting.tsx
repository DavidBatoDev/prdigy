import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import Header from "@/components/layout/Header";
import {
  Upload,
  Check,
  Loader2,
  MapIcon,
  UserCheck,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { roadmapService } from "@/services/roadmap.service";
import { projectService } from "@/services/project.service";
import type { Roadmap } from "@/types/roadmap";
import {
  Step1 as SharedStep1,
  Step2 as SharedStep2,
  StepIndicator,
  type FormData as BaseFormData,
} from "@/components/project-brief";

export const Route = createFileRoute("/client/project-posting")({
  component: ProjectPostingPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      roadmapId: (search.roadmapId as string) || undefined,
      fromRoadmap: search.fromRoadmap === "true" || search.fromRoadmap === true,
    };
  },
});

// Extended FormData with Step 3 fields
interface FormData extends BaseFormData {
  // Step 3 additional fields
  roadmapFile: File | null;
  budgetRange: string;
  fundingStatus: string;
  startDate: string;
  customStartDate: string;
}

function ProjectPostingPage() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [currentStep, setCurrentStep] = useState(1);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isCreatingRoadmap, setIsCreatingRoadmap] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [referencedRoadmap, setReferencedRoadmap] = useState<Roadmap | null>(
    null,
  );
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: "",
    category: "",
    description: "",
    problemSolving: "",
    projectState: "idea",
    skills: [],
    customSkills: [],
    duration: "1-3_months",
    roadmapFile: null,
    budgetRange: "< $1,000",
    fundingStatus: "",
    startDate: "immediately",
    customStartDate: "",
  });

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  // Fetch roadmap data if roadmapId is provided
  useEffect(() => {
    const fetchRoadmapData = async () => {
      if (searchParams.roadmapId && searchParams.fromRoadmap) {
        setIsLoadingRoadmap(true);
        try {
          const roadmap = await roadmapService.getById(searchParams.roadmapId);
          setReferencedRoadmap(roadmap);

          // Pre-populate form data from roadmap project_metadata (preferred) or settings (fallback)
          const projectMetadata = roadmap.project_metadata as any;
          const settings = roadmap.settings as any;
          const source = projectMetadata || settings;

          if (source) {
            const allSkills = source.skills || [];
            const knownSkills = [
              "Graphic Design",
              "Content Writing",
              "Web Development",
              "Data Entry",
              "Digital Marketing",
              "Project Management",
              "Translation",
              "Video Editing",
              "SEO",
              "Social Media Marketing",
              "Virtual Assistant",
              "Illustration",
              "3D Modeling",
              "Voice Over",
              "Customer Service",
              "Accounting",
            ];
            const predefinedSkills = allSkills.filter((skill: string) =>
              knownSkills.includes(skill),
            );
            const customSkills = allSkills.filter(
              (skill: string) => !predefinedSkills.includes(skill),
            );

            setFormData((prev) => ({
              ...prev,
              title: source.title || roadmap.name || "",
              category: source.category || "",
              description: source.description || roadmap.description || "",
              problemSolving: source.problemSolving || "",
              projectState: source.projectState || "idea",
              skills: predefinedSkills,
              customSkills: customSkills,
              duration: source.duration || "1-3_months",
              // Pre-populate Step 3 fields if available in project_metadata
              budgetRange: source.budgetRange || prev.budgetRange,
              fundingStatus: source.fundingStatus || prev.fundingStatus,
              startDate: source.startDate || prev.startDate,
              customStartDate: source.customStartDate || prev.customStartDate,
            }));

            // Skip to Step 3 since Steps 1 & 2 are pre-filled
            setCurrentStep(3);
          }
        } catch (error) {
          console.error("Failed to fetch roadmap:", error);
        } finally {
          setIsLoadingRoadmap(false);
        }
      }
    };

    fetchRoadmapData();
  }, [searchParams.roadmapId, searchParams.fromRoadmap]);

  const nextStep = () => {
    if (currentStep < 3) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    console.log("Project submitted:", formData);

    // If coming from roadmap, create project with bidding status
    if (searchParams.fromRoadmap && referencedRoadmap) {
      setIsCreatingProject(true);
      try {
        // Create project with all form data
        const project = await projectService.create({
          title: formData.title || "Untitled Project",
          description: formData.description,
          category: formData.category,
          project_state: formData.projectState,
          skills: [...formData.skills, ...formData.customSkills],
          duration: formData.duration,
          budget_range: formData.budgetRange,
          funding_status: formData.fundingStatus,
          start_date: formData.startDate,
          custom_start_date: formData.customStartDate || undefined,
          status: "bidding",
        });

        console.log("Project created from roadmap:", project);

        // Link roadmap to project
        await roadmapService.update(referencedRoadmap.id, {
          project_id: project.id,
        });

        // Navigate to roadmap view
        navigate({
          to: "/project/$projectId/roadmap/$roadmapId",
          params: { projectId: project.id, roadmapId: referencedRoadmap.id },
        });
      } catch (error) {
        console.error("Failed to create project:", error);
        // Could add error toast here
      } finally {
        setIsCreatingProject(false);
      }
    } else {
      // Show success modal with options for normal flow
      setShowSuccessModal(true);
    }
  };

  const handleGenerateRoadmap = async () => {
    setIsCreatingRoadmap(true);
    try {
      // Create roadmap with all form data including Step 3 budget/timeline
      const roadmap = await roadmapService.create({
        name: formData.title || "Untitled Project",
        description: formData.description,
        status: "draft",
        settings: {
          category: formData.category,
          problemSolving: formData.problemSolving,
          projectState: formData.projectState,
          skills: [...formData.skills, ...formData.customSkills],
          duration: formData.duration,
          budgetRange: formData.budgetRange,
          fundingStatus: formData.fundingStatus,
          startDate: formData.startDate,
          customStartDate: formData.customStartDate,
        },
      });

      console.log("Roadmap created from project posting:", roadmap);

      // Navigate to the roadmap view
      navigate({
        to: "/project/$projectId/roadmap/$roadmapId",
        params: { projectId: "n", roadmapId: roadmap.id },
      });
    } catch (error) {
      console.error("Failed to create roadmap:", error);
      // Could add error toast here
    } finally {
      setIsCreatingRoadmap(false);
    }
  };

  const handleSubmitToConsultant = () => {
    // Future implementation - for now just show a message
    alert(
      "Consultant matching feature coming soon! Your project details have been saved.",
    );
    setShowSuccessModal(false);
    // TODO: Submit project to consultant matching system
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] relative overflow-hidden">
      <Header />

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
            fill={
              currentStep === 1
                ? "#FF9933"
                : currentStep === 2
                  ? "#e91e63"
                  : "#8b5cf6"
            }
            fillOpacity="0.3"
            animate={{
              fill:
                currentStep === 1
                  ? "#FF9933"
                  : currentStep === 2
                    ? "#e91e63"
                    : "#8b5cf6",
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
            totalSteps={3}
          />
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-2 overflow-hidden mt-[-24px]">
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
            totalSteps={3}
          />
          <div className="w-32 h-1 bg-gray-200 rounded-full mx-2 overflow-hidden mt-[-24px]">
            <motion.div
              className="h-full bg-[#e91e63]"
              initial={{ width: "0%" }}
              animate={{ width: currentStep > 2 ? "100%" : "0%" }}
              transition={{ duration: 0.5, ease: "easeInOut", delay: 0.1 }}
            />
          </div>
          <StepIndicator
            step={3}
            currentStep={currentStep}
            label="Budget & Timeline"
            totalSteps={3}
          />
        </div>

        {/* Step Content */}
        <div className="grid grid-cols-[400px_1fr] gap-12">
          {/* Left Side - Step Info */}
          <div className="relative">
            <div className="sticky top-[120px]">
              <AnimatePresence mode="wait">
                {currentStep === 1 && (
                  <motion.div
                    key="step1-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <h1 className="text-4xl font-bold text-[#333438] mb-4">
                      Step 1: Vision &<br />
                      Scope
                    </h1>
                    <p className="text-[#61636c] text-lg">
                      Tell us what you want to build. You can either answer a
                      few questions or upload an existing RFP/Brief.
                    </p>
                  </motion.div>
                )}
                {currentStep === 2 && (
                  <motion.div
                    key="step2-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <h1 className="text-4xl font-bold text-[#333438] mb-4">
                      Step 2: Skills &<br />
                      Deliverables
                    </h1>
                    <p className="text-[#61636c] text-lg">
                      Define the expertise you need and the results you expect.
                    </p>
                  </motion.div>
                )}
                {currentStep === 3 && (
                  <motion.div
                    key="step3-info"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    <h1 className="text-4xl font-bold text-[#333438] mb-4">
                      Step 3: Budget &<br />
                      Timeline
                    </h1>
                    <p className="text-[#61636c] text-lg">
                      Help us match you with Consultants who fit your financial
                      and schedule goals.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="min-h-[500px]">
            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <motion.div
                  key="step1-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <SharedStep1
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                </motion.div>
              )}
              {currentStep === 2 && (
                <motion.div
                  key="step2-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <SharedStep2
                    formData={formData}
                    updateFormData={updateFormData}
                  />
                </motion.div>
              )}
              {currentStep === 3 && (
                <motion.div
                  key="step3-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <Step3
                    formData={formData}
                    updateFormData={updateFormData}
                    referencedRoadmap={referencedRoadmap}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navigation Buttons */}
        {/* Navigation Buttons */}
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none pb-8 pt-4 bg-linear-to-t from-[#f6f7f8] via-[#f6f7f8]/80 to-transparent">
          <div className="max-w-[1440px] mx-auto px-6 flex justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 1}
              className="pointer-events-auto cursor-pointer px-8 py-3 text-[#ff9933] border border-[#ff9933] bg-white rounded-lg font-semibold hover:bg-[#fff5eb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors uppercase shadow-sm"
            >
              Back
            </button>
            {currentStep < 3 ? (
              <button
                onClick={nextStep}
                className="pointer-events-auto cursor-pointer px-8 py-3 bg-linear-to-r from-[#ff9933] to-[#ff6b35] text-white rounded-lg font-semibold hover:shadow-lg transition-all uppercase"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isCreatingProject}
                className="pointer-events-auto cursor-pointer px-8 py-3 bg-linear-to-r from-[#e91e63] to-[#ff1744] text-white rounded-lg font-semibold hover:shadow-lg transition-all uppercase flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreatingProject ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Submit Project
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSuccessModal(false)}
            />
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Project Submitted Successfully!
                </h2>
                <p className="text-gray-600">
                  What would you like to do next with your project?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Generate Roadmap Option */}
                <button
                  onClick={handleGenerateRoadmap}
                  disabled={isCreatingRoadmap}
                  className="group relative p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-xl hover:border-orange-400 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      {isCreatingRoadmap ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <MapIcon className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      Generate Roadmap
                    </h3>
                    <p className="text-sm text-gray-600">
                      Create an AI-powered project roadmap with timelines and
                      milestones
                    </p>
                  </div>
                </button>

                {/* Submit to Consultant Option */}
                <button
                  onClick={handleSubmitToConsultant}
                  className="group relative p-6 bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 rounded-xl hover:border-pink-400 hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 bg-pink-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <UserCheck className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">
                      Find Consultant
                    </h3>
                    <p className="text-sm text-gray-600">
                      Match with expert consultants to bring your project to
                      life
                    </p>
                    <span className="inline-block mt-2 px-3 py-1 bg-pink-200 text-pink-700 text-xs font-semibold rounded-full">
                      Coming Soon
                    </span>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowSuccessModal(false)}
                className="mt-6 w-full px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Modal for Pre-populating */}
      <AnimatePresence>
        {isLoadingRoadmap && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Loading Roadmap Data
                </h2>
                <p className="text-gray-600">
                  Pre-populating Steps 1 and 2 from your roadmap...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Step3({
  formData,
  updateFormData,
  referencedRoadmap,
}: {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
  referencedRoadmap: Roadmap | null;
}) {
  return (
    <div className="space-y-6">
      {/* Budget Range (repeated from Step 2) */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-4">
          Estimated Budget Range*
        </label>
        <div className="grid grid-cols-2 gap-4">
          <TileOption
            name="budgetRange"
            value="< $1,000"
            label="< $1,000"
            checked={formData.budgetRange === "< $1,000"}
            onChange={() => updateFormData({ budgetRange: "< $1,000" })}
          />
          <TileOption
            name="budgetRange"
            value="$1k - $5k"
            label="$1k - $5k"
            checked={formData.budgetRange === "$1k - $5k"}
            onChange={() => updateFormData({ budgetRange: "$1k - $5k" })}
          />
          <TileOption
            name="budgetRange"
            value="$10k - $50k"
            label="$10k - $50k"
            checked={formData.budgetRange === "$10k - $50k"}
            onChange={() => updateFormData({ budgetRange: "$10k - $50k" })}
          />
          <TileOption
            name="budgetRange"
            value="$50k+"
            label="$50k+"
            checked={formData.budgetRange === "$50k+"}
            onChange={() => updateFormData({ budgetRange: "$50k+" })}
          />
          <div className="flex items-center px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#ff9933] transition-colors col-span-2">
            <input
              type="radio"
              name="budgetRange"
              checked={formData.budgetRange === "custom"}
              onChange={() => updateFormData({ budgetRange: "custom" })}
              className="w-5 h-5 text-[#ff9933] focus:ring-[#ff9933]"
            />
            <input
              type="text"
              placeholder="Enter Custom Amount"
              className="ml-3 flex-1 px-3 py-2 border-b border-gray-200 focus:outline-none focus:border-[#ff9933]"
            />
          </div>
        </div>
      </div>

      {/* Funding Status */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-2">
          Funding Status
        </label>
        <select
          value={formData.fundingStatus}
          onChange={(e) => updateFormData({ fundingStatus: e.target.value })}
          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent shadow-sm"
        >
          <option value="">Select...</option>
          <option value="self-funded">Self-funded</option>
          <option value="seed">Seed Round</option>
          <option value="series-a">Series A</option>
          <option value="series-b">Series B+</option>
          <option value="bootstrapped">Bootstrapped</option>
        </select>
      </div>

      {/* Start Date */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-4">
          When do you want to start?*
        </label>
        <div className="grid grid-cols-3 gap-4">
          <TileOption
            name="startDate"
            value="immediately"
            label="Immediately"
            checked={formData.startDate === "immediately"}
            onChange={() => updateFormData({ startDate: "immediately" })}
          />
          <TileOption
            name="startDate"
            value="within-month"
            label="Within a month"
            checked={formData.startDate === "within-month"}
            onChange={() => updateFormData({ startDate: "within-month" })}
          />
          <div className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-[#ff9933] transition-colors">
            <input
              type="radio"
              name="startDate"
              checked={formData.startDate === "custom"}
              onChange={() => updateFormData({ startDate: "custom" })}
              className="w-5 h-5 text-[#ff9933] focus:ring-[#ff9933]"
            />
            <input
              type="date"
              value={formData.customStartDate}
              onChange={(e) => {
                updateFormData({
                  startDate: "custom",
                  customStartDate: e.target.value,
                });
              }}
              className="ml-3 flex-1 px-2 py-1 border-b border-gray-200 focus:outline-none focus:border-[#ff9933] text-sm"
              placeholder="DD/MM/YY"
            />
          </div>
        </div>
      </div>

      {/* Roadmap Upload or Reference */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-2">
          Do you have an existing Roadmap or Timeline? (Optional)
        </label>
        {referencedRoadmap ? (
          // Show roadmap reference when coming from roadmap
          <div className="border-2 border-orange-300 bg-orange-50 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MapIcon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">
                  Linked Roadmap
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  This project is based on your roadmap:{" "}
                  <span className="font-semibold">
                    "{referencedRoadmap.name}"
                  </span>
                </p>
                <a
                  href={`/project/roadmap/${referencedRoadmap.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  View Roadmap
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        ) : (
          // Show file upload when not coming from roadmap
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-[#61636c] mb-1">
              <span className="text-[#ff9933] font-semibold cursor-pointer hover:underline">
                Link
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-[#92969f]">
              SVG, PNG, JPG or GIF (max. 3MB)
            </p>
            <p className="text-xs text-[#92969f] mt-2 italic">
              Attach Project Schedule or Gantt Chart (PDF, Excel)
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function TileOption({
  name,
  value,
  label,
  description,
  checked,
  onChange,
}: {
  name: string;
  value: string;
  label: string;
  description?: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label
      className={`relative flex items-start p-4 rounded-xl border-2 transition-all cursor-pointer ${
        checked
          ? "bg-[#fff5eb] border-[#ff9933] shadow-md"
          : "bg-white border-gray-200 hover:border-gray-300 shadow-sm"
      }`}
    >
      <div className="flex items-center h-5">
        <input
          type="radio"
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          className="w-5 h-5 text-[#ff9933] focus:ring-[#ff9933]"
        />
      </div>
      <div className="ml-3 text-sm">
        <span
          className={`font-semibold block ${checked ? "text-[#333438]" : "text-[#61636c]"}`}
        >
          {label}
        </span>
        {description && (
          <span className="text-xs text-[#92969f] mt-1 block">
            {description}
          </span>
        )}
      </div>
    </label>
  );
}
