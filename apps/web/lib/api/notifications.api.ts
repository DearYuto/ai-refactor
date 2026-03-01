import { customFetch } from '@/lib/api/fetcher';

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
  const response = await customFetch<{ data: Notification[]; status: number; headers: Headers }>('/notifications', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function getUnreadCount(token: string): Promise<{ count: number }> {
  const response = await customFetch<{ data: { count: number }; status: number; headers: Headers }>('/notifications/unread-count', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}

export async function markAsRead(
  token: string,
  notificationId: string,
): Promise<void> {
  await customFetch<{ data: unknown; status: number; headers: Headers }>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function markAllAsRead(token: string): Promise<void> {
  await customFetch<{ data: unknown; status: number; headers: Headers }>('/notifications/read-all', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
