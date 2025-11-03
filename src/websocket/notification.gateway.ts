import { Logger } from '@nestjs/common';
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayInit } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Use a dedicated namespace and allow CORS from the frontend development server
@WebSocketGateway({ 
    cors: { origin: '*' },
    namespace: 'notifications', 
})
export class NotificationGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(NotificationGateway.name);

  // CRITICAL: This property holds the Socket.IO server instance
  @WebSocketServer() 
  public server: Server; 

  afterInit(server: Server) {
    this.logger.log('Notification Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected for notifications: ${client.id}`);
  }

  /**
   * Public method to send a job completion notification to all connected clients.
   * This is called by the NotificationService (C.5.3).
   */
  public sendNotification(payload: { jobId: string, type: string, status: string, count: number, message: string }): void {
    // Emit the notification event to all clients in the 'notifications' namespace
    this.server.emit('jobComplete', payload);
    this.logger.log(`Broadcasted job completion: ${payload.jobId} (${payload.type})`);
  }
}
