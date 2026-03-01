import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  RoadmapLeftSidePanel,
  type Message,
  RoadmapCanvas,
  ShareRoadmapModal,
  ProjectBriefModal,
  type FormData,
} from "@/components/roadmap";
import { RoadmapTopBar } from "./RoadmapTopBar";
import { callGeminiAPI } from "@/lib/gemini";
import { useRoadmapStore } from "@/stores/roadmapStore";
import { useProjectSettingsStore } from "@/stores/projectSettingsStore";

interface RoadmapViewContentProps {
  roadmapId: string;
}

export function RoadmapViewContent({ roadmapId }: RoadmapViewContentProps) {

  // Roadmap data and actions from store
  const roadmap = useRoadmapStore((state) => state.roadmap);
  const isLoadingRoadmap = useRoadmapStore((state) => state.isLoadingRoadmap);
  const activeEpicId = useRoadmapStore((state) => state.activeEpicId);
  const loadRoadmap = useRoadmapStore((state) => state.loadRoadmap);
  const resetRoadmap = useRoadmapStore((state) => state.resetRoadmap);
  const updateRoadmapMetadata = useRoadmapStore(
    (state) => state.updateRoadmapMetadata,
  );
  const navigateToNode = useRoadmapStore((state) => state.navigateToNode);
  const navigateToEpicTab = useRoadmapStore((state) => state.navigateToEpicTab);
  const navigateToFeatureNode = useRoadmapStore(
    (state) => state.navigateToFeatureNode,
  );
  const openEpicEditor = useRoadmapStore((state) => state.openEpicEditor);
  const openFeatureEditor = useRoadmapStore(
    (state) => state.openFeatureEditorModal,
  );
  const openTaskDetail = useRoadmapStore((state) => state.openTaskDetail);
  const canvasViewMode = useRoadmapStore((state) => state.canvasViewMode);
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  const setSidebarExpanded = useProjectSettingsStore(
    (state) => state.setSidebarExpanded,
  );

  // Auto-close project sidebar when entering roadmap canvas
  useEffect(() => {
    setSidebarExpanded(false);
  }, [setSidebarExpanded]);

  // Fetch roadmap data
  useEffect(() => {
    const fetchRoadmap = async () => {
      if (!roadmapId) return;

      try {
        setRoadmapError(null);

        await loadRoadmap(roadmapId);
        const fullRoadmap = useRoadmapStore.getState().roadmap;
        if (!fullRoadmap) return;

        // Pre-populate form data from roadmap project_metadata (preferred) or settings (fallback)
        const projectMetadata = fullRoadmap.project_metadata as any;
        const settings = fullRoadmap.settings as any;
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

          setFormData({
            title: source.title || fullRoadmap.name || "",
            category: source.category || "",
            description: source.description || fullRoadmap.description || "",
            problemSolving: source.problemSolving || "",
            projectState: source.projectState || "idea",
            skills: predefinedSkills,
            customSkills: customSkills,
            duration: source.duration || "1-3_months",
          });
        }

        // Add initial welcome message
        const welcomeMessage: Message = {
          id: "1",
          role: "assistant",
          content: `Welcome back to your roadmap "${fullRoadmap.name}"! I'm here to help you manage milestones, epics, and features. What would you like to work on?`,
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } catch (error: any) {
        console.error("Error fetching roadmap:", error);
        setRoadmapError(
          error.response?.data?.error?.message || "Failed to load roadmap",
        );
      }
    };

    fetchRoadmap();
    return () => {
      resetRoadmap();
    };
  }, [loadRoadmap, resetRoadmap, roadmapId]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Project Brief Modal state
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [briefStep, setBriefStep] = useState(1);
  const [isUpdatingRoadmap, setIsUpdatingRoadmap] = useState(false);
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

  // Share Modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Builder state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSendMessage = async (message: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsGenerating(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      conversationHistory.push({
        role: "user",
        content: message,
      });

      const projectBrief = roadmap
        ? `Roadmap: ${roadmap.name}\nDescription: ${roadmap.description || "N/A"}`
        : "";

      const aiResponse = await callGeminiAPI(conversationHistory, projectBrief);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting response from Gemini:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleModalUpdateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleModalSubmit = async () => {
    await handleUpdateRoadmap();
  };

  const handleUpdateRoadmap = async () => {
    if (!roadmapId) return;

    setIsUpdatingRoadmap(true);
    try {
      // Save comprehensive project metadata for future project conversion
      const projectMetadata = {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        problemSolving: formData.problemSolving,
        projectState: formData.projectState,
        skills: [...formData.skills, ...formData.customSkills],
        duration: formData.duration,
        // Note: budgetRange, fundingStatus, startDate, customStartDate
        // will be added when converting to project via project-posting
      };

      await updateRoadmapMetadata({
        name: formData.title || "Untitled Roadmap",
        description: formData.description,
        project_metadata: projectMetadata,
        settings: {
          category: formData.category,
          problemSolving: formData.problemSolving,
          projectState: formData.projectState,
          skills: [...formData.skills, ...formData.customSkills],
          duration: formData.duration,
        },
      });

      setIsBriefOpen(false);
      setBriefStep(1);

      // Add success message to chat
      const successMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: `Great! I've updated your roadmap "${formData.title}". The changes have been saved.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error) {
      console.error("Failed to update roadmap:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I couldn't update the roadmap. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsUpdatingRoadmap(false);
    }
  };

  // Loading roadmap data
  if (isLoadingRoadmap) {
    return (
      <div className="flex-1 min-h-full bg-[#f6f7f8] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (roadmapError || !roadmap) {
    return (
      <div className="flex-1 min-h-full bg-[#f6f7f8] flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Roadmap Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {roadmapError ||
              "The roadmap you're looking for doesn't exist or you don't have access to it."}
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f6f7f8] overflow-hidden">

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* Top navigation bar: view tabs + share/export */}
      <RoadmapTopBar
        onShare={() => setIsShareModalOpen(true)}
        onExport={() => {
          /* TODO: Export functionality */
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Sidebar — hidden in milestones view */}
        {canvasViewMode !== "milestones" && (
          <motion.div
            id="roadmap-left-panel"
            className="relative h-full border-r border-gray-200 bg-white"
            initial={false}
            animate={{
              width: isSidebarOpen ? 320 : 0
            }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            style={{ minWidth: isSidebarOpen ? 320 : 0 }}
          >
            <RoadmapLeftSidePanel
              messages={messages}
              onSendMessage={handleSendMessage}
              isGenerating={isGenerating}
              isCollapsed={!isSidebarOpen}
              onSelectFeature={(epicId, featureId) => {
                if (activeEpicId) {
                  navigateToFeatureNode(epicId, featureId);
                  return;
                }
                navigateToNode(featureId);
              }}
              onOpenEpicEditor={openEpicEditor}
              onOpenFeatureEditor={openFeatureEditor}
              onOpenTaskDetail={openTaskDetail}
              onNavigateToNode={navigateToNode}
              onNavigateToEpicTab={navigateToEpicTab}
              highlightedEpicId={activeEpicId}
            />

            <button
              type="button"
              aria-controls="roadmap-left-panel"
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center hover:bg-gray-50"
              title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {isSidebarOpen ? (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          </motion.div>
        )}

        {/* Right: Roadmap Canvas */}
        <div className="flex-1 relative">
          <RoadmapCanvas roadmap={roadmap} />
        </div>
      </div>

      {/* Project Brief Modal (For Editing) */}
      <ProjectBriefModal
        isOpen={isBriefOpen}
        onClose={() => setIsBriefOpen(false)}
        mode="edit"
        formData={formData}
        onUpdateFormData={handleModalUpdateFormData}
        currentStep={briefStep}
        onStepChange={setBriefStep}
        onSubmit={handleModalSubmit}
        isSubmitting={isUpdatingRoadmap}
      />

      {/* Share Roadmap Modal */}
      {roadmap && (
        <ShareRoadmapModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          roadmapId={roadmap.id}
          roadmapName={roadmap.name}
        />
      )}
    </div>
  );
}
