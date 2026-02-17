import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, LogIn, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  LeftSidePanel,
  type Message,
} from "@/components/roadmap/LeftSidePanel";
import { RoadmapCanvas } from "@/components/roadmap/RoadmapCanvas";
import { ShareRoadmapModal } from "@/components/roadmap/ShareRoadmapModal";
import { MakeProjectDialog } from "@/components/roadmap/MakeProjectDialog";
import { callGeminiAPI } from "@/lib/gemini";
import { useUser } from "@/stores/authStore";
import { getOrCreateGuestUser } from "@/lib/guestAuth";
import { Link } from "@tanstack/react-router";
import {
  roadmapService,
  epicService,
  featureService,
  taskService,
} from "@/services/roadmap.service";
import {
  ProjectBriefModal,
  type FormData,
} from "@/components/roadmap/ProjectBriefModal";
import type {
  RoadmapMilestone,
  RoadmapEpic,
  RoadmapFeature,
  Roadmap,
  RoadmapTask,
} from "@/types/roadmap";
import { useRoadmapStore } from "@/stores/roadmapStore";

export const Route = createFileRoute("/project/roadmap/$roadmapId")({
  component: RoadmapViewPage,
});

function RoadmapViewPage() {
  // Get roadmap ID from URL params
  const { roadmapId } = Route.useParams();
  const navigate = useNavigate();

  // Auth state
  const authenticatedUser = useUser();
  const [isGuest, setIsGuest] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Get roadmap data and actions from store
  const {
    roadmap,
    epics,
    loadRoadmap,
    resetRoadmap,
    isLoadingRoadmap,
  } = useRoadmapStore();
  const [roadmapError, setRoadmapError] = useState<string | null>(null);

  // Initialize user (authenticated or guest)
  useEffect(() => {
    const initializeUser = async () => {
      setIsLoadingUser(true);

      if (authenticatedUser) {
        setIsGuest(false);
      } else {
        await getOrCreateGuestUser();
        setIsGuest(true);
      }

      setIsLoadingUser(false);
    };

    initializeUser();
  }, [authenticatedUser]);

  // Fetch roadmap data from store
  useEffect(() => {
    if (!roadmapId) return;

    const fetchRoadmap = async () => {
      try {
        setRoadmapError(null);
        await loadRoadmap(roadmapId);

        // Pre-populate form data from roadmap project_metadata (preferred) or settings (fallback)
        const currentRoadmap = useRoadmapStore.getState().roadmap;
        if (currentRoadmap) {
          const projectMetadata = currentRoadmap.project_metadata as any;
          const settings = currentRoadmap.settings as any;
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
              title: source.title || currentRoadmap.name || "",
              category: source.category || "",
              description: source.description || currentRoadmap.description || "",
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
            content: `Welcome back to your roadmap "${currentRoadmap.name}"! I'm here to help you manage milestones, epics, and features. What would you like to work on?`,
            timestamp: new Date(),
          };
          setMessages([welcomeMessage]);
        }
      } catch (error: any) {
        console.error("Error fetching roadmap:", error);
        setRoadmapError(
          error.response?.data?.error?.message || "Failed to load roadmap",
        );
      }
    };

    fetchRoadmap();
    
    // Cleanup on unmount
    return () => {
      resetRoadmap();
    };
  }, [roadmapId, loadRoadmap, resetRoadmap]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const [focusNodeOffsetX, setFocusNodeOffsetX] = useState(0);
  const [navigateToEpicId, setNavigateToEpicId] = useState<string | null>(null);
  const [activeEpicId, setActiveEpicId] = useState<string | null>(null);
  const [navigateToFeature, setNavigateToFeature] = useState<{
    epicId: string;
    featureId: string;
  } | null>(null);
  const [openEpicEditorId, setOpenEpicEditorId] = useState<string | null>(null);
  const [openFeatureEditor, setOpenFeatureEditor] = useState<{
    epicId: string;
    featureId: string;
  } | null>(null);
  const [openTaskDetailId, setOpenTaskDetailId] = useState<string | null>(null);

  const handleNavigateToNode = useCallback(
    (nodeId: string, options?: { offsetX?: number }) => {
      setFocusNodeId(nodeId);
      setFocusNodeOffsetX(options?.offsetX ?? 0);
    },
    [],
  );

  const handleFocusComplete = useCallback(() => {
    setFocusNodeId(null);
    setFocusNodeOffsetX(0);
  }, []);

  const handleNavigateToEpicTab = useCallback((epicId: string) => {
    setNavigateToEpicId(epicId);
  }, []);

  const handleNavigateToEpicHandled = useCallback(() => {
    setNavigateToEpicId(null);
  }, []);

  const handleNavigateToFeature = useCallback(
    (epicId: string, featureId: string) => {
      setNavigateToFeature({ epicId, featureId });
    },
    [],
  );

  const handleNavigateToFeatureHandled = useCallback(() => {
    setNavigateToFeature(null);
  }, []);

  const handleOpenEpicEditor = useCallback((epicId: string) => {
    setOpenEpicEditorId(epicId);
  }, []);

  const handleOpenEpicEditorHandled = useCallback(() => {
    setOpenEpicEditorId(null);
  }, []);

  const handleOpenFeatureEditor = useCallback(
    (epicId: string, featureId: string) => {
      setOpenFeatureEditor({ epicId, featureId });
    },
    [],
  );

  const handleOpenFeatureEditorHandled = useCallback(() => {
    setOpenFeatureEditor(null);
  }, []);

  const handleOpenTaskDetail = useCallback((taskId: string) => {
    setOpenTaskDetailId(taskId);
  }, []);

  const handleOpenTaskDetailHandled = useCallback(() => {
    setOpenTaskDetailId(null);
  }, []);

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

  // Make Project Dialog state
  const [isMakeProjectDialogOpen, setIsMakeProjectDialogOpen] = useState(false);

  // Builder state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  // NOTE: epics and milestones are now managed by roadmapStore
  const { milestones: roadmapMilestones, addMilestone, updateMilestone, deleteMilestone } = useRoadmapStore();

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

      await roadmapService.update(roadmapId, {
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


      // Note: roadmap state is now managed by the store
      // The store will automatically update when loadRoadmap is called

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

  const handleAddMilestone = () => {
    // Milestone CRUD is now handled by the store
    addMilestone();
  };

  const handleUpdateMilestone = (updated: RoadmapMilestone) => {
    updateMilestone(updated);
  };

  const handleDeleteMilestone = (id: string) => {
    deleteMilestone(id);
  };

  // Note: Epic, Feature, and Task CRUD handlers have been moved to roadmapStore.ts
  // The store handles all data mutations and optimistic updates

  // Loading states
  if (isLoadingUser || isLoadingRoadmap) {
    return (
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#f6f7f8] flex items-center justify-center">
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
    <div className="min-h-screen bg-[#f6f7f8] relative overflow-hidden">
      {/* Guest User Banner */}
      {isGuest && !isLoadingUser && (
        <div className="relative z-50 bg-linear-to-r from-primary/90 to-primary text-white px-4 py-2 text-sm flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-medium">🎯 Guest Mode</span>
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

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div
        className={`fixed ${isGuest && !isLoadingUser ? "top-12" : "top-0"} left-0 right-0 bottom-0 flex`}
      >
        {/* Left: Chat Sidebar */}
        <motion.div
          id="roadmap-chat-panel"
          className="relative h-full border-r border-gray-200 bg-white"
          initial={{ width: "30%" }}
          animate={{ width: isSidebarOpen ? "30%" : "56px" }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          style={{ minWidth: 56 }}
        >
          <LeftSidePanel
            messages={messages}
            onSendMessage={handleSendMessage}
            isGenerating={isGenerating}
            isCollapsed={!isSidebarOpen}
            onSelectFeature={(epicId, featureId) => {
              if (activeEpicId) {
                handleNavigateToFeature(epicId, featureId);
                return;
              }
              handleNavigateToNode(featureId);
            }}
            onOpenEpicEditor={handleOpenEpicEditor}
            onOpenFeatureEditor={handleOpenFeatureEditor}
            onOpenTaskDetail={handleOpenTaskDetail}
            onNavigateToNode={handleNavigateToNode}
            onNavigateToEpicTab={handleNavigateToEpicTab}
            highlightedEpicId={activeEpicId}
          />

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
            projectTitle={roadmap.name}
            roadmap={roadmap}
            milestones={roadmapMilestones}
            epics={epics}
            onUpdateRoadmap={() => {}}
            onAddMilestone={handleAddMilestone}
            onUpdateMilestone={handleUpdateMilestone}
            onDeleteMilestone={handleDeleteMilestone}
            onEditBrief={() => {
              // Open the project brief modal for editing
              setBriefStep(1);
              setIsBriefOpen(true);
            }}
            onShare={() => {
              // Only allow sharing for authenticated users
              if (!isGuest) {
                setIsShareModalOpen(true);
              }
            }}
            onMakeProject={() => {
              // Open dialog to convert roadmap to project
              setIsMakeProjectDialogOpen(true);
            }}
            onExport={() => {
              /* TODO: Export functionality */
            }}
            focusNodeId={focusNodeId}
            focusNodeOffsetX={focusNodeOffsetX}
            onFocusComplete={handleFocusComplete}
            navigateToEpicId={navigateToEpicId}
            onNavigateToEpicHandled={handleNavigateToEpicHandled}
            navigateToFeature={navigateToFeature}
            onNavigateToFeatureHandled={handleNavigateToFeatureHandled}
            openEpicEditorId={openEpicEditorId}
            onOpenEpicEditorHandled={handleOpenEpicEditorHandled}
            openFeatureEditor={openFeatureEditor}
            onOpenFeatureEditorHandled={handleOpenFeatureEditorHandled}
            openTaskDetailId={openTaskDetailId}
            onOpenTaskDetailHandled={handleOpenTaskDetailHandled}
            onActiveEpicChange={setActiveEpicId}
          />
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
      {roadmap && !isGuest && (
        <ShareRoadmapModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          roadmapId={roadmap.id}
          roadmapName={roadmap.name}
        />
      )}

      {/* Make Project Dialog */}
      {roadmap && (
        <MakeProjectDialog
          isOpen={isMakeProjectDialogOpen}
          onClose={() => setIsMakeProjectDialogOpen(false)}
          onConfirm={() => {
            setIsMakeProjectDialogOpen(false);
            navigate({
              to: "/client/project-posting",
              search: {
                roadmapId: roadmap.id,
                fromRoadmap: true,
              },
            });
          }}
          roadmapName={roadmap.name}
        />
      )}
    </div>
  );
}
