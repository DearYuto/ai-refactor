import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Notification } from "./api/notifications.api";

type UiState = {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

export const useUiStore = create<UiState>((set) => ({
  isSidebarOpen: false,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
}));

type MarketOrderState = {
  selectedOrderPrice: number | null;
  setSelectedOrderPrice: (price: number | null) => void;
};

export const useMarketOrderStore = create<MarketOrderState>((set) => ({
  selectedOrderPrice: null,
  setSelectedOrderPrice: (price) => set({ selectedOrderPrice: price }),
}));

// 사용자 정보 타입
export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  twoFactorEnabled?: boolean;
}

// 인증 상태 관리
interface AuthState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,
      setAuth: (token, user) => {
        // localStorage에도 저장 (기존 코드와의 호환성)
        if (typeof window !== "undefined") {
          window.localStorage.setItem("accessToken", token);
        }
        set({ token, user, isLoggedIn: true });
      },
      logout: () => {
        // localStorage에서도 삭제
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("accessToken");
        }
        set({ token: null, user: null, isLoggedIn: false });
      },
      updateUser: (updatedUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updatedUser } : null,
        })),
    }),
    {
      name: "auth-storage", // localStorage 키 이름
    }
  )
);

// 알림 상태 관리
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  setNotifications: (notifications: Notification[]) => void;
  setUnreadCount: (count: number) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  clearNotifications: () => set({ notifications: [], unreadCount: 0 }),
}));
