import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, LogIn, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  LeftSidePanel,
  type Message,
} from "@/components/roadmap/LeftSidePanel";
import { RoadmapCanvas } from "@/components/roadmap/RoadmapCanvas";
import { ShareRoadmapModal } from "@/components/roadmap/ShareRoadmapModal";
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

export const Route = createFileRoute("/project/roadmap/$roadmapId")({
  component: RoadmapViewPage,
});

function RoadmapViewPage() {
  // Get roadmap ID from URL params
  const { roadmapId } = Route.useParams();

  // Auth state
  const authenticatedUser = useUser();
  const [isGuest, setIsGuest] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Roadmap data
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [isLoadingRoadmap, setIsLoadingRoadmap] = useState(true);
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

  // Fetch roadmap data
  useEffect(() => {
    const fetchRoadmap = async () => {
      if (!roadmapId) return;

      try {
        setIsLoadingRoadmap(true);
        setRoadmapError(null);

        const fullRoadmap = await roadmapService.getFull(roadmapId);
        setRoadmap(fullRoadmap);
        setRoadmapMilestones(fullRoadmap.milestones || []);
        setEpics(fullRoadmap.epics || []);

        // Pre-populate form data from roadmap settings
        const settings = fullRoadmap.settings as any;
        if (settings) {
          const allSkills = settings.skills || [];
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
            title: fullRoadmap.name || "",
            category: settings.category || "",
            description: fullRoadmap.description || "",
            problemSolving: settings.problemSolving || "",
            projectState: settings.projectState || "idea",
            skills: predefinedSkills,
            customSkills: customSkills,
            duration: settings.duration || "1-3_months",
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
      } finally {
        setIsLoadingRoadmap(false);
      }
    };

    fetchRoadmap();
  }, [roadmapId]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
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

  const handleNavigateToNode = useCallback((nodeId: string) => {
    setFocusNodeId(nodeId);
  }, []);

  const handleFocusComplete = useCallback(() => {
    setFocusNodeId(null);
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

  // Builder state
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [epics, setEpics] = useState<RoadmapEpic[]>([]);
  const [roadmapMilestones, setRoadmapMilestones] = useState<
    RoadmapMilestone[]
  >([]);

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
      await roadmapService.update(roadmapId, {
        name: formData.title || "Untitled Roadmap",
        description: formData.description,
        settings: {
          category: formData.category,
          problemSolving: formData.problemSolving,
          projectState: formData.projectState,
          skills: [...formData.skills, ...formData.customSkills],
          duration: formData.duration,
        },
      });

      // Update local roadmap state
      if (roadmap) {
        setRoadmap({
          ...roadmap,
          name: formData.title || "Untitled Roadmap",
          description: formData.description,
          settings: {
            category: formData.category,
            problemSolving: formData.problemSolving,
            projectState: formData.projectState,
            skills: [...formData.skills, ...formData.customSkills],
            duration: formData.duration,
          },
        });
      }

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
    if (!roadmapId) {
      console.warn("No roadmap ID available");
      return;
    }

    const newMilestone: RoadmapMilestone = {
      id: `m${Date.now()}`,
      roadmap_id: roadmapId,
      title: "New Milestone",
      target_date: new Date().toISOString(),
      status: "not_started",
      position: roadmapMilestones.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setRoadmapMilestones((prev) => [...prev, newMilestone]);
    // TODO: Create milestone via API
  };

  const handleUpdateMilestone = (updated: RoadmapMilestone) => {
    setRoadmapMilestones((prev) =>
      prev.map((m) => (m.id === updated.id ? updated : m)),
    );
  };

  const handleDeleteMilestone = (id: string) => {
    setRoadmapMilestones((prev) => prev.filter((m) => m.id !== id));
  };

  const handleAddEpic = async (
    _milestoneId?: string,
    epicInput?: Partial<RoadmapEpic>,
  ) => {
    if (!roadmapId) {
      console.warn("No roadmap ID available");
      return;
    }

    try {
      // Call the API to create the epic
      const newEpic = await epicService.create({
        roadmap_id: roadmapId,
        title: epicInput?.title?.trim() || "New Epic",
        description: epicInput?.description || "",
        priority: epicInput?.priority || "medium",
        status: epicInput?.status || "backlog",
        position: epicInput?.position ?? epics.length,
        color: epicInput?.color,
        estimated_hours: epicInput?.estimated_hours,
        start_date: epicInput?.start_date,
        due_date: epicInput?.due_date,
        tags: epicInput?.tags,
        labels: epicInput?.labels,
      });

      // Update local state with the newly created epic from the API
      if (newEpic.position < epics.length) {
        const updatedEpics = epics.map((e) => {
          if (e.position >= newEpic.position) {
            return { ...e, position: e.position + 1 };
          }
          return e;
        });
        setEpics([...updatedEpics, { ...newEpic, features: [] }]);
      } else {
        setEpics([...epics, { ...newEpic, features: [] }]);
      }
    } catch (error) {
      console.error("Failed to create epic:", error);
      // You might want to show a toast notification here
    }
  };

  const handleUpdateEpic = async (updatedEpic: RoadmapEpic) => {
    try {
      const updated = await epicService.update(updatedEpic.id, {
        title: updatedEpic.title,
        description: updatedEpic.description,
        priority: updatedEpic.priority,
        status: updatedEpic.status,
        position: updatedEpic.position,
        color: updatedEpic.color,
        estimated_hours: updatedEpic.estimated_hours,
        actual_hours: updatedEpic.actual_hours,
        start_date: updatedEpic.start_date,
        due_date: updatedEpic.due_date,
        completed_date: updatedEpic.completed_date,
        tags: updatedEpic.tags,
        labels: updatedEpic.labels,
      });

      setEpics(
        epics.map((e) =>
          e.id === updated.id ? { ...updated, features: e.features } : e,
        ),
      );
    } catch (error) {
      console.error("Failed to update epic:", error);
    }
  };

  const handleDeleteEpic = async (epicId: string) => {
    try {
      await epicService.delete(epicId);
      setEpics(epics.filter((e) => e.id !== epicId));
    } catch (error) {
      console.error("Failed to delete epic:", error);
    }
  };

  const handleAddFeature = async (
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
    if (!roadmapId) {
      console.warn("No roadmap ID available");
      return;
    }

    const epic = epics.find((e) => e.id === epicId);
    if (!epic) return;

    try {
      const newFeature = await featureService.create({
        roadmap_id: roadmapId,
        epic_id: epicId,
        title: data.title,
        description: data.description,
        status: data.status,
        position: epic.features?.length || 0,
        is_deliverable: data.is_deliverable,
      });

      setEpics(
        epics.map((e) =>
          e.id === epicId
            ? { ...e, features: [...(e.features || []), newFeature] }
            : e,
        ),
      );
    } catch (error) {
      console.error("Failed to create feature:", error);
    }
  };

  const handleUpdateFeature = async (feature: RoadmapFeature) => {
    try {
      const updated = await featureService.update(feature.id, {
        title: feature.title,
        description: feature.description,
        status: feature.status,
        position: feature.position,
        is_deliverable: feature.is_deliverable,
        estimated_hours: feature.estimated_hours,
        actual_hours: feature.actual_hours,
      });

      setEpics((prev) =>
        prev.map((epic) =>
          epic.id === feature.epic_id
            ? {
                ...epic,
                features: (epic.features || []).map((f) =>
                  f.id === updated.id
                    ? { ...updated, tasks: f.tasks || [] }
                    : f,
                ),
              }
            : epic,
        ),
      );
    } catch (error) {
      console.error("Failed to update feature:", error);
    }
  };

  const handleDeleteFeature = async (featureId: string) => {
    const epic = epics.find((e) => e.features?.some((f) => f.id === featureId));
    if (!epic) return;

    try {
      await featureService.delete(featureId);
      setEpics(
        epics.map((e) =>
          e.id === epic.id
            ? {
                ...e,
                features: e.features?.filter((f) => f.id !== featureId),
                updated_at: new Date().toISOString(),
              }
            : e,
        ),
      );
    } catch (error) {
      console.error("Failed to delete feature:", error);
    }
  };

  // Task handlers
  const handleAddTask = async (
    featureId: string,
    taskData: Partial<RoadmapTask>,
  ) => {
    if (!taskData.title) {
      console.warn("Task title is required");
      return;
    }

    try {
      const newTask = await taskService.create({
        feature_id: featureId,
        title: taskData.title,
        status: taskData.status || "todo",
        priority: taskData.priority || "medium",
        position: taskData.position,
        due_date: taskData.due_date,
      });

      // Update local state
      setEpics((prevEpics) =>
        prevEpics.map((epic) => ({
          ...epic,
          features: (epic.features || []).map((feature) =>
            feature.id === featureId
              ? {
                  ...feature,
                  tasks: [...(feature.tasks || []), newTask],
                }
              : feature,
          ),
        })),
      );
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleUpdateTask = async (task: RoadmapTask) => {
    try {
      const updated = await taskService.update(task.id, {
        title: task.title,
        status: task.status,
        priority: task.priority,
        position: task.position,
        due_date: task.due_date,
        completed_at: task.completed_at,
      });

      // Update local state
      setEpics((prevEpics) =>
        prevEpics.map((epic) => ({
          ...epic,
          features: (epic.features || []).map((feature) => ({
            ...feature,
            tasks: (feature.tasks || []).map((t) =>
              t.id === updated.id ? updated : t,
            ),
          })),
        })),
      );
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.delete(taskId);

      // Update local state
      setEpics((prevEpics) =>
        prevEpics.map((epic) => ({
          ...epic,
          features: (epic.features || []).map((feature) => ({
            ...feature,
            tasks: (feature.tasks || []).filter((t) => t.id !== taskId),
          })),
        })),
      );
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

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
            epics={epics}
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
            onAddEpic={handleAddEpic}
            onUpdateEpic={handleUpdateEpic}
            onDeleteEpic={handleDeleteEpic}
            onAddFeature={handleAddFeature}
            onUpdateFeature={handleUpdateFeature}
            onDeleteFeature={handleDeleteFeature}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
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
            onExport={() => {
              /* TODO: Export functionality */
            }}
            focusNodeId={focusNodeId}
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
    </div>
  );
}
