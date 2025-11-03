import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm'; 
import { Vehicle } from './entities/vehicle.entity'; 
import { UpdateVehicleInput } from './dto/update-vehicle.input';
import { CreateVehicleInput } from './dto/create-vehicle.input';
import { ProcessedVehicleDTO } from '../dto/processed-vehicle.dto';
import { PaginatedVehicles, PaginationInput } from '../dto/pagination.dto';

@Injectable()
export class VehicleService {
  private readonly logger = new Logger(VehicleService.name);

  constructor(
    @InjectRepository(Vehicle) private vehicleRepository: Repository<Vehicle>,
    private dataSource: DataSource, 
  ) {}

  
  async create(vehicleInput: CreateVehicleInput): Promise<Vehicle> {
    const newVehicle = this.vehicleRepository.create(vehicleInput);
    return this.vehicleRepository.save(newVehicle);
  }

  async findAll(): Promise<Vehicle[]> {
    return this.vehicleRepository.find();
  }

  async findOne(id: number): Promise<Vehicle | null> {
    return this.vehicleRepository.findOneBy({ id });
  }

  
async update(id: string, updateVehicleInput: UpdateVehicleInput): Promise<Vehicle> {
  if (updateVehicleInput.manufactured_date) {
    updateVehicleInput.age_of_vehicle = this.calculateAge(updateVehicleInput.manufactured_date);
  }
  const vehicle = await this.vehicleRepository.preload({
    id: Number(id), 
    ...updateVehicleInput, 
  });

  if (!vehicle) {
    throw new NotFoundException(`Vehicle with ID ${id} not found.`);
  }
  return this.vehicleRepository.save(vehicle);
}

  async remove(id: number): Promise<Vehicle> {
  const vehicle = await this.vehicleRepository.findOneBy({ id });

  if (!vehicle) {
    throw new NotFoundException(`Vehicle with ID ${id} not found`);
  }

  await this.vehicleRepository.delete(id);
  return vehicle; 
}


  async saveVehiclesInTransaction(processedRecords: ProcessedVehicleDTO[]): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();

    
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      this.logger.log(`Starting atomic save transaction for ${processedRecords.length} records.`);
      
      
      const vehiclesToSave = processedRecords.map(record => 
        queryRunner.manager.create(Vehicle, record)
      );
      
      await queryRunner.manager.upsert(
          Vehicle, 
          vehiclesToSave, 
          { 
              conflictPaths: ['vin'], 
              
              upsertType: 'on-conflict-do-update'
          }
      );

      
      await queryRunner.commitTransaction();
      this.logger.log(`Successfully committed atomic save of ${processedRecords.length} records.`);

    } catch (err) {
      
      this.logger.error(`Atomic transaction failed, rolling back all changes: ${err.message}`);
      await queryRunner.rollbackTransaction();
      
      
      throw err; 

    } finally {
     
      await queryRunner.release();
    }
  }

  async findPaginated(input: PaginationInput): Promise<PaginatedVehicles> {
    const { page, limit } = input;
    const skip = (page - 1) * limit;

    const query = this.vehicleRepository.createQueryBuilder('vehicle');
    const totalItems = await query.getCount();

    query.orderBy('vehicle.manufactured_date', 'ASC');
    query.skip(skip);
    query.take(limit);

    const items = await query.getMany();
    
    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      pageInfo: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  async searchVehicles(query: string, input: PaginationInput): Promise<PaginatedVehicles> {
    const { page, limit } = input;
    const skip = (page - 1) * limit;

    const searchPattern = query.replace(/\*/g, '%');

    const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle');

    queryBuilder.where("vehicle.car_model ILIKE :pattern", { pattern: searchPattern });

    const totalItems = await queryBuilder.getCount();

    queryBuilder.orderBy('vehicle.manufactured_date', 'ASC');
    queryBuilder.skip(skip);
    queryBuilder.take(limit);

    const items = await queryBuilder.getMany();

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items,
      pageInfo: {
        totalItems,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  async getVehiclesOlderThan(minAge: number): Promise<Vehicle[]> {
    if (minAge < 0) {
      throw new Error("Minimum age criteria must be non-negative.");
    }
    
    const queryBuilder = this.vehicleRepository.createQueryBuilder('vehicle');
    
    queryBuilder.where("vehicle.age_of_vehicle > :minAge", { minAge });

    this.logger.log(`Executing export query for vehicles older than ${minAge} years.`);
    
    return queryBuilder.getMany();
  }

  
  private calculateAge(manufacturedDate: Date | string): number {
    const date = new Date(manufacturedDate);
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const monthDifference = today.getMonth() - date.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < date.getDate())) {
      age--;
    }
    return age;
  }

   async findByVin(vin: string): Promise<Vehicle> {
    const vehicle = await this.vehicleRepository.findOneBy({ vin });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with VIN "${vin}" not found.`);
    }
    return vehicle;
  } 
}
