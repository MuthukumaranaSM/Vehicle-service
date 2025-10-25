import { Field, InputType, ID, Int } from '@nestjs/graphql';

@InputType({ description: 'Data required to create a new vehicle/member record.' })
export class UpdateVehicleInput {
  id(id: any, updateVehicleInput: UpdateVehicleInput) {
    throw new Error('Method not implemented.');
  }
  @Field()
  first_name: string;

  @Field()
  last_name: string;

  @Field()
  email: string;

  @Field()
  car_make: string;

  @Field()
  car_model: string;

  @Field()
  vin: string;

  @Field()
  manufactured_date: Date;
  
  @Field(() => Int, { nullable: true })
  age_of_vehicle?: number; 
}
