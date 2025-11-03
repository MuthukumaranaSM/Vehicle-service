import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {ApolloFederationDriver, ApolloFederationDriverConfig,} from '@nestjs/apollo';
import { join } from 'path';
import { BullModule } from '@nestjs/bullmq';
import { HttpModule } from '@nestjs/axios';
import { VehicleModule } from './vehicle/vehicle.module';
import { BatchModule } from './batch/batch.module';
import { ImportProcessor } from './processor/import.processor';
import { AppCacheModule } from './cache/cache.module';
import { WebSocketModule } from './websocket/websocket.module';
import { Vehicle } from './vehicle/entities/vehicle.entity';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),

        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host: config.get<string>('DB_HOST') || 'localhost',
                port: config.get<number>('DB_PORT') || 5432,
                username: config.get<string>('DB_USER') || 'postgres',
                password: config.get<string>('DB_PASSWORD') || 'root',
                database: config.get<string>('DB_DATABASE') || 'vehicle_db',
                entities: [join(__dirname, '**', '*.entity{.ts,.js}')],
                synchronize: true,
            }),
        }),

        BullModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.get<string>('REDIS_HOST') || 'localhost',
                    port: config.get<number>('REDIS_PORT') || 6379,
                },
            }),
        }),

        BullModule.registerQueue({ name: 'vehicle-import' }),
        BullModule.registerQueue({ name: 'vehicle-export' }),
        HttpModule,

        // GraphQLModule.forRoot<ApolloFederationDriverConfig>({
        //     driver: ApolloFederationDriver,
        //     autoSchemaFile: {
        //         path: join(process.cwd(), 'src/graphql-schema.gql'),
        //         federation: 2,
        //     },
        //     playground: true,
        // }),

         GraphQLModule.forRoot<ApolloFederationDriverConfig>({
         driver: ApolloFederationDriver,
         autoSchemaFile: { federation: 2 },
         }),

        VehicleModule,
        BatchModule,
        AppCacheModule,
        WebSocketModule,
    ],
    providers: [ImportProcessor],
})
export class AppModule { }