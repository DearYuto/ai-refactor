import { customFetch } from './client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: unknown;
  read: boolean;
  createdAt: string;
}

export async function fetchNotifications(
  token: string,
): Promise<Notification[]> {
  return customFetch('/notifications', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function getUnreadCount(token: string): Promise<{ count: number }> {
  return customFetch('/notifications/unread-count', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function markAsRead(
  token: string,
  notificationId: string,
): Promise<void> {
  return customFetch(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function markAllAsRead(token: string): Promise<void> {
  return customFetch('/notifications/read-all', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
