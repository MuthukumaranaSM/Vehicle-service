import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { VehicleService } from '../vehicle/vehicle.service'; 
import { Vehicle } from '../vehicle/entities/vehicle.entity'; 
import { CacheService } from '../cache/cache.service';
import { NotificationService } from '../websocket/notification.service'; 


@Injectable()
@Processor('vehicle-export') 
export class ExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportProcessor.name);
  
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly cacheService: CacheService,
    private readonly notificationService: NotificationService, 
  ) {
    super();
  }

  
  private convertToCsv(data: Vehicle[]): string {
    if (data.length === 0) return "";

    const headers = [
        "id", "first_name", "last_name", "email", "car_make", "car_model", 
        "vin", "manufactured_date", "age_of_vehicle"
    ];
    
    const rows = data.map(obj => 
      headers.map(header => {
        let value = obj[header];
        if (value instanceof Date) {
            value = value.toISOString().split('T')[0]; 
        }
        
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }


  async process(job: Job<any, any, string>): Promise<any> {
    const currentJobId = job.id ? job.id.toString() : 'UNKNOWN_JOB';
    this.logger.log(`[Worker Check] BullMQ Job ID type: ${typeof job.id}, Value: ${job.id}`);
    
    const { minAge } = job.data; 
    
    try {
        // 1. FETCH DATA FROM DATABASE
        const vehicles = await this.vehicleService.getVehiclesOlderThan(minAge);
        
        if (vehicles.length === 0) {
             this.logger.log(`Job ${currentJobId}: No records found older than ${minAge} years.`);
             
             // ✅ SEND NOTIFICATION: No records found
             this.notificationService.notifyJobCompletion({
                 jobId: currentJobId,
                 type: 'EXPORT',
                 status: 'SUCCESS',
                 count: 0,
                 message: `No vehicles found older than ${minAge} years.`,
                 downloadUrl: null
             });
             
             return { status: 'COMPLETE', count: 0, message: 'No matching records found.' };
        }

        // 2. CONVERT TO CSV
        const csvContent = this.convertToCsv(vehicles);

        // 3. SAVE TO REDIS CACHE
        await this.cacheService.saveExportFile(currentJobId, csvContent);
        this.logger.log(`Job ${currentJobId}: CSV content saved to Redis Cache.`);

        // ✅ 4. SEND SUCCESS NOTIFICATION WITH DOWNLOAD URL
        this.notificationService.notifyJobCompletion({
            jobId: currentJobId,
            type: 'EXPORT',
            status: 'SUCCESS',
            count: vehicles.length,
            message: `Successfully exported ${vehicles.length} vehicle records.`,
            downloadUrl: `http://localhost:3001/batch/download/${currentJobId}` // ✅ Include download URL
        });

        return { status: 'COMPLETE', count: vehicles.length, fileData: csvContent };

    } catch (error) {
        this.logger.error(`Job ${currentJobId}: Export failed for criteria (Age > ${minAge}): ${error.message}`);
        
        // ✅ 5. SEND FAILURE NOTIFICATION
        this.notificationService.notifyJobCompletion({
            jobId: currentJobId,
            type: 'EXPORT',
            status: 'FAILED',
            count: 0,
            message: `Export failed: ${error.message.substring(0, 100)}`,
            downloadUrl: null
        });
        
        throw error;
    }
  }
}