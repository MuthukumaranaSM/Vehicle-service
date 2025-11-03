import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity'; 
import { VehicleResolver } from './vehicle.resolver';
import { VehicleService } from './vehicle.service';
import { BatchModule } from '../batch/batch.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle]),
    forwardRef(() => BatchModule),
  ],
  controllers: [],
  providers: [
    VehicleResolver, 
    VehicleService,
  ],
  exports: [VehicleService] 
})
export class VehicleModule {}
