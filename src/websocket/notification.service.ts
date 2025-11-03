import { Injectable } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
    constructor(
        // Inject the Gateway instance
        private readonly notificationGateway: NotificationGateway
    ) {}

    /**
     * Public method to be called by the ImportProcessor or ExportProcessor.
     * Triggers the broadcast to the Angular UI.
     */
    public notifyJobCompletion(payload: any): void {
        this.notificationGateway.sendNotification(payload);
    }
}
