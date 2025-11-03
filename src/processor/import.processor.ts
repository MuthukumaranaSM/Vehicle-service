import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import csv from 'csv-parser'; 
import { Stream } from 'stream'; 
import { lastValueFrom } from 'rxjs'; 
import { VehicleService } from '../vehicle/vehicle.service'; 
import { ProcessedVehicleDTO } from '../dto/processed-vehicle.dto'; 
import { calculateAge } from '../utils/date.utils'; 
import { NotificationService } from '../websocket/notification.service'; 


@Injectable()
@Processor('vehicle-import') 
export class ImportProcessor extends WorkerHost {
  private readonly logger = new Logger(ImportProcessor.name);
  
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly notificationService: NotificationService, 
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const currentJobId = job.id ? job.id.toString() : 'UNKNOWN_JOB';
    this.logger.log(`[Worker] Starting Import Job: ${currentJobId}`);
    
    const { fileData } = job.data; 
    const processedRecords: ProcessedVehicleDTO[] = [];
    
    //prevent duplicates
    const seenVINs = new Set<string>();
    let duplicateCount = 0;
    
    const bufferStream = new Stream.Readable();
    bufferStream.push(fileData);
    bufferStream.push(null); 
    
    try {
        await new Promise<void>((resolve, reject) => {
            bufferStream
              .pipe(csv())
              .on('data', (data) => {
                if (!data.vin || !data.manufactured_date) {
                    this.logger.warn(`Skipping record in job ${currentJobId} due to missing VIN or date.`);
                    return; 
                }
                
                // ✅ FIX: Check for duplicate VIN in current batch
                if (seenVINs.has(data.vin)) {
                    duplicateCount++;
                    this.logger.warn(`Skipping duplicate VIN in job ${currentJobId}: ${data.vin}`);
                    return;
                }
                
                try {
                    const manufacturedDate = new Date(data.manufactured_date);
                    if (isNaN(manufacturedDate.getTime())) {
                        this.logger.warn(`Skipping record in job ${currentJobId} due to invalid date: ${data.manufactured_date}`);
                        return;
                    }

                    const record: ProcessedVehicleDTO = {
                        first_name: data.first_name,
                        last_name: data.last_name,
                        email: data.email,
                        car_make: data.car_make,
                        car_model: data.car_model,
                        vin: data.vin,
                        manufactured_date: manufacturedDate,
                        age_of_vehicle: calculateAge(manufacturedDate), 
                    };
                    
                    // ✅ FIX: Mark VIN as seen and add to batch
                    seenVINs.add(data.vin);
                    processedRecords.push(record);
                } catch (error) {
                    this.logger.error(`Error processing record in job ${currentJobId}: ${error.message}`, data);
                }
              })
              .on('end', () => {
                this.logger.log(`Job ${currentJobId}: Finished parsing. Total valid records: ${processedRecords.length}, Duplicates skipped: ${duplicateCount}`);
                resolve(); 
              })
              .on('error', (err) => {
                this.logger.error(`Job ${currentJobId}: CSV Parsing failed.`, err);
                reject(new Error('CSV_PARSING_FAILED'));
              });
        });
    } catch (e) {
        throw e;
    }
    
    try {
        this.logger.log(`Job ${currentJobId}: Initiating atomic persistence for ${processedRecords.length} records.`);
        
        await this.vehicleService.saveVehiclesInTransaction(processedRecords); 
        
        this.logger.log(`Job ${currentJobId}: ALL ${processedRecords.length} records successfully saved to DB.`);
        
        // ✅ SUCCESS NOTIFICATION with duplicate info
        this.notificationService.notifyJobCompletion({
            jobId: currentJobId,
            type: 'IMPORT',
            status: 'SUCCESS',
            count: processedRecords.length,
            message: `Successfully imported ${processedRecords.length} vehicle records${duplicateCount > 0 ? ` (${duplicateCount} duplicates skipped)` : ''}.`,
            downloadUrl: null 
        });
        
    } catch (error) {
        this.logger.error(`Job ${currentJobId}: FAILED ATOMIC SAVE: ${error.message}`);
        
        // ✅ FAILURE NOTIFICATION
        this.notificationService.notifyJobCompletion({
            jobId: currentJobId,
            type: 'IMPORT',
            status: 'FAILED',
            count: 0,
            message: `Import failed: ${error.message.substring(0, 50)}... Data rolled back.`
        });
        
        throw new Error(`Atomic persistence failed. Job will retry.`);
    }

    this.logger.log(`[Worker] Job ${currentJobId} completed all tasks and saved data.`);
    return { status: 'PERSISTENCE_COMPLETE', recordsSaved: processedRecords.length };
  }
}