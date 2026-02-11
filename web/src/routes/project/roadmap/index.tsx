import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import {
  LeftSidePanel,
  type Message,
} from "@/components/roadmap/LeftSidePanel";
import { RoadmapCanvas } from "@/components/roadmap/RoadmapCanvas";
import { callGeminiAPI } from "@/lib/gemini";
import { useUser } from "@/stores/authStore";
import { getOrCreateGuestUser } from "@/lib/guestAuth";
import { Link } from "@tanstack/react-router";
import { roadmapService, taskService } from "@/services/roadmap.service";
import {
  ProjectBriefModal,
  type FormData,
} from "@/components/roadmap/ProjectBriefModal";
// Milestone type is now RoadmapMilestone from @/types/roadmap
import type {
  RoadmapMilestone,
  RoadmapEpic,
  RoadmapFeature,
  RoadmapTask,
} from "@/types/roadmap";

export const Route = createFileRoute("/project/roadmap/")({
  component: RoadmapBuilderPage,
});

function RoadmapBuilderPage() {
  // Navigation
  const navigate = useNavigate();

  // Auth state
  const authenticatedUser = useUser();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [roadmapId, setRoadmapId] = useState<string | null>(null);
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

  const buildProjectBrief = (data: FormData) => {
    const lines: string[] = [];
    if (data.title) lines.push(`Title: ${data.title}`);
    if (data.category) lines.push(`Category: ${data.category}`);
    if (data.description) lines.push(`Description: ${data.description}`);
    if (data.problemSolving) {
      lines.push(`Problem: ${data.problemSolving}`);
    }
    if (data.projectState) lines.push(`Project state: ${data.projectState}`);

    const skills = [...data.skills, ...data.customSkills].filter(Boolean);
    if (skills.length > 0) lines.push(`Skills: ${skills.join(", ")}`);
    if (data.duration) lines.push(`Duration: ${data.duration}`);

    return lines.join("\n");
  };

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
      // Convert messages to the format expected by Gemini API
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the new user message
      conversationHistory.push({
        role: "user",
        content: message,
      });

      const projectBrief = buildProjectBrief(formData);

      // Call Gemini API
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

  const updateFormData = (updates: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleModalSubmit = async () => {
    await handleCreateRoadmap();
    setIsBriefOpen(false);
  };

  const handleCreateRoadmap = async () => {
    if (!currentUserId || roadmapId) return; // Already created or no user

    setIsCreatingRoadmap(true);
    try {
      const roadmap = await roadmapService.create({
        name: formData.title || "Untitled Roadmap",
        description: formData.description,
        status: "draft",
        settings: {
          category: formData.category,
          problemSolving: formData.problemSolving,
          projectState: formData.projectState,
          skills: [...formData.skills, ...formData.customSkills],
          duration: formData.duration,
        },
      });

      setRoadmapId(roadmap.id);
      console.log("Roadmap created:", roadmap);

      // Navigate to the dynamic roadmap route
      navigate({
        to: "/project/roadmap/$roadmapId",
        params: { roadmapId: roadmap.id },
      });
    } catch (error) {
      console.error("Failed to create roadmap:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Sorry, I couldn't create the roadmap. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsCreatingRoadmap(false);
    }
  };

  const handleAddMilestone = () => {
    if (!roadmapId) {
      console.warn("No roadmap ID available - opening project brief");
      setIsBriefOpen(true);
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
    setMilestones((prev) => [...prev, newMilestone]);
    // TODO: Create milestone via API
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
    if (!roadmapId) {
      console.warn("No roadmap ID available - opening project brief");
      setIsBriefOpen(true);
      return;
    }

    const newEpic: RoadmapEpic = {
      id: `epic-${Date.now()}`,
      roadmap_id: roadmapId,
      title: epicInput?.title?.trim() || `New Epic`,
      description: epicInput?.description || "",
      priority: epicInput?.priority || "medium",
      status: epicInput?.status || "backlog",
      position: epicInput?.position ?? epics.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      progress: 0,
      features: [],
      // Spread any other input properties (like tags/labels)
      ...epicInput,
    };

    // If implementing insert logic
    if (newEpic.position < epics.length) {
      // We need to shift epics at or after this position
      const updatedEpics = epics.map((e) => {
        if (e.position >= newEpic.position!) {
          return { ...e, position: e.position + 1 };
        }
        return e;
      });
      setEpics([...updatedEpics, newEpic]);
    } else {
      setEpics([...epics, newEpic]);
    }
    // TODO: Create epic via API
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
    if (!roadmapId) {
      console.warn("No roadmap ID available - opening project brief");
      setIsBriefOpen(true);
      return;
    }

    const epic = epics.find((e) => e.id === epicId);
    if (!epic) return;

    const newFeature = {
      id: `feature-${Date.now()}`,
      roadmap_id: roadmapId,
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
                  ? {
                      ...feature,
                      tasks: f.tasks || [],
                      updated_at: new Date().toISOString(),
                    }
                  : f,
              ),
            }
          : epic,
      ),
    );
  };

  const handleDeleteFeature = (featureId: string) => {
    // Find epic containing feature
    const epic = epics.find((e) => e.features?.some((f) => f.id === featureId));
    if (!epic) return;

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
  };

  const handleAddTask = async (
    featureId: string,
    taskData: Partial<RoadmapTask>,
  ) => {
    if (!taskData.title) {
      console.warn("Task title is required");
      return;
    }

    const updateLocalState = (newTask: RoadmapTask) => {
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
    };

    if (!roadmapId) {
      const newTask: RoadmapTask = {
        id: `task-${Date.now()}`,
        feature_id: featureId,
        title: taskData.title,
        status: taskData.status || "todo",
        priority: taskData.priority || "medium",
        position: taskData.position || 0,
        due_date: taskData.due_date,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as RoadmapTask;

      updateLocalState(newTask);
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

      updateLocalState(newTask);
    } catch (error) {
      console.error("Failed to create task:", error);
    }
  };

  const handleUpdateTask = async (task: RoadmapTask) => {
    const updateLocalState = (updatedTask: RoadmapTask) => {
      setEpics((prevEpics) =>
        prevEpics.map((epic) => ({
          ...epic,
          features: (epic.features || []).map((feature) => ({
            ...feature,
            tasks: (feature.tasks || []).map((t) =>
              t.id === updatedTask.id ? updatedTask : t,
            ),
          })),
        })),
      );
    };

    if (!roadmapId) {
      updateLocalState({ ...task, updated_at: new Date().toISOString() });
      return;
    }

    try {
      const updated = await taskService.update(task.id, {
        title: task.title,
        status: task.status,
        priority: task.priority,
        position: task.position,
        due_date: task.due_date,
        completed_at: task.completed_at,
      });

      updateLocalState(updated);
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    const updateLocalState = () => {
      setEpics((prevEpics) =>
        prevEpics.map((epic) => ({
          ...epic,
          features: (epic.features || []).map((feature) => ({
            ...feature,
            tasks: (feature.tasks || []).filter((t) => t.id !== taskId),
          })),
        })),
      );
    };

    if (!roadmapId) {
      updateLocalState();
      return;
    }

    try {
      await taskService.delete(taskId);
      updateLocalState();
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] relative overflow-hidden">
      {/* Guest User Banner */}
      {isGuest && !isLoadingUser && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-linear-to-r from-primary/90 to-primary text-white px-4 py-2 text-sm flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <span className="font-medium"> Guest Mode</span>
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

      {/* Local style to hide scrollbar UI while preserving scroll */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* Builder Console always visible */}
      <div
        className={`fixed ${isGuest && !isLoadingUser ? "top-12" : "top-0"} left-0 right-0 bottom-0 flex`}
      >
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
              isGuest={isGuest}
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
            projectTitle={formData.title || "Untitled Project"}
            roadmap={{
              id: currentUserId || "roadmap-main", // Use actual user ID as roadmap ID
              project_id: null, // Guest users don't have projects yet
              name: formData.title || "Project Roadmap",
              description: formData.description,
              owner_id: currentUserId || "user-main", // Use actual user ID
              status: "draft", // Guest roadmaps start as drafts
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
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onEditBrief={() => setIsBriefOpen(true)}
            onExport={() => {
              /* TODO: Export functionality */
            }}
          />
        </div>
      </div>

      {/* Project Brief Modal (Steps 1-2) */}
      <ProjectBriefModal
        isOpen={isBriefOpen}
        onClose={() => setIsBriefOpen(false)}
        mode="create"
        formData={formData}
        onUpdateFormData={updateFormData}
        currentStep={briefStep}
        onStepChange={setBriefStep}
        onSubmit={handleModalSubmit}
        isSubmitting={isCreatingRoadmap}
      />
    </div>
  );
}
