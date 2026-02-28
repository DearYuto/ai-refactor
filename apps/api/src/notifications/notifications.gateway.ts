import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '../common/logger/logger.service';
import { NotificationsService } from './notifications.service';
import type { Notification } from '@repo/database';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private userSockets = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // JWT 토큰 검증
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;

      // 사용자 소켓 매핑
      this.userSockets.set(userId, client.id);
      client.data.userId = userId;

      this.logger.log(
        `WebSocket 연결: ${userId} (${client.id})`,
        'NotificationsGateway',
      );

      // 읽지 않은 알림 수 전송
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      client.emit('unreadCount', unreadCount);
    } catch (error) {
      this.logger.error(
        `WebSocket 인증 실패: ${error.message}`,
        'NotificationsGateway',
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId) {
      this.userSockets.delete(userId);
      this.logger.log(
        `WebSocket 연결 해제: ${userId} (${client.id})`,
        'NotificationsGateway',
      );
    }
  }

  @SubscribeMessage('getNotifications')
  async handleGetNotifications(client: Socket): Promise<{ event: string; data: Notification[] }> {
    const userId = client.data.userId;
    const notifications = await this.notificationsService.getNotifications(userId);
    return { event: 'notifications', data: notifications };
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, notificationId: string) {
    const userId = client.data.userId;
    await this.notificationsService.markAsRead(notificationId, userId);

    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    client.emit('unreadCount', unreadCount);

    return { event: 'marked', data: { notificationId } };
  }

  @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(client: Socket) {
    const userId = client.data.userId;
    await this.notificationsService.markAllAsRead(userId);

    client.emit('unreadCount', 0);

    return { event: 'allMarked', data: true };
  }

  // 특정 사용자에게 알림 전송
  sendToUser(userId: string, notification: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.server.to(socketId).emit('newNotification', notification);
      this.logger.log(
        `알림 전송: ${userId} - ${notification.type}`,
        'NotificationsGateway',
      );
    }
  }
}
