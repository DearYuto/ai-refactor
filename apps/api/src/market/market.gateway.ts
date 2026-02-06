import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  type OnGatewayConnection,
  type OnGatewayDisconnect,
} from '@nestjs/websockets';
import { type Namespace, Socket } from 'socket.io';
import type { Adapter, Room, SocketId } from 'socket.io-adapter';
import { MarketStreamService } from './market.stream.service';

type MarketSource = 'BINANCE' | 'UPBIT';

const MARKET_SOURCES: MarketSource[] = ['BINANCE', 'UPBIT'];

@WebSocketGateway({
  namespace: '/market',
  cors: { origin: 'http://localhost:3000' },
})
export class MarketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server!: Namespace;

  private readonly clientSources = new Map<string, MarketSource>();
  private readonly intervals = new Map<MarketSource, NodeJS.Timeout>();
  private readonly intervalMs = 2000;

  constructor(private readonly streamService: MarketStreamService) {}

  handleConnection(client: Socket) {
    const source: MarketSource = 'BINANCE';
    void client.join(source);
    this.clientSources.set(client.id, source);
    this.syncIntervals();
  }

  handleDisconnect(client: Socket) {
    const source = this.clientSources.get(client.id);
    if (source) {
      void client.leave(source);
      this.clientSources.delete(client.id);
    }
    this.syncIntervals();
  }

  @SubscribeMessage('market:source')
  handleSource(
    @MessageBody() source: MarketSource,
    @ConnectedSocket() client: Socket,
  ) {
    if (!this.isValidSource(source)) {
      return;
    }

    const previous = this.clientSources.get(client.id);
    if (previous === source) {
      return;
    }

    if (previous) {
      void client.leave(previous);
    }

    void client.join(source);
    this.clientSources.set(client.id, source);
    this.syncIntervals();
  }

  private isValidSource(source: MarketSource) {
    return source === 'BINANCE' || source === 'UPBIT';
  }

  private getRoomSize(source: MarketSource) {
    const adapter: Adapter = this.server.adapter;
    const rooms: Map<Room, Set<SocketId>> = adapter.rooms;
    return rooms.get(source)?.size ?? 0;
  }

  private syncIntervals() {
    for (const source of MARKET_SOURCES) {
      const roomSize = this.getRoomSize(source);
      const existing = this.intervals.get(source);

      if (roomSize > 0 && !existing) {
        const handle = setInterval(() => {
          void this.emitUpdate(source);
        }, this.intervalMs);
        this.intervals.set(source, handle);
      }

      if (roomSize === 0 && existing) {
        clearInterval(existing);
        this.intervals.delete(source);
      }
    }
  }

  private async emitUpdate(source: MarketSource) {
    try {
      const snapshot = await this.streamService.getSnapshot(source);
      this.server.to(source).emit('market:update', {
        source,
        ticker: snapshot.ticker,
        orderbook: snapshot.orderbook,
        ts: Date.now(),
      });
    } catch {
      return;
    }
  }
}
