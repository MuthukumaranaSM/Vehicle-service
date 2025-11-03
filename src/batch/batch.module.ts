import { Module,forwardRef } from '@nestjs/common';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { BullModule } from '@nestjs/bullmq';
//import { AppCacheModule } from '../cache/cache.module';
import { ExportProcessor } from '../processor/export.processor';
import { ImportProcessor } from '../processor/import.processor'; 
import { VehicleModule } from '../vehicle/vehicle.module';
import { WebSocketModule } from '../websocket/websocket.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'vehicle-import' }), 

    BullModule.registerQueue({ name: 'vehicle-export' }), 
    
    //AppCacheModule,
    forwardRef(() => VehicleModule), 
    WebSocketModule,
  ],
  controllers: [BatchController],
  providers: [BatchService,ExportProcessor,ImportProcessor],
  exports: [BatchService], 
})
export class BatchModule {}
