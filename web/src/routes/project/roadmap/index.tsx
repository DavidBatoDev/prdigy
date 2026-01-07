import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ProjectHeader } from "@/components/project/ProjectHeader";
import Logo from "/prodigylogos/light/logovector.svg";
import {
  Upload,
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
import type { Milestone } from "@/components/roadmap/MilestoneCard";

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
  roadmapFile: File | null;
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
    roadmapFile: null,
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
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: "m1",
      title: "Project Setup & Planning",
      duration: "1 week",
      deliverables: [
        "Requirements document",
        "Tech stack selection",
        "Project timeline",
      ],
      status: "pending",
    },
    {
      id: "m2",
      title: "Design Phase",
      duration: "2 weeks",
      deliverables: ["Wireframes", "UI mockups", "Design system"],
      status: "pending",
    },
    {
      id: "m3",
      title: "Development Sprint 1",
      duration: "3 weeks",
      deliverables: ["Core features", "Database setup", "API endpoints"],
      status: "pending",
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);

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
    const hasBasics =
      (formData.title?.trim()?.length ?? 0) > 0 &&
      (formData.description?.trim()?.length ?? 0) > 0;
    if (hasBasics) setIsBriefOpen(false);
  }, []);

  const handleSendMessage = (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Simulate AI response
    setIsGenerating(true);
    setTimeout(() => {
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
  };

  const handleAddMilestone = () => {
    const newMilestone: Milestone = {
      id: `m${Date.now()}`,
      title: "New Milestone",
      duration: "1 week",
      deliverables: [],
      status: "pending",
    };
    setMilestones((prev) => [...prev, newMilestone]);
  };

  const handleUpdateMilestone = (updated: Milestone) => {
    setMilestones((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m))
    );
  };

  const handleDeleteMilestone = (id: string) => {
    setMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleReorderMilestones = (reordered: Milestone[]) => {
    setMilestones(reordered);
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
          initial={{ width: "40%" }}
          animate={{ width: isSidebarOpen ? "40%" : "56px" }}
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
            milestones={milestones}
            onReorder={handleReorderMilestones}
            onUpdateMilestone={handleUpdateMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onAddMilestone={handleAddMilestone}
            projectTitle={formData.title || "Untitled Project"}
            estimatedTimeline={formData.duration.replace("_", " ")}
          />
        </div>
      </div>

      {/* Edit Project Brief trigger */}
      <button
        onClick={() => setIsBriefOpen(true)}
        className="fixed top-[92px] right-6 z-30 px-4 py-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:shadow-md text-[#333438] flex items-center gap-2"
      >
        <Pencil className="w-4 h-4" /> Edit Project Brief
      </button>

      {/* Project Brief Modal (Steps 1-2) */}
      <AnimatePresence>
        {isBriefOpen && (
          <motion.div
            className="fixed inset-0 z-40 flex items-center justify-center"
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
              className="relative z-50 w-[min(1100px,92vw)] max-h-[84vh] p-[1px] rounded-2xl bg-gradient-to-r from-[#ff9933] via-[#e91e63] to-[#ff1744] shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
              initial={{ scale: 0.94, y: 8, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.98, y: 8, opacity: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
            >
              <div className="relative rounded-2xl bg-[#f6f7f8]/95 backdrop-blur-xl overflow-hidden flex flex-col">
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
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white/80 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <img src={Logo} alt="Prodigy Logo" className="h-6" />
                    <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-[#333438] to-[#5b5d65]">
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
                <div className="px-6 pt-5">
                  <div className="flex items-center justify-center mb-6">
                    <StepIndicator
                      step={1}
                      currentStep={briefStep}
                      label="Vision & Scope"
                    />
                    <div className="w-24 h-1 bg-gray-200 rounded-full mx-2 overflow-hidden mt-[-24px]">
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
                <div className="px-6 pb-2 overflow-y-auto no-scrollbar">
                  <div className="grid grid-cols-[360px_1fr] gap-8">
                    {/* Left Info */}
                    <div className="relative">
                      <div className="sticky top-0 pt-2">
                        <AnimatePresence mode="wait">
                          {briefStep === 1 && (
                            <motion.div
                              key="brief-step1"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              transition={{ duration: 0.25, ease: "easeOut" }}
                            >
                              <h3 className="text-2xl font-bold text-[#333438] mb-2">
                                Step 1: Vision & Scope
                              </h3>
                              <p className="text-[#61636c]">
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
                              <h3 className="text-2xl font-bold text-[#333438] mb-2">
                                Step 2: Skills & Duration
                              </h3>
                              <p className="text-[#61636c]">
                                What skills are needed? How long do you expect
                                the project to take?
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Right Form */}
                    <div className="min-h-[420px] pb-4">
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
                <div className="px-6 py-4 border-t border-gray-200 bg-white/80 backdrop-blur flex justify-between items-center">
                  <button
                    onClick={prevStep}
                    disabled={briefStep === 1}
                    className="px-6 py-2 text-[#ff9933] border border-[#ff9933] bg-white rounded-lg font-semibold hover:bg-[#fff5eb] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    Back
                  </button>
                  {briefStep < 2 ? (
                    <button
                      onClick={nextStep}
                      className="px-6 py-2 bg-gradient-to-r from-[#ff9933] to-[#ff6b35] text-white rounded-lg font-semibold shadow-sm hover:shadow-lg hover:brightness-105 transition-all"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={nextStep}
                      className="px-6 py-2 bg-gradient-to-r from-[#e91e63] to-[#ff1744] text-white rounded-lg font-semibold shadow-sm hover:shadow-lg hover:brightness-105 transition-all"
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
  const [activeTab, setActiveTab] = useState<"guided" | "upload">("guided");

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("guided")}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === "guided"
              ? "bg-[#ff9933] text-white"
              : "bg-gray-100 text-[#61636c] hover:bg-gray-200"
          }`}
        >
          Guided Form
        </button>
        <button
          onClick={() => setActiveTab("upload")}
          className={`px-6 py-2 rounded-lg font-semibold transition-colors ${
            activeTab === "upload"
              ? "bg-[#ff9933] text-white"
              : "bg-gray-100 text-[#61636c] hover:bg-gray-200"
          }`}
        >
          Upload Document
        </button>
      </div>

      {activeTab === "guided" ? (
        <>
          {/* Project Title & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#333438] mb-2">
                Project Title*
              </label>
              <input
                type="text"
                placeholder="e.g., SaaS Dashboard for Logistics"
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#333438] mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => updateFormData({ category: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent shadow-sm"
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
            <label className="block text-sm font-semibold text-[#333438] mb-2">
              Project Description*
            </label>
            <p className="text-xs text-[#92969f] mb-2">
              • Describe your vision in a few sentences.
            </p>
            <textarea
              placeholder="I want to build a mobile app that helps dog walkers find clients..."
              value={formData.description}
              onChange={(e) => updateFormData({ description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent resize-none shadow-sm"
            />
          </div>

          {/* Problem Solving */}
          <div>
            <label className="block text-sm text-[#92969f] mb-2">
              What is the main problem you are solving?
            </label>
            <input
              type="text"
              value={formData.problemSolving}
              onChange={(e) =>
                updateFormData({ problemSolving: e.target.value })
              }
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff9933] focus:border-transparent shadow-sm"
            />
          </div>

          {/* Current State */}
          <div>
            <label className="block text-sm font-semibold text-[#333438] mb-4">
              What is the current state of the project?
            </label>
            <div className="grid grid-cols-2 gap-4">
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
        </>
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-[#61636c] mb-2">
            <span className="text-[#ff9933] font-semibold cursor-pointer hover:underline">
              Click
            </span>{" "}
            or drag and drop
          </p>
          <p className="text-sm text-[#92969f]">PDF, DOC, or TXT (max. 10MB)</p>
        </div>
      )}
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
      !formData.skills.includes(skill)
  );

  const addSkill = (skill: string) => {
    const existingSkill = generalSkills.find(
      (s) => s.toLowerCase() === skill.toLowerCase()
    );

    if (existingSkill) {
      if (!formData.skills.includes(existingSkill)) {
        updateFormData({ skills: [...formData.skills, existingSkill] });
      }
    } else {
      const isDuplicateCustom = formData.customSkills.some(
        (s) => s.toLowerCase() === skill.toLowerCase()
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
    <div className="space-y-4">
      {/* Skills */}
      <div className="relative">
        <label className="block text-sm font-semibold text-[#333438] mb-2">
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
            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e91e63] focus:border-transparent mb-4 shadow-sm pr-10"
          />
          <div
            className={`absolute right-3 top-2.5 transition-colors duration-200 pointer-events-none ${
              skillInput.trim() ? "text-[#ff9933]" : "text-gray-300"
            }`}
          >
            <CornerDownLeft className="w-5 h-5" />
          </div>
          {showDropdown && skillInput && filteredSkills.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-lg shadow-lg z-50 max-h-48 overflow-y-auto">
              {filteredSkills.map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-[#333438] text-sm transition-colors"
                >
                  {skill}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Skills */}
        <div className="flex flex-wrap gap-2">
          {[...formData.skills, ...formData.customSkills].map((skill) => (
            <div
              key={skill}
              className="px-4 py-1.5 bg-white border border-gray-300 text-[#333438] rounded-full text-sm flex items-center gap-2 shadow-sm cursor-pointer hover:border-red-500 hover:text-red-500 transition-colors group"
              onClick={() => removeSkill(skill)}
            >
              {skill}
              <X className="w-3 h-3 text-gray-400 group-hover:text-red-500 transition-colors" />
            </div>
          ))}
        </div>

        {/* Popular Suggestions */}
        <div className="mt-4">
          <p className="text-xs text-[#92969f] mb-2 font-medium">
            Popular Skills
          </p>
          <div className="flex flex-wrap gap-2">
            {generalSkills
              .filter((skill) => !formData.skills.includes(skill))
              .slice(0, 14)
              .map((skill) => (
                <button
                  key={skill}
                  onClick={() => addSkill(skill)}
                  className="px-3 py-1 bg-white border border-gray-200 text-[#61636c] rounded-full text-xs hover:border-[#ff9933] hover:text-[#ff9933] transition-colors"
                >
                  + {skill}
                </button>
              ))}
          </div>
        </div>
      </div>

      {/* Expected Duration */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-4">
          Expected Duration
        </label>
        <div className="grid grid-cols-2 gap-4">
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

      {/* Roadmap Upload */}
      <div>
        <label className="block text-sm font-semibold text-[#333438] mb-2">
          Do you have an existing Roadmap or Timeline? (Optional)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-10 h-10 text-gray-400 mx-auto mb-3" />
          <p className="text-[#61636c] mb-1">
            <span className="text-[#ff9933] font-semibold cursor-pointer hover:underline">
              Click
            </span>{" "}
            or drag and drop
          </p>
          <p className="text-xs text-[#92969f]">
            PDF, Excel, or Image (max. 5MB)
          </p>
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
