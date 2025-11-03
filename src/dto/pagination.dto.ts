import { Field, Int, ObjectType, InputType } from '@nestjs/graphql';
import { Vehicle } from '../vehicle/entities/vehicle.entity';


@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 1 })
  page: number = 1;

  @Field(() => Int, { defaultValue: 100 })
  limit: number = 100; 
}


@ObjectType()
class PageInfo {
  @Field(() => Int)
  totalItems: number;

  @Field(() => Int)
  totalPages: number;

  @Field(() => Int)
  currentPage: number;

  @Field(() => Int)
  itemsPerPage: number;
}

@ObjectType()
export class PaginatedVehicles {
  @Field(() => [Vehicle])
  items: Vehicle[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;
}
