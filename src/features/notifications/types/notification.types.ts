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
  navigate_to?: string; // locale-stripped route, e.g. "/orgId/branchId/dashboard/staff"
  created_at: string;   // ISO 8601
};

export type UseNotificationsReturn = {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
};
