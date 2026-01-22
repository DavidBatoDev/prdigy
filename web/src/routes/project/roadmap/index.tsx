import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import Logo from "/prodigylogos/light/logovector.svg";
import {
  X,
  CornerDownLeft,
  Check,
  Pencil,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import {
  LeftSidePanel,
  type Message,
} from "@/components/roadmap/LeftSidePanel";
import { RoadmapCanvas } from "@/components/roadmap/RoadmapCanvas";
// Milestone type is now RoadmapMilestone from @/types/roadmap
import type {
  RoadmapMilestone,
  RoadmapEpic,
  RoadmapFeature,
} from "@/types/roadmap";

export const Route = createFileRoute("/project/roadmap/")({
  component: RoadmapBuilderPage,
});

type ProjectState = "idea" | "sketches" | "design" | "codebase";

interface FormData {
  // Step 1
  title: string;
  category: string;
  description: string;
  problemSolving: string;
  projectState: ProjectState;

  // Step 2
  skills: string[];
  customSkills: string[];
  duration: string;
}

function RoadmapBuilderPage() {
  // Modal state for Project Brief (Steps 1-2)
  const [isBriefOpen, setIsBriefOpen] = useState(true);
  const [briefStep, setBriefStep] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

  // Builder state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi! I'll help you build a roadmap for your project. Based on your inputs, I'll suggest milestones and timelines. Feel free to ask questions or request changes!",
      timestamp: new Date(),
    },
  ]);
  const [_milestones, setMilestones] = useState<RoadmapMilestone[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [epics, setEpics] = useState<RoadmapEpic[]>([]);
  const [roadmapMilestones, setRoadmapMilestones] = useState<
    RoadmapMilestone[]
  >([]);

  const handleSendMessage = (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    // Mock assistant response until backend wiring is added
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Got it — I will adjust the roadmap accordingly.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsGenerating(false);
    }, 1200);
  };

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (briefStep < 2) {
      setBriefStep(briefStep + 1);
    } else {
      setIsBriefOpen(false);
    }
  };

  const prevStep = () => {
    if (briefStep > 1) setBriefStep(briefStep - 1);
  };

  // Optionally auto-close modal if a title/description already exist
  useEffect(() => {
    const timer = setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I understand. Let me help you with that. I've updated the roadmap based on your request.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsGenerating(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleAddMilestone = () => {
    const newMilestone: RoadmapMilestone = {
      id: `m${Date.now()}`,
      roadmap_id: "default", // TODO: Use actual roadmap ID
      title: "New Milestone",
      target_date: new Date().toISOString(),
      status: "not_started",
      position: roadmapMilestones.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setMilestones((prev) => [...prev, newMilestone]);
  };

  const handleUpdateMilestone = (updated: RoadmapMilestone) => {
    setRoadmapMilestones((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m)),
    );
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  // Epic CRUD handlers
  const handleAddEpic = (
    _milestoneId?: string,
    epicInput?: Partial<RoadmapEpic>,
  ) => {
    const newEpic: RoadmapEpic = {
      id: `epic-${Date.now()}`,
      roadmap_id: "roadmap-main",
      title: epicInput?.title?.trim() || `New Epic`,
      description: epicInput?.description || "",
      priority: epicInput?.priority || "medium",
      status: epicInput?.status || "backlog",
      position: epics.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      progress: 0,
      features: [],
    };

    setEpics([...epics, newEpic]);
  };

  const handleUpdateEpic = (updatedEpic: RoadmapEpic) => {
    setEpics(
      epics.map((e) =>
        e.id === updatedEpic.id
          ? { ...updatedEpic, updated_at: new Date().toISOString() }
          : e,
      ),
    );
  };

  const handleDeleteEpic = (epicId: string) => {
    setEpics(epics.filter((e) => e.id !== epicId));
  };

  const handleAddFeature = (
    epicId: string,
    data: {
      title: string;
      description: string;
      status:
        | "not_started"
        | "in_progress"
        | "in_review"
        | "completed"
        | "blocked";
      is_deliverable: boolean;
    },
  ) => {
    const epic = epics.find((e) => e.id === epicId);
    if (!epic) return;

    const newFeature = {
      id: `feature-${Date.now()}`,
      roadmap_id: "roadmap-main",
      epic_id: epicId,
      title: data.title,
      description: data.description,
      status: data.status,
      position: epic.features?.length || 0,
      is_deliverable: data.is_deliverable,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setEpics(
      epics.map((e) =>
        e.id === epicId
          ? { ...e, features: [...(e.features || []), newFeature] }
          : e,
      ),
    );
  };

  const handleUpdateFeature = (feature: RoadmapFeature) => {
    setEpics((prev) =>
      prev.map((epic) =>
        epic.id === feature.epic_id
          ? {
              ...epic,
              features: (epic.features || []).map((f) =>
                f.id === feature.id
                  ? { ...feature, updated_at: new Date().toISOString() }
                  : f,
              ),
            }
          : epic,
      ),
    );
  };

  const handleDeleteFeature = (featureId: string) => {
    // Placeholder for feature deletion
    console.log("Delete feature:", featureId);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] relative overflow-hidden">
      <ProjectHeader
        projectTitle={formData.title || "Untitled Project"}
        onEditBrief={() => setIsBriefOpen(true)}
        onExport={() => {
          /* TODO: Export functionality */
        }}
      />
      {/* Local style to hide scrollbar UI while preserving scroll */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Builder Console always visible */}
      <div className="fixed top-[80px] left-0 right-0 bottom-0 flex">
        {/* Left: Chat Sidebar (collapsible) */}
        <motion.div
          id="roadmap-chat-panel"
          className="relative h-full border-r border-gray-200 bg-white"
          initial={{ width: "20%" }}
          animate={{ width: isSidebarOpen ? "20%" : "56px" }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{ minWidth: 56 }}
        >
          {isSidebarOpen ? (
            <LeftSidePanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center">
              <span className="rotate-90 text-[10px] tracking-[0.2em] text-gray-400 select-none">
                CHAT
              </span>
            </div>
          )}

          {/* Toggle button */}
          <button
            type="button"
            aria-controls="roadmap-chat-panel"
            aria-expanded={isSidebarOpen}
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50"
            title={isSidebarOpen ? "Collapse chat" : "Expand chat"}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-600" />
            )}
          </button>
        </motion.div>

        {/* Right: Roadmap Canvas */}
        <div className="flex-1">
          <RoadmapCanvas
            roadmap={{
              id: "roadmap-main",
              project_id: "project-main",
              name: formData.title || "Project Roadmap",
              description: formData.description,
              owner_id: "user-main",
              status: "active",
              start_date: new Date().toISOString(),
              end_date: new Date(
                Date.now() + 90 * 24 * 60 * 60 * 1000,
              ).toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }}
            milestones={roadmapMilestones}
            epics={epics}
            onUpdateRoadmap={() => {}}
            onAddMilestone={handleAddMilestone}
            onUpdateMilestone={handleUpdateMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onAddEpic={handleAddEpic}
            onUpdateEpic={handleUpdateEpic}
            onDeleteEpic={handleDeleteEpic}
            onAddFeature={handleAddFeature}
            onUpdateFeature={handleUpdateFeature}
            onDeleteFeature={handleDeleteFeature}
          />
        </div>
      </div>

      {/* Project Brief Modal (Steps 1-2) */}
      <AnimatePresence>
        {isBriefOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center p-4 sm:p-6 overflow-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-black/55 to-black/35 backdrop-blur-[2px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBriefOpen(false)}
            />
            <motion.div
              className="relative z-50 w-[min(960px,94vw)] max-h-[80vh] p-[1px] rounded-xl bg-gradient-to-r from-[#ff9933] via-[#e91e63] to-[#ff1744] shadow-[0_18px_48px_rgba(0,0,0,0.22)] self-center my-auto"
              initial={{ scale: 0.94, y: 8, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 8, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
            >
              <div className="relative rounded-xl bg-[#f6f7f8]/95 backdrop-blur-xl overflow-hidden flex flex-col">
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
                    <h2 className="text-lg font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#333438] to-[#5b5d65]">
                      Project Brief
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsBriefOpen(false)}
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
                      currentStep={briefStep}
                      label="Vision & Scope"
                    />
                    <div className="w-20 h-1 bg-gray-200 rounded-full mx-2 overflow-hidden mt-[-18px]">
                      <motion.div
                        className="h-full bg-gradient-to-r from-[#ff9933] to-[#e91e63]"
                        initial={{ width: "0%" }}
                        animate={{ width: briefStep > 1 ? "100%" : "0%" }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                      />
                    </div>
                    <StepIndicator
                      step={2}
                      currentStep={briefStep}
                      label="Skills & Duration"
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
                          {briefStep === 1 && (
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
                                Tell us what you want to build. Describe your
                                project vision so we can generate an accurate
                                roadmap.
                              </p>
                            </motion.div>
                          )}
                          {briefStep === 2 && (
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
                                What skills are needed? How long do you expect
                                the project to take?
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Right Form */}
                    <div className="min-h-[320px] pb-2.5">
                      <AnimatePresence mode="wait">
                        {briefStep === 1 && (
                          <motion.div
                            key="brief-step1-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                          >
                            <Step1
                              formData={formData}
                              updateFormData={updateFormData}
                            />
                          </motion.div>
                        )}
                        {briefStep === 2 && (
                          <motion.div
                            key="brief-step2-form"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                          >
                            <Step2
                              formData={formData}
                              updateFormData={updateFormData}
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
                    disabled={briefStep === 1}
                    className="px-4 py-2 text-sm text-[#ff9933] border border-[#ff9933] bg-white rounded-md font-semibold hover:bg-[#fff5eb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Back
                  </button>
                  {briefStep < 2 ? (
                    <button
                      onClick={nextStep}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-[#ff9933] to-[#ff6b35] text-white rounded-md font-semibold shadow-sm hover:shadow-lg hover:brightness-105 transition-all"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={nextStep}
                      className="px-4 py-2 text-sm bg-gradient-to-r from-[#e91e63] to-[#ff1744] text-white rounded-md font-semibold shadow-sm hover:shadow-lg hover:brightness-105 transition-all"
                    >
                      Build Roadmap
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepIndicator({
  step,
  currentStep,
  label,
}: {
  step: number;
  currentStep: number;
  label: string;
}) {
  const isActive = step === currentStep;
  const isCompleted = step < currentStep;

  let bgClass = "bg-gray-200";
  let textClass = "text-gray-400";
  let shadowClass = "";
  let labelClass = "text-gray-400";
  let glowGradient = "from-gray-300 to-gray-200";

  if (isActive || isCompleted) {
    if (step === 1) {
      bgClass = "bg-[#ff9933]";
      textClass = "text-white";
      shadowClass = isActive ? "shadow-[0_0_20px_rgba(255,153,51,0.4)]" : "";
      labelClass = isActive ? "text-[#ff9933] font-semibold" : "text-[#ff9933]";
      glowGradient = "from-[#ff9933] to-[#ffb366]";
    } else {
      bgClass = "bg-[#e91e63]";
      textClass = "text-white";
      shadowClass = isActive ? "shadow-[0_0_20px_rgba(233,30,99,0.4)]" : "";
      labelClass = isActive ? "text-[#e91e63] font-semibold" : "text-[#e91e63]";
      glowGradient = "from-[#e91e63] to-[#ff5a8a]";
    }
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* Glow ring */}
        <motion.div
          className={`absolute -inset-2 rounded-full blur-md opacity-60 bg-gradient-to-r ${glowGradient}`}
          initial={false}
          animate={{
            opacity: isActive || isCompleted ? 0.7 : 0,
            scale: isActive ? [1, 1.06, 1] : 1,
          }}
          transition={{
            duration: 1.2,
            repeat: isActive ? Infinity : 0,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className={`relative w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all duration-300 ${bgClass} ${textClass} ${shadowClass}`}
          initial={false}
          animate={{
            scale: isActive ? 1.15 : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
          }}
        >
          <motion.div
            initial={false}
            animate={{
              scale: isCompleted ? [1, 1.2, 1] : 1,
              opacity: isCompleted ? [0, 1] : 1,
            }}
            transition={{
              duration: 0.4,
              ease: "easeOut",
            }}
          >
            {isCompleted ? <Check className="w-6 h-6" /> : <span>{step}</span>}
          </motion.div>
        </motion.div>
      </div>
      <p
        className={`mt-2 text-xs transition-colors duration-300 ${labelClass}`}
      >
        {label}
      </p>
    </div>
  );
}

function Step1({
  formData,
  updateFormData,
}: {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Project Title & Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-[#333438] mb-1.5">
            Project Title*
          </label>
          <input
            type="text"
            placeholder="e.g., SaaS Dashboard for Logistics"
            value={formData.title}
            onChange={(e) => updateFormData({ title: e.target.value })}
            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent shadow-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#333438] mb-1.5">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => updateFormData({ category: e.target.value })}
            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent shadow-sm"
          >
            <option value="">Select...</option>
            <option value="web">Web Development</option>
            <option value="mobile">Mobile App</option>
            <option value="design">Design</option>
            <option value="data">Data Science</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Project Description */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-1.5">
          Project Description*
        </label>
        <p className="text-xs text-[#92969f] mb-1">
          • Describe your vision in a few sentences.
        </p>
        <textarea
          placeholder="I want to build a mobile app that helps dog walkers find clients..."
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent resize-none shadow-sm"
        />
      </div>

      {/* Problem Solving */}
      <div>
        <label className="block text-xs text-[#92969f] mb-1.5 font-medium">
          What is the main problem you are solving?
        </label>
        <input
          type="text"
          value={formData.problemSolving}
          onChange={(e) => updateFormData({ problemSolving: e.target.value })}
          className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent shadow-sm"
        />
      </div>

      {/* Current State */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-2">
          What is the current state of the project?
        </label>
        <div className="grid grid-cols-2 gap-3">
          <TileOption
            name="projectState"
            value="idea"
            label="Just an idea"
            description="I have a concept but no materials yet"
            checked={formData.projectState === "idea"}
            onChange={() => updateFormData({ projectState: "idea" })}
          />
          <TileOption
            name="projectState"
            value="design"
            label="Design / Prototype ready"
            description="I have designs but need development"
            checked={formData.projectState === "design"}
            onChange={() => updateFormData({ projectState: "design" })}
          />
          <TileOption
            name="projectState"
            value="sketches"
            label="Sketches / Wireframes"
            description="I have rough drawings or flows"
            checked={formData.projectState === "sketches"}
            onChange={() => updateFormData({ projectState: "sketches" })}
          />
          <TileOption
            name="projectState"
            value="codebase"
            label="Existing Codebase"
            description="I need to fix or rebuild an app"
            checked={formData.projectState === "codebase"}
            onChange={() => updateFormData({ projectState: "codebase" })}
          />
        </div>
      </div>
    </div>
  );
}

function Step2({
  formData,
  updateFormData,
}: {
  formData: FormData;
  updateFormData: (updates: Partial<FormData>) => void;
}) {
  const [skillInput, setSkillInput] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: skillsData } = useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("skills")
        .select("name, slug")
        .order("name");

      if (error) throw error;
      return data as { name: string; slug: string }[];
    },
  });

  const generalSkills = skillsData?.map((s) => s.name) || [
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

  const filteredSkills = generalSkills.filter(
    (skill) =>
      skill.toLowerCase().includes(skillInput.toLowerCase()) &&
      !formData.skills.includes(skill),
  );

  const addSkill = (skill: string) => {
    const existingSkill = generalSkills.find(
      (s) => s.toLowerCase() === skill.toLowerCase(),
    );

    if (existingSkill) {
      if (!formData.skills.includes(existingSkill)) {
        updateFormData({ skills: [...formData.skills, existingSkill] });
      }
    } else {
      const isDuplicateCustom = formData.customSkills.some(
        (s) => s.toLowerCase() === skill.toLowerCase(),
      );

      if (!isDuplicateCustom) {
        updateFormData({ customSkills: [...formData.customSkills, skill] });
      }
    }
    setSkillInput("");
    setShowDropdown(false);
  };

  const removeSkill = (skill: string) => {
    if (formData.skills.includes(skill)) {
      updateFormData({ skills: formData.skills.filter((s) => s !== skill) });
    }
    if (formData.customSkills.includes(skill)) {
      updateFormData({
        customSkills: formData.customSkills.filter((s) => s !== skill),
      });
    }
  };

  return (
    <div className="space-y-3">
      {/* Skills */}
      <div className="relative">
        <label className="block text-sm font-semibold text-[#333438] mb-1.5">
          What skills or tools are required?
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search skills (e.g. Graphic Design, Writing)"
            value={skillInput}
            onChange={(e) => {
              setSkillInput(e.target.value);
              setShowDropdown(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && skillInput.trim()) {
                e.preventDefault();
                addSkill(skillInput.trim());
              }
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            className="w-full px-3 py-1.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e91e63] focus:border-transparent mb-3 shadow-sm pr-10"
          />
          <div
            className={`absolute right-3 top-2 transition-colors duration-200 pointer-events-none ${
              skillInput.trim() ? "text-[#ff9933]" : "text-gray-300"
            }`}
          >
            <CornerDownLeft className="w-4 h-4" />
          </div>
          {showDropdown && skillInput && filteredSkills.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {filteredSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="w-full text-left px-3 py-1.5 hover:bg-gray-50 text-[#333438] text-sm transition-colors"
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Skills */}
        <div className="flex flex-wrap gap-1.5">
          {[...formData.skills, ...formData.customSkills].map((skill) => (
            <div
              key={skill}
              className="px-3 py-1 bg-white border border-gray-300 text-[#333438] rounded-full text-xs flex items-center gap-1.5 shadow-sm cursor-pointer hover:border-red-500 hover:text-red-500 transition-colors group"
              onClick={() => removeSkill(skill)}
            >
              {skill}
              <X className="w-3 h-3 text-gray-400 group-hover:text-red-500 transition-colors" />
            </div>
          ))}
        </div>

        {/* Popular Suggestions */}
        <div className="mt-3">
          <p className="text-[11px] text-[#92969f] mb-1.5 font-medium">
            Popular Skills
          </p>
          <div className="flex flex-wrap gap-1.5">
            {generalSkills
              .filter((skill) => !formData.skills.includes(skill))
              .slice(0, 14)
              .map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="px-2.5 py-1 bg-white border border-gray-200 text-[#61636c] rounded-full text-[11px] hover:border-[#ff9933] hover:text-[#ff9933] transition-colors"
                >
                  + {skill}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Expected Duration */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-2.5">
          Expected Duration
        </label>
        <div className="grid grid-cols-2 gap-3">
          <TileOption
            name="duration"
            value="<1_month"
            label="Less than 1 month"
            checked={formData.duration === "<1_month"}
            onChange={() => updateFormData({ duration: "<1_month" })}
          />
          <TileOption
            name="duration"
            value="1-3_months"
            label="1-3 months"
            checked={formData.duration === "1-3_months"}
            onChange={() => updateFormData({ duration: "1-3_months" })}
          />
          <TileOption
            name="duration"
            value="3-6_months"
            label="3-6 months"
            checked={formData.duration === "3-6_months"}
            onChange={() => updateFormData({ duration: "3-6_months" })}
          />
          <TileOption
            name="duration"
            value="6+_months"
            label="More than 6 months"
            checked={formData.duration === "6+_months"}
            onChange={() => updateFormData({ duration: "6+_months" })}
          />
        </div>
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
      className={`relative flex items-start p-3 rounded-lg border-2 transition-all cursor-pointer ${
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
          className="w-4 h-4 text-[#ff9933] focus:ring-[#ff9933]"
        />
      </div>
      <div className="ml-2.5 text-sm">
        <span
          className={`font-semibold block ${checked ? "text-[#333438]" : "text-[#61636c]"}`}
        >
          {label}
        </span>
        {description && (
          <span className="text-[11px] text-[#92969f] mt-0.5 block">
            {description}
          </span>
        )}
      </div>
    </label>
  );
}
