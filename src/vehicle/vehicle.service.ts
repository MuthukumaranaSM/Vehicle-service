import { Injectable } from '@nestjs/common';
import { CreateVehicleInput } from './dto/create-vehicle.input';
import { UpdateVehicleInput } from './dto/update-vehicle.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle) private vehicleRepository: Repository<Vehicle>,
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

  async update(updateVehicleInput: UpdateVehicleInput): Promise<Vehicle | null> { 
  
    const vehicle = await this.vehicleRepository.preload({
      ...updateVehicleInput, 
    });

    if (!vehicle) {
      return null;
    }

    return this.vehicleRepository.save(vehicle);
  }

  async remove(id: number): Promise<Vehicle | null> {

    const vehicleToRemove = await this.vehicleRepository.findOneBy({ id });

    if (!vehicleToRemove) {
      return null;
    }

    await this.vehicleRepository.remove(vehicleToRemove);
    return vehicleToRemove;
  }
}
