import { ObjectType, Field, Directive , ID } from '@nestjs/graphql';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';


@ObjectType()
@Directive('@key(fields: "vin")')
@Entity()
export class Vehicle {
  @Field(()=>ID)
  @PrimaryGeneratedColumn()
  id:number;

  @Field()
  @Column()
  first_name:string;

  @Field()
  @Column()
  last_name:String;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field()
  @Column()
  car_make: string;

  @Field()
  @Column()
  car_model: string;

  @Field()
  @Column({ unique: true })
  vin: string; 

  @Field() 
  @Column()
  manufactured_date: Date;

  @Field()
  @Column({ type: 'int' })
  age_of_vehicle: number;
}
