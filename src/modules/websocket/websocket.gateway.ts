import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@NestWebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
@UseGuards(JwtAuthGuard)
export class WebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // socketId -> userId

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.connectedUsers.delete(client.id);
  }

  @SubscribeMessage('join-worksheet')
  handleJoinWorksheet(client: Socket, worksheetId: string) {
    client.join(`worksheet-${worksheetId}`);
  }

  @SubscribeMessage('leave-worksheet')
  handleLeaveWorksheet(client: Socket, worksheetId: string) {
    client.leave(`worksheet-${worksheetId}`);
  }

  // Broadcast worksheet updates
  broadcastWorksheetUpdate(worksheetId: string, data: any) {
    this.server.to(`worksheet-${worksheetId}`).emit('worksheet-updated', data);
  }

  // Broadcast factory dashboard updates
  broadcastFactoryUpdate(factoryId: string, data: any) {
    this.server.to(`factory-${factoryId}`).emit('factory-updated', data);
  }
}
