import { Resolver, Query, Mutation, Args, Int, ID } from '@nestjs/graphql';
import { VehicleService } from './vehicle.service';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleInput } from './dto/create-vehicle.input';
import { UpdateVehicleInput } from './dto/update-vehicle.input';

@Resolver(() => Vehicle)
export class VehicleResolver {
  constructor(private readonly vehicleService: VehicleService) {}

  @Mutation(() => Vehicle,{name:"createVehicle"})
  createVehicle(@Args('createVehicleInput') createVehicleInput: CreateVehicleInput) {
    return this.vehicleService.create(createVehicleInput);
  }

  @Query(() => [Vehicle], { name: 'getAllVehicle' })
  findAll() {
    return this.vehicleService.findAll();
  }

  @Query(() => Vehicle, { name: 'getOnevehicle' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.vehicleService.findOne(id);
  }

  @Mutation(() => Vehicle)
  updateVehicle(@Args('updateVehicleInput') updateVehicleInput: UpdateVehicleInput) {
    return this.vehicleService.update(updateVehicleInput);
  }

  @Mutation(() => Vehicle)
  removeVehicle(@Args('id', { type: () => Int }) id: number) {
    return this.vehicleService.remove(id);
  }
}
