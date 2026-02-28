'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { useNotificationStore } from '@/lib/store';
import { getSocket, disconnectSocket } from '@/lib/socket';
import { toast } from 'sonner';
import type { Notification } from '@/lib/api/notifications.api';

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const token = useAuthStore((state) => state.token);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const { setNotifications, setUnreadCount, addNotification } =
    useNotificationStore();

  useEffect(() => {
    if (!isLoggedIn || !token) {
      disconnectSocket();
      return;
    }

    const socket = getSocket(token);

    // 연결 이벤트
    socket.on('connect', () => {
      console.log('WebSocket 연결됨');
    });

    // 읽지 않은 알림 수
    socket.on('unreadCount', (count: number) => {
      setUnreadCount(count);
    });

    // 새 알림
    socket.on('newNotification', (notification: Notification) => {
      addNotification(notification);

      // 토스트 알림 표시
      toast.success(notification.title, {
        description: notification.message,
        duration: 5000,
      });
    });

    // 알림 목록 수신
    socket.on('notifications', (data: { data: Notification[] }) => {
      setNotifications(data.data);
    });

    // 연결 해제 이벤트
    socket.on('disconnect', () => {
      console.log('WebSocket 연결 해제됨');
    });

    // 초기 알림 목록 요청
    socket.emit('getNotifications');

    // 클린업
    return () => {
      disconnectSocket();
    };
  }, [isLoggedIn, token, setNotifications, setUnreadCount, addNotification]);

  return <>{children}</>;
}
