import { useState } from "react";
import { Send, Loader2 } from "lucide-react";
import type { Comment } from "@/types/roadmap";
import { formatDistanceToNow } from "date-fns";

interface CommentsSectionProps {
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  canComment: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const CommentsSection = ({
  comments,
  onAddComment,
  canComment,
  isLoading = false,
  emptyMessage = "No comments yet. Be the first to comment!",
}: CommentsSectionProps) => {
  const [commentInput, setCommentInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentInput.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onAddComment(commentInput.trim());
      setCommentInput("");
    } catch (error) {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Comment Input */}
      {canComment && (
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Write a comment..."
            disabled={isSubmitting}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-gray-50"
          />
          <button
            type="submit"
            disabled={!commentInput.trim() || isSubmitting}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      )}

      {!canComment && (
        <div className="text-center py-4 bg-gray-50 border border-gray-200 rounded-md">
          <p className="text-sm text-gray-500">
            You need commenter or editor access to add comments
          </p>
        </div>
      )}

      {/* Comments List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-sm text-gray-500">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => {
            const displayName =
              comment.user?.display_name ||
              [comment.user?.first_name, comment.user?.last_name]
                .filter(Boolean)
                .join(" ") ||
              "Unknown User";

            const timeAgo = formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
            });

            return (
              <div
                key={comment.id}
                className="flex gap-3 p-3 bg-gray-50 rounded-md"
              >
                {/* Avatar */}
                {comment.user?.avatar_url ? (
                  <img
                    src={comment.user.avatar_url}
                    alt={displayName}
                    className="w-8 h-8 rounded-full shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-medium text-primary">
                      {displayName[0].toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {displayName}
                    </span>
                    <span className="text-xs text-gray-500">{timeAgo}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
