import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway';
import { LoggerService } from '../common/logger/logger.service';
import { NotificationsService } from './notifications.service';
import { Socket } from 'socket.io';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let jwtService: JwtService;
  let notificationsService: NotificationsService;

  const mockNotification = {
    id: 'notif-123',
    userId: 'user-123',
    type: 'ORDER_FILLED',
    title: '주문 체결 완료',
    message: '매수 주문이 체결되었습니다',
    data: {},
    read: false,
    createdAt: new Date(),
  };

  const mockSocket = {
    id: 'socket-123',
    handshake: {
      auth: {},
      headers: {},
    },
    data: {},
    emit: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as Socket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: NotificationsService,
          useValue: {
            getNotifications: jest.fn(),
            getUnreadCount: jest.fn(),
            markAsRead: jest.fn(),
            markAllAsRead: jest.fn(),
          },
        },
      ],
    }).compile();

    gateway = module.get<NotificationsGateway>(NotificationsGateway);
    jwtService = module.get<JwtService>(JwtService);
    notificationsService =
      module.get<NotificationsService>(NotificationsService);

    // Initialize server mock
    gateway.server = {
      to: jest.fn().mockReturnValue({
        emit: jest.fn(),
      }),
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('유효한 JWT 토큰으로 연결을 허용해야 합니다', async () => {
      // Arrange
      const client = {
        ...mockSocket,
        handshake: {
          auth: { token: 'valid-token' },
          headers: {},
        },
      } as unknown as Socket;
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(notificationsService, 'getUnreadCount').mockResolvedValue(5);

      // Act
      await gateway.handleConnection(client);

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
      expect(client.data.userId).toBe('user-123');
      expect(client.emit).toHaveBeenCalledWith('unreadCount', 5);
    });

    it('Authorization 헤더에서 토큰을 추출할 수 있어야 합니다', async () => {
      // Arrange
      const client = {
        ...mockSocket,
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer valid-token' },
        },
      } as unknown as Socket;
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(notificationsService, 'getUnreadCount').mockResolvedValue(5);

      // Act
      await gateway.handleConnection(client);

      // Assert
      expect(jwtService.verify).toHaveBeenCalledWith('valid-token');
    });

    it('토큰이 없으면 연결을 거부해야 합니다', async () => {
      // Arrange
      const client = {
        ...mockSocket,
        handshake: {
          auth: {},
          headers: {},
        },
      } as unknown as Socket;

      // Act
      await gateway.handleConnection(client);

      // Assert
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('잘못된 토큰으로 연결을 거부해야 합니다', async () => {
      // Arrange
      const client = {
        ...mockSocket,
        handshake: {
          auth: { token: 'invalid-token' },
          headers: {},
        },
      } as unknown as Socket;
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      // Act
      await gateway.handleConnection(client);

      // Assert
      expect(client.disconnect).toHaveBeenCalled();
    });

    it('연결 시 사용자 소켓 매핑을 저장해야 합니다', async () => {
      // Arrange
      const client = {
        ...mockSocket,
        id: 'socket-123',
        handshake: {
          auth: { token: 'valid-token' },
          headers: {},
        },
      } as unknown as Socket;
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(notificationsService, 'getUnreadCount').mockResolvedValue(0);

      // Act
      await gateway.handleConnection(client);

      // Assert
      expect(gateway['userSockets'].get('user-123')).toBe('socket-123');
    });
  });

  describe('handleDisconnect', () => {
    it('연결 해제 시 사용자 소켓 매핑을 삭제해야 합니다', () => {
      // Arrange
      const client = {
        ...mockSocket,
        data: { userId: 'user-123' },
      } as unknown as Socket;
      gateway['userSockets'].set('user-123', 'socket-123');

      // Act
      gateway.handleDisconnect(client);

      // Assert
      expect(gateway['userSockets'].has('user-123')).toBe(false);
    });

    it('userId가 없으면 아무 작업도 하지 않아야 합니다', () => {
      // Arrange
      const client = {
        ...mockSocket,
        data: {},
      } as unknown as Socket;

      // Act
      gateway.handleDisconnect(client);

      // Assert
      // No error should be thrown
      expect(gateway['userSockets'].size).toBe(0);
    });
  });

  describe('handleGetNotifications', () => {
    it('사용자의 알림 목록을 반환해야 합니다', async () => {
      // Arrange
      const client = {
        ...mockSocket,
        data: { userId: 'user-123' },
      } as unknown as Socket;
      const notifications = [mockNotification];
      jest
        .spyOn(notificationsService, 'getNotifications')
        .mockResolvedValue(notifications);

      // Act
      const result = await gateway.handleGetNotifications(client);

      // Assert
      expect(result).toEqual({
        event: 'notifications',
        data: notifications,
      });
      expect(notificationsService.getNotifications).toHaveBeenCalledWith(
        'user-123',
      );
    });
  });

  describe('handleMarkAsRead', () => {
    it('알림을 읽음 처리하고 읽지 않은 개수를 업데이트해야 합니다', async () => {
      // Arrange
      const client = {
        ...mockSocket,
        data: { userId: 'user-123' },
      } as unknown as Socket;
      jest.spyOn(notificationsService, 'markAsRead').mockResolvedValue({
        ...mockNotification,
        read: true,
      });
      jest.spyOn(notificationsService, 'getUnreadCount').mockResolvedValue(4);

      // Act
      const result = await gateway.handleMarkAsRead(client, 'notif-123');

      // Assert
      expect(notificationsService.markAsRead).toHaveBeenCalledWith(
        'notif-123',
        'user-123',
      );
      expect(client.emit).toHaveBeenCalledWith('unreadCount', 4);
      expect(result).toEqual({
        event: 'marked',
        data: { notificationId: 'notif-123' },
      });
    });
  });

  describe('handleMarkAllAsRead', () => {
    it('모든 알림을 읽음 처리하고 읽지 않은 개수를 0으로 업데이트해야 합니다', async () => {
      // Arrange
      const client = {
        ...mockSocket,
        data: { userId: 'user-123' },
      } as unknown as Socket;
      jest
        .spyOn(notificationsService, 'markAllAsRead')
        .mockResolvedValue({ count: 5 });

      // Act
      const result = await gateway.handleMarkAllAsRead(client);

      // Assert
      expect(notificationsService.markAllAsRead).toHaveBeenCalledWith(
        'user-123',
      );
      expect(client.emit).toHaveBeenCalledWith('unreadCount', 0);
      expect(result).toEqual({
        event: 'allMarked',
        data: true,
      });
    });
  });

  describe('sendToUser', () => {
    it('특정 사용자에게 알림을 전송해야 합니다', () => {
      // Arrange
      gateway['userSockets'].set('user-123', 'socket-123');
      const emitSpy = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: emitSpy,
        }),
      } as any;

      // Act
      gateway.sendToUser('user-123', mockNotification);

      // Assert
      expect(gateway.server.to).toHaveBeenCalledWith('socket-123');
      expect(emitSpy).toHaveBeenCalledWith('newNotification', mockNotification);
    });

    it('연결되지 않은 사용자에게는 알림을 전송하지 않아야 합니다', () => {
      // Arrange
      const emitSpy = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: emitSpy,
        }),
      } as any;

      // Act
      gateway.sendToUser('nonexistent-user', mockNotification);

      // Assert
      expect(gateway.server.to).not.toHaveBeenCalled();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('여러 사용자에게 각각 알림을 전송할 수 있어야 합니다', () => {
      // Arrange
      gateway['userSockets'].set('user-1', 'socket-1');
      gateway['userSockets'].set('user-2', 'socket-2');
      const emitSpy = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: emitSpy,
        }),
      } as any;

      // Act
      gateway.sendToUser('user-1', mockNotification);
      gateway.sendToUser('user-2', mockNotification);

      // Assert
      expect(gateway.server.to).toHaveBeenCalledWith('socket-1');
      expect(gateway.server.to).toHaveBeenCalledWith('socket-2');
      expect(emitSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('WebSocket 통합 시나리오', () => {
    it('연결 → 알림 조회 → 읽음 처리 → 연결 해제 시나리오', async () => {
      // 1. 연결
      const client = {
        ...mockSocket,
        id: 'socket-123',
        handshake: {
          auth: { token: 'valid-token' },
          headers: {},
        },
      } as unknown as Socket;
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(notificationsService, 'getUnreadCount').mockResolvedValue(3);

      await gateway.handleConnection(client);
      expect(client.data.userId).toBe('user-123');

      // 2. 알림 조회
      const notifications = [mockNotification];
      jest
        .spyOn(notificationsService, 'getNotifications')
        .mockResolvedValue(notifications);

      const result = await gateway.handleGetNotifications(client);
      expect(result.data).toEqual(notifications);

      // 3. 읽음 처리
      jest.spyOn(notificationsService, 'markAsRead').mockResolvedValue({
        ...mockNotification,
        read: true,
      });
      jest.spyOn(notificationsService, 'getUnreadCount').mockResolvedValue(2);

      await gateway.handleMarkAsRead(client, 'notif-123');
      expect(client.emit).toHaveBeenCalledWith('unreadCount', 2);

      // 4. 연결 해제
      gateway.handleDisconnect(client);
      expect(gateway['userSockets'].has('user-123')).toBe(false);
    });

    it('실시간 알림 수신 시나리오', async () => {
      // 1. 연결
      const client = {
        ...mockSocket,
        id: 'socket-123',
        handshake: {
          auth: { token: 'valid-token' },
          headers: {},
        },
      } as unknown as Socket;
      jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user-123' });
      jest.spyOn(notificationsService, 'getUnreadCount').mockResolvedValue(0);

      await gateway.handleConnection(client);

      // 2. 서버에서 실시간 알림 전송
      const emitSpy = jest.fn();
      gateway.server = {
        to: jest.fn().mockReturnValue({
          emit: emitSpy,
        }),
      } as any;

      gateway.sendToUser('user-123', mockNotification);

      // Assert
      expect(emitSpy).toHaveBeenCalledWith('newNotification', mockNotification);
    });
  });
});
