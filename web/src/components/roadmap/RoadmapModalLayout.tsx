import {
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import { X, Plus, Calendar, Paperclip } from "lucide-react";

interface RoadmapModalLayoutProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onTitleChange: (value: string) => void;
  titlePlaceholder: string;
  onSubmit: (e: FormEvent) => void;
  actionButtons?: ReactNode;
  body: ReactNode;
  footer: ReactNode;
  canComment: boolean;
  commentPlaceholder?: string;
  rightPanelTabs?: { id: string; label: string; content: ReactNode }[];
  defaultRightPanelTabId?: string;
  autoFocusTitle?: boolean;
}

export const RoadmapModalLayout = ({
  isOpen,
  onClose,
  title,
  onTitleChange,
  titlePlaceholder,
  onSubmit,
  actionButtons,
  body,
  footer,
  canComment,
  commentPlaceholder = "Write a comment...",
  rightPanelTabs,
  defaultRightPanelTabId,
  autoFocusTitle,
}: RoadmapModalLayoutProps) => {
  if (!isOpen) return null;

  const tabs = useMemo(() => {
    if (rightPanelTabs?.length) {
      return rightPanelTabs;
    }

    return [
      {
        id: "comments",
        label: "Comments",
        content: canComment ? (
          <textarea
            placeholder={commentPlaceholder}
            className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={3}
          />
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500 mb-2">
              Sign in to leave comments
            </p>
            <p className="text-xs text-gray-400">
              You need to be logged in to participate in discussions
            </p>
          </div>
        ),
      },
    ];
  }, [rightPanelTabs, canComment, commentPlaceholder]);

  const tabIdsSignature = useMemo(
    () => rightPanelTabs?.map((t) => t.id).join("|") ?? "comments",
    [rightPanelTabs],
  );

  const [activeTabId, setActiveTabId] = useState<string>(
    defaultRightPanelTabId ?? tabs[0]?.id ?? "",
  );

  useEffect(() => {
    setActiveTabId(defaultRightPanelTabId ?? tabs[0]?.id ?? "");
  }, [isOpen, defaultRightPanelTabId, tabIdsSignature]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-hidden flex">
        {/* Main Content */}
        <form onSubmit={onSubmit} className="flex-1 flex flex-col">
          {/* Header */}
          <div className="px-12 pt-12 pb-6">
            <div className="flex items-center gap-3 mb-6">
              <button
                type="button"
                className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-gray-400 transition-colors flex-shrink-0"
                aria-label="Mark complete"
              />
              <input
                type="text"
                autoFocus={autoFocusTitle}
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder={titlePlaceholder}
                required
                className="text-4xl font-bold text-gray-900 border-none outline-none bg-transparent w-full placeholder:text-gray-300"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Calendar className="w-4 h-4" />
                Dates
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Paperclip className="w-4 h-4" />
                Attachment
              </button>
              {actionButtons}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-12 pb-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {body}
            {footer}
          </div>
        </form>

        {/* Right Panel - Comments */}
        <div className="w-96 border-l border-gray-200 flex flex-col bg-white">
          <div className="px-6 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center flex-1 gap-0">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={`relative px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
                    activeTabId === tab.id
                      ? "text-gray-900"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.label}
                  {activeTabId === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/80" />
                  )}
                </button>
              ))}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-md hover:bg-gray-100 transition-colors flex-shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {tabs.find((tab) => tab.id === activeTabId)?.content}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
