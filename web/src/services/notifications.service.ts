import apiClient from "@/api/axios";

export type NotificationCategory = "global" | "specific";
export type NotificationPriority = "low" | "medium" | "high";

export interface NotificationTypeMeta {
  id: string;
  name: string;
  category: NotificationCategory;
  priority: NotificationPriority;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  project_id: string | null;
  actor_id: string | null;
  content: Record<string, unknown>;
  is_read: boolean;
  read_at: string | null;
  link_url: string | null;
  created_at: string;
  updated_at: string;
  type: NotificationTypeMeta | null;
}

export interface NotificationsQuery {
  limit?: number;
  offset?: number;
  is_read?: boolean;
  project_id?: string;
}

class NotificationsService {
  private base = "/api/notifications";

  async list(query: NotificationsQuery = {}): Promise<NotificationItem[]> {
    const params: Record<string, string | number | boolean> = {};

    if (query.limit !== undefined) params.limit = query.limit;
    if (query.offset !== undefined) params.offset = query.offset;
    if (query.is_read !== undefined) params.is_read = query.is_read;
    if (query.project_id) params.project_id = query.project_id;

    const { data } = await apiClient.get(this.base, { params });
    return data.data;
  }

  async unreadCount(): Promise<number> {
    const { data } = await apiClient.get(`${this.base}/unread-count`);
    return data.data?.unread ?? 0;
  }

  async markRead(id: string, isRead = true) {
    const { data } = await apiClient.patch(`${this.base}/${id}/read`, {
      is_read: isRead,
    });
    return data.data;
  }

  async markAllRead() {
    const { data } = await apiClient.patch(`${this.base}/read-all`);
    return data.data;
  }

  async deleteOne(id: string) {
    const { data } = await apiClient.delete(`${this.base}/${id}`);
    return data.data;
  }
}

export const notificationsService = new NotificationsService();
