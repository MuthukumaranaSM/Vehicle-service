import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class BatchService {
  private readonly logger = new Logger(BatchService.name);

  constructor(
    @InjectQueue('vehicle-import') private readonly importQueue: Queue, 
    @InjectQueue('vehicle-export') private readonly exportQueue: Queue,
    private readonly cacheService: CacheService, 
  ) {}

  async enqueueImportJob(csvContent: string): Promise<{ jobId: string, message: string }> {
    
    const job = await this.importQueue.add(
      'import-vehicle-data', 
      { 
        fileData: csvContent, 
        submittedAt: new Date().toISOString()
      },
      { 
        attempts: 3, 
        backoff: { type: 'exponential', delay: 5000 }, 
      }
    );
    
   
    const currentJobId = job.id ? job.id.toString() : 'UNKNOWN_ID';
    
    this.logger.log(`Import job ${currentJobId} added to queue: vehicle-import`);
    
    return { 
        jobId: currentJobId, 
        message: 'File received and import job successfully queued. Check back later for completion notification.' 
    };
  }

  async triggerExportJob(minAge: number): Promise<{ jobId: string, message: string }> {
      const job = await this.exportQueue.add(
          'export-vehicles-by-age',
          { minAge: minAge },
          { attempts: 1 } 
      );
      

      const currentJobId = job.id ? job.id.toString() : 'UNKNOWN_ID';

      this.logger.log(`Export job ${currentJobId} added to queue: vehicle-export (Criteria: Age > ${minAge})`);
      
      return { 
          jobId: currentJobId,
          message: `Export job successfully queued. Notification will be sent upon completion.`
      };
  }

  async getExportFileContent(jobId: string): Promise<string | null> {
    return this.cacheService.getExportFile(jobId);
  }
}
