import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' } })
export class TaskGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) return client.disconnect();

      const payload = this.jwtService.verify(token as string);
      client.data.userId = payload.sub;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect() {}

  emitTaskCreated(data: { id: string; title: string; status: string; userId: string; createdAt: Date; updatedAt: Date }) {
    this.server.emit('task.created', {
      id: data.id,
      title: data.title,
      status: data.status,
      userId: data.userId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      timestamp: new Date().toISOString(),
    });
  }

  emitTaskUpdated(data: { id: string; title: string; status: string; userId: string; createdAt: Date; updatedAt: Date }) {
    this.server.emit('task.updated', {
      id: data.id,
      title: data.title,
      status: data.status,
      userId: data.userId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      timestamp: new Date().toISOString(),
    });
  }

  emitTaskDeleted(data: { id: string; userId: string }) {
    this.server.emit('task.deleted', {
      id: data.id,
      userId: data.userId,
      timestamp: new Date().toISOString(),
    });
  }
}
