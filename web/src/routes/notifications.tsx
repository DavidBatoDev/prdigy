import { createFileRoute, redirect } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  notificationsService,
  type NotificationItem,
} from "@/services/notifications.service";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationsRealtime } from "@/hooks/useNotificationsRealtime";

export const Route = createFileRoute("/notifications")({
  beforeLoad: () => {
    const { isAuthenticated } = useAuthStore.getState();
    if (!isAuthenticated) throw redirect({ to: "/auth/login" });
  },
  component: NotificationsPage,
});

function getNotificationTitle(item: NotificationItem) {
  const name = item.type?.name;
  if (name === "project_invite_received") return "New project invite";
  if (name === "project_invite_responded") return "Invite response";
  if (name === "marketplace_profile_live") return "Profile is live";
  return "Notification";
}

function getNotificationBody(item: NotificationItem) {
  const message = item.content?.message;
  if (typeof message === "string" && message.trim()) return message;
  const status = item.content?.status;
  if (typeof status === "string") {
    return `Invite was ${status}.`;
  }
  return "You have an update.";
}

function NotificationsPage() {
  const queryClient = useQueryClient();
  const profile = useAuthStore((state) => state.profile);

  useNotificationsRealtime(profile?.id);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", "page"],
    queryFn: () => notificationsService.list({ limit: 100 }),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id, true),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => notificationsService.deleteOne(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
      await queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });

  const notifications = notificationsQuery.data || [];

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-12 px-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-sm text-gray-600 mt-1">
              Stay updated on marketplace events and project activity.
            </p>
          </div>
          <button
            type="button"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending || notifications.length === 0}
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Mark all as read
          </button>
        </div>

        {notificationsQuery.isLoading ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#ff9933]" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
            <h2 className="text-lg font-semibold text-gray-900">
              No notifications
            </h2>
            <p className="text-sm text-gray-600 mt-1">You’re all caught up.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-5 ${
                  item.is_read ? "border-gray-200" : "border-amber-300"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {getNotificationTitle(item)}
                    </h2>
                    <p className="text-sm text-gray-700 mt-1">
                      {getNotificationBody(item)}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!item.is_read ? (
                      <button
                        type="button"
                        onClick={() => markReadMutation.mutate(item.id)}
                        disabled={markReadMutation.isPending}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
                      >
                        Mark read
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => removeMutation.mutate(item.id)}
                      disabled={removeMutation.isPending}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
