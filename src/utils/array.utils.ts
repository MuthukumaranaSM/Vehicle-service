import { ProcessedVehicleDTO } from '../dto/processed-vehicle.dto';

export function chunkArray(array: ProcessedVehicleDTO[], chunkSize: number): ProcessedVehicleDTO[][] {
  const result: ProcessedVehicleDTO[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}