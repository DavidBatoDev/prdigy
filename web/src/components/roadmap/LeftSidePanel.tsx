import { useState } from "react";
import { MessageSquare, FileText, Home, Map, CheckSquare, Settings } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import type { Message } from "./ChatPanel";

export type { Message } from "./ChatPanel";

interface LeftSidePanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isGenerating?: boolean;
  isGuest?: boolean;
  isCollapsed?: boolean;
}

type NavItem = "home" | "roadmap" | "tasks" | "settings";

export function LeftSidePanel({
  messages,
  onSendMessage,
  isGenerating = false,
  isGuest = false,
  isCollapsed = false,
}: LeftSidePanelProps) {
  const [activeTab, setActiveTab] = useState<"assistant" | "notes">(
    "assistant",
  );
  const [activeNav, setActiveNav] = useState<NavItem>("roadmap");

  const navItems = [
    { id: "home" as NavItem, icon: Home, label: "Home" },
    { id: "roadmap" as NavItem, icon: Map, label: "Roadmap" },
    { id: "tasks" as NavItem, icon: CheckSquare, label: "Tasks" },
    { id: "settings" as NavItem, icon: Settings, label: "Settings" },
  ];

  return (
    <div className="h-full w-full flex bg-white">
      {/* Left Sidenav - Always visible */}
      <div className="w-14 border-r border-gray-200 bg-gray-50 flex flex-col items-center py-4 gap-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${
                isActive
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-200 hover:text-gray-900"
              }`}
              title={item.label}
            >
              <Icon className="w-5 h-5" />
            </button>
          );
        })}
      </div>

      {/* Main Content Area - Hidden when collapsed */}
      {!isCollapsed && (
        <div className="flex-1 flex flex-col">
          {/* Tabs */}
          <div className="flex border-b border-gray-200 bg-gray-50">
            <button
              onClick={() => setActiveTab("assistant")}
              className={`flex-1 px-4 py-3 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                activeTab === "assistant"
                  ? "text-primary border-b-2 border-primary bg-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              AI Assistant
            </button>
            <button
              onClick={() => setActiveTab("notes")}
              className={`flex-1 px-4 py-3 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${
                activeTab === "notes"
                  ? "text-primary border-b-2 border-primary bg-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="w-4 h-4" />
              Notes
            </button>
          </div>

          {/* Content */}
          {activeTab === "assistant" ? (
            <ChatPanel
              messages={messages}
              onSendMessage={onSendMessage}
              isGenerating={isGenerating}
            />
          ) : (
            <NotesPanel isGuest={isGuest} />
          )}
        </div>
      )}
    </div>
  );
}

interface NotesPanelProps {
  isGuest?: boolean;
}

function NotesPanel({ isGuest = false }: NotesPanelProps) {
  const [notes, setNotes] = useState("");

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Project Notes</h2>
        <p className="text-sm text-gray-600 mt-1">
          Keep track of important details and ideas
        </p>
      </div>

      {/* Notes textarea */}
      <div className="flex-1 px-6 py-4 overflow-y-auto">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Write your notes here... Add context, requirements, or any important details about the project."
          className="w-full h-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
        />
      </div>

      {/* Footer info */}
      <div className="px-6 py-3 border-t border-gray-200 text-xs text-gray-500">
        <p>
          {isGuest
            ? "Auto-saved locally (Guest Mode - Sign in to save permanently)"
            : "Auto-saved locally"}
        </p>
      </div>
    </div>
  );
}
