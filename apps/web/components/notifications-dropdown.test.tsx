import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NotificationsDropdown } from './notifications-dropdown';

// Mock stores
const mockUseAuthStore = vi.fn();
const mockUseNotificationStore = vi.fn();

vi.mock('@/lib/store', () => ({
  useAuthStore: (selector: any) => mockUseAuthStore(selector),
  useNotificationStore: (selector: any) => mockUseNotificationStore(selector),
}));

// Mock API
vi.mock('@/lib/api/notifications.api', () => ({
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
}));

// Mock socket
const mockSocket = {
  emit: vi.fn(),
};

vi.mock('@/lib/socket', () => ({
  getSocket: vi.fn(() => mockSocket),
}));

describe('NotificationsDropdown (알림 드롭다운)', () => {
  const mockNotifications = [
    {
      id: 'notif-1',
      title: '주문 체결',
      message: '매수 주문이 체결되었습니다',
      read: false,
      createdAt: new Date('2024-03-01T10:00:00Z').toISOString(),
    },
    {
      id: 'notif-2',
      title: '입금 완료',
      message: '1.5 BTC 입금이 완료되었습니다',
      read: true,
      createdAt: new Date('2024-03-01T09:00:00Z').toISOString(),
    },
    {
      id: 'notif-3',
      title: '출금 요청',
      message: '출금 요청이 제출되었습니다',
      read: false,
      createdAt: new Date('2024-03-01T08:00:00Z').toISOString(),
    },
  ];

  const mockMarkNotificationAsRead = vi.fn();
  const mockSetUnreadCount = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAuthStore.mockImplementation((selector) =>
      selector({ token: 'mock-token' })
    );

    mockUseNotificationStore.mockImplementation((selector) =>
      selector({
        notifications: mockNotifications,
        unreadCount: 2,
        markNotificationAsRead: mockMarkNotificationAsRead,
        setUnreadCount: mockSetUnreadCount,
      })
    );
  });

  describe('드롭다운 UI', () => {
    it('알림 벨 아이콘이 표시되어야 합니다', () => {
      // Act
      render(<NotificationsDropdown />);

      // Assert
      const bellButton = screen.getByRole('button');
      expect(bellButton).toBeInTheDocument();
    });

    it('읽지 않은 알림 개수 뱃지가 표시되어야 합니다', () => {
      // Act
      render(<NotificationsDropdown />);

      // Assert
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('읽지 않은 알림이 없으면 뱃지가 표시되지 않아야 합니다', () => {
      // Arrange
      mockUseNotificationStore.mockImplementation((selector) =>
        selector({
          notifications: [],
          unreadCount: 0,
          markNotificationAsRead: mockMarkNotificationAsRead,
          setUnreadCount: mockSetUnreadCount,
        })
      );

      // Act
      render(<NotificationsDropdown />);

      // Assert
      expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('읽지 않은 알림이 99개를 초과하면 "99+"로 표시해야 합니다', () => {
      // Arrange
      mockUseNotificationStore.mockImplementation((selector) =>
        selector({
          notifications: [],
          unreadCount: 150,
          markNotificationAsRead: mockMarkNotificationAsRead,
          setUnreadCount: mockSetUnreadCount,
        })
      );

      // Act
      render(<NotificationsDropdown />);

      // Assert
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('벨 아이콘 클릭 시 드롭다운이 열려야 합니다', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      // Act
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Assert
      expect(screen.getByText('알림')).toBeInTheDocument();
    });

    it('드롭다운이 열린 상태에서 다시 클릭하면 닫혀야 합니다', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      // Act
      const bellButton = screen.getByRole('button');
      await user.click(bellButton); // 열기
      expect(screen.getByText('알림')).toBeInTheDocument();

      await user.click(bellButton); // 닫기

      // Assert
      expect(screen.queryByText('알림')).not.toBeInTheDocument();
    });
  });

  describe('알림 목록', () => {
    it('알림이 없을 때 빈 상태 메시지를 표시해야 합니다', async () => {
      // Arrange
      mockUseNotificationStore.mockImplementation((selector) =>
        selector({
          notifications: [],
          unreadCount: 0,
          markNotificationAsRead: mockMarkNotificationAsRead,
          setUnreadCount: mockSetUnreadCount,
        })
      );

      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      // Act
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Assert
      expect(screen.getByText('알림이 없습니다')).toBeInTheDocument();
    });

    it('모든 알림이 목록에 표시되어야 합니다', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      // Act
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Assert
      expect(screen.getByText('주문 체결')).toBeInTheDocument();
      expect(screen.getByText('입금 완료')).toBeInTheDocument();
      expect(screen.getByText('출금 요청')).toBeInTheDocument();
    });

    it('읽지 않은 알림은 파란색 배경으로 표시되어야 합니다', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      // Act
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Assert
      const unreadNotif = screen.getByText('주문 체결').closest('div');
      expect(unreadNotif).toHaveClass('bg-blue-50');
    });

    it('읽지 않은 알림에는 파란색 점이 표시되어야 합니다', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      // Act
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Assert
      const blueDots = document.querySelectorAll('.bg-blue-500.rounded-full');
      expect(blueDots.length).toBe(2); // 읽지 않은 알림 2개
    });

    it('알림 생성 시간이 한국어 형식으로 표시되어야 합니다', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      // Act
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Assert
      // toLocaleString('ko-KR') 형식으로 표시됨
      const timestamps = screen.getAllByText(/2024/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe('개별 알림 읽음 처리', () => {
    it('읽지 않은 알림 클릭 시 읽음으로 표시해야 합니다', async () => {
      // Arrange
      const { markAsRead } = await import('@/lib/api/notifications.api');
      vi.mocked(markAsRead).mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Act
      const unreadNotification = screen.getByText('주문 체결');
      await user.click(unreadNotification);

      // Assert
      await waitFor(() => {
        expect(markAsRead).toHaveBeenCalledWith('mock-token', 'notif-1');
        expect(mockMarkNotificationAsRead).toHaveBeenCalledWith('notif-1');
      });
    });

    it('읽음 처리 시 WebSocket으로 알림을 전송해야 합니다', async () => {
      // Arrange
      const { markAsRead } = await import('@/lib/api/notifications.api');
      vi.mocked(markAsRead).mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Act
      const unreadNotification = screen.getByText('주문 체결');
      await user.click(unreadNotification);

      // Assert
      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('markAsRead', 'notif-1');
      });
    });

    it('이미 읽은 알림 클릭 시 아무 동작도 하지 않아야 합니다', async () => {
      // Arrange
      const { markAsRead } = await import('@/lib/api/notifications.api');
      vi.mocked(markAsRead).mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Act
      const readNotification = screen.getByText('입금 완료');
      await user.click(readNotification);

      // Assert
      expect(markAsRead).not.toHaveBeenCalled();
      expect(mockMarkNotificationAsRead).not.toHaveBeenCalled();
    });

    it('읽음 처리 실패 시 콘솔 에러를 출력해야 합니다', async () => {
      // Arrange
      const { markAsRead } = await import('@/lib/api/notifications.api');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(markAsRead).mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Act
      const unreadNotification = screen.getByText('주문 체결');
      await user.click(unreadNotification);

      // Assert
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to mark as read:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('모두 읽음으로 표시', () => {
    it('읽지 않은 알림이 있을 때 "모두 읽음으로 표시" 버튼이 표시되어야 합니다', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      // Act
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Assert
      expect(screen.getByText('모두 읽음으로 표시')).toBeInTheDocument();
    });

    it('읽지 않은 알림이 없을 때 "모두 읽음으로 표시" 버튼이 표시되지 않아야 합니다', async () => {
      // Arrange
      mockUseNotificationStore.mockImplementation((selector) =>
        selector({
          notifications: [],
          unreadCount: 0,
          markNotificationAsRead: mockMarkNotificationAsRead,
          setUnreadCount: mockSetUnreadCount,
        })
      );

      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      // Act
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Assert
      expect(screen.queryByText('모두 읽음으로 표시')).not.toBeInTheDocument();
    });

    it('"모두 읽음으로 표시" 버튼 클릭 시 API를 호출해야 합니다', async () => {
      // Arrange
      const { markAllAsRead } = await import('@/lib/api/notifications.api');
      vi.mocked(markAllAsRead).mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Act
      const markAllButton = screen.getByText('모두 읽음으로 표시');
      await user.click(markAllButton);

      // Assert
      await waitFor(() => {
        expect(markAllAsRead).toHaveBeenCalledWith('mock-token');
        expect(mockSetUnreadCount).toHaveBeenCalledWith(0);
      });
    });

    it('모두 읽음 처리 시 WebSocket으로 알림을 전송해야 합니다', async () => {
      // Arrange
      const { markAllAsRead } = await import('@/lib/api/notifications.api');
      vi.mocked(markAllAsRead).mockResolvedValue(undefined);

      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Act
      const markAllButton = screen.getByText('모두 읽음으로 표시');
      await user.click(markAllButton);

      // Assert
      await waitFor(() => {
        expect(mockSocket.emit).toHaveBeenCalledWith('markAllAsRead');
      });
    });

    it('모두 읽음 처리 실패 시 콘솔 에러를 출력해야 합니다', async () => {
      // Arrange
      const { markAllAsRead } = await import('@/lib/api/notifications.api');
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(markAllAsRead).mockRejectedValue(new Error('Network error'));

      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Act
      const markAllButton = screen.getByText('모두 읽음으로 표시');
      await user.click(markAllButton);

      // Assert
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to mark all as read:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('인증되지 않은 상태', () => {
    it('토큰이 없을 때 읽음 처리를 하지 않아야 합니다', async () => {
      // Arrange
      mockUseAuthStore.mockImplementation((selector) =>
        selector({ token: null })
      );

      const { markAsRead } = await import('@/lib/api/notifications.api');
      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Act
      const unreadNotification = screen.getByText('주문 체결');
      await user.click(unreadNotification);

      // Assert
      expect(markAsRead).not.toHaveBeenCalled();
    });

    it('토큰이 없을 때 모두 읽음 처리를 하지 않아야 합니다', async () => {
      // Arrange
      mockUseAuthStore.mockImplementation((selector) =>
        selector({ token: null })
      );

      const { markAllAsRead } = await import('@/lib/api/notifications.api');
      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Act
      const markAllButton = screen.getByText('모두 읽음으로 표시');
      await user.click(markAllButton);

      // Assert
      expect(markAllAsRead).not.toHaveBeenCalled();
    });
  });

  describe('스타일링', () => {
    it('드롭다운이 올바른 위치에 표시되어야 합니다', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      // Act
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Assert
      const dropdown = screen.getByText('알림').closest('div');
      expect(dropdown).toHaveClass('absolute', 'right-0', 'mt-2');
    });

    it('드롭다운의 최대 높이가 설정되어야 합니다', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      // Act
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Assert
      const notificationList = document.querySelector('.max-h-96');
      expect(notificationList).toBeInTheDocument();
      expect(notificationList).toHaveClass('overflow-y-auto');
    });

    it('알림 항목에 호버 효과가 있어야 합니다', async () => {
      // Arrange
      const user = userEvent.setup();
      render(<NotificationsDropdown />);

      // Act
      const bellButton = screen.getByRole('button');
      await user.click(bellButton);

      // Assert
      const notification = screen.getByText('주문 체결').closest('div');
      expect(notification).toHaveClass('hover:bg-gray-50');
    });
  });
});
