import { Controller, Post,Get, UseInterceptors, UploadedFile, HttpException, HttpStatus, HttpCode,Param,Res,Logger} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { BatchService } from './batch.service';
import type{ Response } from 'express';

@Controller('batch')
export class BatchController {
  private readonly logger = new Logger(BatchController.name);
  constructor(private readonly batchService: BatchService) {}

  @Post('import')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file')) 
  async importFile(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ jobId: string, message: string }> {
    
    if (!file || !file.buffer) {
      throw new HttpException('No file uploaded or file is empty.', HttpStatus.BAD_REQUEST);
    }
    
    const csvContent = file.buffer.toString('utf8');
    
    return this.batchService.enqueueImportJob(csvContent);
  }

  @Get('download/:jobId')
  async downloadFile(
    @Param('jobId') jobId: string,
    @Res() res: Response, 
  ): Promise<void> {

    this.logger.log(`[Controller Check] Incoming ID type: ${typeof jobId}, Value: ${jobId}`);
    
    const fileData = await this.batchService.getExportFileContent(jobId);

    if (!fileData) {
      throw new HttpException('Export file not found or has expired.', HttpStatus.NOT_FOUND);
    }
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="vehicle_export_${jobId}.csv"`);
    res.setHeader('Content-Length', Buffer.byteLength(fileData, 'utf8'));

    res.send(fileData);
  }
}
