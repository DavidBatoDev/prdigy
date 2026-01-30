import { useState } from "react";
import { MessageSquare, FileText } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import type { Message } from "./ChatPanel";

export type { Message } from "./ChatPanel";

interface LeftSidePanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  isGenerating?: boolean;
}

export function LeftSidePanel({
  messages,
  onSendMessage,
  isGenerating = false,
}: LeftSidePanelProps) {
  const [activeTab, setActiveTab] = useState<"assistant" | "notes">(
    "assistant",
  );

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Logo and Brand Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <img src="/prodigylogos/light/logovector.svg" alt="Prodigi" className="h-6" />
          <h2 className="text-lg font-semibold text-gray-900">Prodigi</h2>
        </div>
        <p className="text-sm text-gray-600">
          Ask questions or request changes to your roadmap
        </p>
      </div>

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
        <NotesPanel />
      )}
    </div>
  );
}

function NotesPanel() {
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
        <p>Auto-saved locally</p>
      </div>
    </div>
  );
}
