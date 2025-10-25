import { Module } from '@nestjs/common';
import { VehicleModule } from './vehicle/vehicle.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    VehicleModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver, 
      autoSchemaFile: join(process.cwd(), 'src/graphql-schema.gql'), 
      playground: true, 
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'root',
      database: 'vehicle',
      entities: [__dirname + '/**/*.entity{.ts,.js}'], 
      synchronize: true,
    }),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
