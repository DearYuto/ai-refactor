'use client';

import { useState } from 'react';
import { useAuthStore, useNotificationStore } from '@/lib/store';
import { markAsRead, markAllAsRead } from '@/lib/api/notifications.api';
import { getSocket } from '@/lib/socket';

// 알림 타입별 아이콘 매핑
const NOTIFICATION_ICONS: Record<string, string> = {
  ORDER_FILLED: '📊',        // 주문 체결
  DEPOSIT_CONFIRMED: '💰',   // 입금 확인
  WITHDRAWAL_COMPLETED: '💸', // 출금 완료
  WITHDRAWAL_APPROVED: '✅',  // 출금 승인
  WITHDRAWAL_REJECTED: '❌',  // 출금 거부
  SYSTEM: '🔔',              // 시스템 알림 (기본값)
};

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const token = useAuthStore((state) => state.token);
  const {
    notifications,
    unreadCount,
    markNotificationAsRead,
    setUnreadCount,
  } = useNotificationStore();

  const handleMarkAsRead = async (notificationId: string) => {
    if (!token) return;

    try {
      await markAsRead(token, notificationId);
      markNotificationAsRead(notificationId);

      // WebSocket으로 알림
      const socket = getSocket(token);
      socket.emit('markAsRead', notificationId);
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!token) return;

    try {
      await markAllAsRead(token);
      setUnreadCount(0);

      // WebSocket으로 알림
      const socket = getSocket(token);
      socket.emit('markAllAsRead');
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  return (
    <div className="relative">
      {/* 알림 벨 아이콘 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* 읽지 않은 알림 뱃지 */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="text-lg font-bold">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm text-blue-500 hover:text-blue-700"
              >
                모두 읽음으로 표시
              </button>
            )}
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                알림이 없습니다
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.read) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* 타입별 아이콘 */}
                    <span
                      className={`text-2xl ${
                        !notification.read ? 'animate-pulse' : ''
                      }`}
                    >
                      {NOTIFICATION_ICONS[notification.type] || '🔔'}
                    </span>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">{notification.title}</h4>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.createdAt).toLocaleString(
                          'ko-KR',
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
