import { Resolver, Query, Mutation, Args, Int, ID, ResolveReference } from '@nestjs/graphql';
import { VehicleService } from './vehicle.service';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleInput } from './dto/create-vehicle.input';
import { UpdateVehicleInput } from './dto/update-vehicle.input';
import { PaginationInput, PaginatedVehicles } from '../dto/pagination.dto';
import { BatchService } from '../batch/batch.service';
import { ExportJobResponse } from '../batch/dto/export-job-response.dto';

@Resolver(() => Vehicle)
export class VehicleResolver {
  constructor(
    private readonly vehicleService: VehicleService,
    private readonly batchService: BatchService,
  ) {}

  @Query(() => PaginatedVehicles, { name: 'listVehicles', description: 'Lists vehicles with server-side pagination and sorting.' })
  listVehicles(
    @Args('paginationInput') paginationInput: PaginationInput,
  ): Promise<PaginatedVehicles> {
    return this.vehicleService.findPaginated(paginationInput);
  }

  @Query(() => PaginatedVehicles, { name: 'searchVehicles', description: 'Searches car models using wildcards (e.g., M* for models starting with M).' })
  searchVehicles(
    @Args('query', { type: () => String, description: 'Search term for car model (use * for wildcard)' }) query: string,
    @Args('paginationInput') paginationInput: PaginationInput,
  ): Promise<PaginatedVehicles> {
    return this.vehicleService.searchVehicles(query, paginationInput);
  }

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

@Mutation(() => Vehicle, { name: "updateeVehicle" })
updateeVehicle(
  @Args('id') id: string,
  @Args('updateVehicleInput') updateVehicleInput: UpdateVehicleInput
) {
  return this.vehicleService.update(id, updateVehicleInput);
}

 @Mutation(() => Vehicle, { name: "removeVehicle", nullable: true })
removeVehicle(@Args('id', { type: () => Int }) id: number) {
  return this.vehicleService.remove(id);
}


@Mutation(() => ExportJobResponse, { name: 'triggerExport' })
  async triggerExport(
      @Args('minAge', { type: () => Int, description: 'Minimum age of vehicles (in years) to export.' }) minAge: number,
  ): Promise<ExportJobResponse> {
      return this.batchService.triggerExportJob(minAge);
  }

  @Query(() => Vehicle, { name: 'vehicleByVin', nullable: true })
  findByVin(@Args('vin', { type: () => String }) vin: string) {
    return this.vehicleService.findByVin(vin);
  }

  @ResolveReference()
  resolveReference(reference: { __typename: string; vin: string }): Promise<Vehicle> {
    return this.vehicleService.findByVin(reference.vin);
  }
  
}
