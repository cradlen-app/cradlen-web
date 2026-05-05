export type NotificationCategory =
  | "appointment"
  | "staff"
  | "medicine"
  | "patient"
  | "report"
  | "system";

export type Notification = {
  id: string;
  category: NotificationCategory;
  title: string;
  description: string;
  is_read: boolean;
  read_at: string | null;
  navigate_to: string | null;
  metadata?: Record<string, unknown>;
  created_at: string; // ISO 8601
};

export type NotificationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  unreadCount: number;
};

export type NotificationsResponse = {
  data: Notification[];
  meta: NotificationMeta;
};

export type UseNotificationsReturn = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  meta: NotificationMeta | null;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};
