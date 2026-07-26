import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { TaskCreatedEvent, TaskDeletedEvent, TaskUpdatedEvent } from './task-events';

@WebSocketGateway({ cors: { origin: '*' } })
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit() {
    await this.redis.subscribe<TaskCreatedEvent>('task.created', (event) => {
      this.server.to(`user:${event.userId}`).emit('task.created', event);
    });

    await this.redis.subscribe<TaskUpdatedEvent>('task.updated', (event) => {
      this.server.to(`user:${event.userId}`).emit('task.updated', event);
    });

    await this.redis.subscribe<TaskDeletedEvent>('task.deleted', (event) => {
      this.server.to(`user:${event.userId}`).emit('task.deleted', event);
    });
  }

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) return client.disconnect();

      const payload = this.jwtService.verify(token as string);
      client.data.userId = payload.sub;
      client.join(`user:${payload.sub}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect() {}
}
