import { InputType, Int, Field, ID } from '@nestjs/graphql';
import { PrimaryGeneratedColumn } from 'typeorm';

@InputType()
export class CreateVehicleInput {
  
    @Field()
    first_name:string;
  
    @Field()
    last_name:String;
  
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

    @Field()
    age_of_vehicle: number;
  
  }
  
