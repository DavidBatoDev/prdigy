import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import Logo from "/prodigylogos/light/logovector.svg";
import {
  Step1,
  Step2,
  StepIndicator,
  type FormData,
  type ProjectState,
} from "@/components/project-brief";

interface ProjectBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "create" | "edit";
  formData: FormData;
  onUpdateFormData: (updates: Partial<FormData>) => void;
  currentStep: number;
  onStepChange: (step: number) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
}

// Re-export types for backward compatibility
export type { FormData, ProjectState };

export function ProjectBriefModal({
  isOpen,
  onClose,
  mode,
  formData,
  onUpdateFormData,
  currentStep,
  onStepChange,
  onSubmit,
  isSubmitting,
}: ProjectBriefModalProps) {
  const prevStep = () => {
    if (currentStep > 1) onStepChange(currentStep - 1);
  };

  const nextStep = async () => {
    if (currentStep < 2) {
      onStepChange(currentStep + 1);
    } else {
      await onSubmit();
    }
  };

  const modalTitle = mode === "create" ? "Project Brief" : "Edit Project Brief";
  const step1Description =
    mode === "create"
      ? "Tell us what you want to build. Describe your project vision so we can generate an accurate roadmap."
      : "Update your project vision and details to keep your roadmap aligned with your goals.";
  const step2Description =
    mode === "create"
      ? "What skills are needed? How long do you expect the project to take?"
      : "Update the required skills and expected duration for your project.";
  const submitButtonText =
    mode === "create" ? "Save Project Brief" : "Save Changes";
  const submittingText = mode === "create" ? "Creating..." : "Saving...";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-9999 flex items-center justify-center"
          style={{ zoom: 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-linear-to-b from-black/55 to-black/35 backdrop-blur-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative z-50 w-[min(820px,90vw)] h-[min(600px,85vh)] p-px rounded-xl bg-linear-to-r from-[#ff9933] via-[#e91e63] to-[#ff1744] shadow-[0_18px_48px_rgba(0,0,0,0.22)]"
            initial={{ scale: 0.94, y: 8, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.98, y: 8, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            role="dialog"
            aria-modal="true"
          >
            <div className="relative rounded-xl bg-[#f6f7f8]/95 backdrop-blur-xl overflow-hidden flex flex-col h-full">
              {/* Decorative blobs */}
              <motion.div
                className="pointer-events-none absolute -top-24 -left-24 w-[300px] h-[300px] bg-[#ff993326] rounded-full blur-3xl"
                animate={{ scale: [1, 1.15, 1], x: [0, 10, 0], y: [0, 6, 0] }}
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="pointer-events-none absolute -bottom-28 -right-20 w-[280px] h-[280px] bg-pink-200/50 rounded-full blur-3xl"
                animate={{ scale: [1, 1.2, 1], x: [0, -8, 0], y: [0, 10, 0] }}
                transition={{
                  duration: 7,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.3,
                }}
              />
              {/* Modal Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-white/85 backdrop-blur">
                <div className="flex items-center gap-2.5">
                  <img src={Logo} alt="Prodigy Logo" className="h-6" />
                  <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-linear-to-r from-[#333438] to-[#5b5d65]">
                    {modalTitle}
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stepper */}
              <div className="px-4 pt-4">
                <div className="flex items-center justify-center mb-4">
                  <StepIndicator
                    step={1}
                    currentStep={currentStep}
                    label="Vision & Scope"
                    totalSteps={2}
                  />
                  <div className="w-20 h-1 bg-gray-200 rounded-full mx-2 overflow-hidden mt-[-18px]">
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
              </div>

              {/* Content */}
              <div className="px-4 pb-2 overflow-y-auto no-scrollbar">
                <div className="grid grid-cols-[300px_1fr] gap-5">
                  {/* Left Info */}
                  <div className="relative">
                    <div className="sticky top-0 pt-1">
                      <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                          <motion.div
                            key="brief-step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                          >
                            <h3 className="text-lg font-semibold text-[#333438] mb-1">
                              Step 1: Vision & Scope
                            </h3>
                            <p className="text-[#61636c] text-xs leading-relaxed">
                              {step1Description}
                            </p>
                          </motion.div>
                        )}
                        {currentStep === 2 && (
                          <motion.div
                            key="brief-step2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                          >
                            <h3 className="text-lg font-semibold text-[#333438] mb-1">
                              Step 2: Skills & Duration
                            </h3>
                            <p className="text-[#61636c] text-xs leading-relaxed">
                              {step2Description}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Right Form */}
                  <div className="min-h-80 pb-2.5">
                    <AnimatePresence mode="wait">
                      {currentStep === 1 && (
                        <motion.div
                          key="brief-step1-form"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                          <Step1
                            formData={formData}
                            updateFormData={onUpdateFormData}
                            compact={true}
                          />
                        </motion.div>
                      )}
                      {currentStep === 2 && (
                        <motion.div
                          key="brief-step2-form"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                        >
                          <Step2
                            formData={formData}
                            updateFormData={onUpdateFormData}
                            compact={true}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="px-4 py-3 border-t border-gray-200 bg-white/80 backdrop-blur flex justify-between items-center">
                <button
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="px-4 py-2 text-sm text-[#ff9933] border border-[#ff9933] bg-white rounded-md font-semibold hover:bg-[#fff5eb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  Back
                </button>
                {currentStep < 2 ? (
                  <button
                    onClick={nextStep}
                    className="px-4 py-2 text-sm bg-linear-to-r from-[#ff9933] to-[#ff6b35] text-white rounded-md font-semibold shadow-sm hover:shadow-lg hover:brightness-105 transition-all"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    onClick={nextStep}
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm bg-linear-to-r from-[#e91e63] to-[#ff1744] text-white rounded-md font-semibold shadow-sm hover:shadow-lg hover:brightness-105 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {isSubmitting ? submittingText : submitButtonText}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
