import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  
  private static readonly CACHE_TTL_MS = 1800 * 1000; 
  
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async saveExportFile(jobId: string, csvData: string): Promise<void> {
    const key = `export:${jobId}`;
    
    try {
      
      await this.cacheManager.set(key, csvData, CacheService.CACHE_TTL_MS);
      this.logger.log(`[CacheService]  Successfully saved to Redis: ${key}`);
      
      
      const verification = await this.cacheManager.get(key);
      if (verification) {
        this.logger.log(`[CacheService]  Verified: Key exists in Redis (size: ${csvData.length} bytes)`);
      } else {
        this.logger.error(`[CacheService]  WARNING: Key was set but immediate read returned null!`);
      }
    } catch (error) {
      this.logger.error(`[CacheService]  Failed to save to Redis: ${error.message}`);
      throw error;
    }
  }

  
  async getExportFile(jobId: string): Promise<string | null> {
    const key = `export:${jobId}`;
    
    try {
      const data = await this.cacheManager.get<string>(key);
      
      if (data) {
        this.logger.log(`[CacheService]  Found export file for jobId: ${jobId} (size: ${data.length} bytes)`);
      } else {
        this.logger.warn(`[CacheService] Export file not found for jobId: ${jobId}`);
      }
      
      return data || null;
    } catch (error) {
      this.logger.error(`[CacheService]  Error retrieving export file: ${error.message}`);
      return null;
    }
  }
}