import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SavePriceService } from './save-price/save-price.service';
import { SavePriceController } from './save-price/save-price.controller';
import { SavePriceModule } from './save-price/save-price.module';
import { QUEUE_TYPE } from './save-price/common/constants';
import { TrackPriceModule } from './track-price/track-price.module';
import { REDIS_CONFIG } from './common/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DB_URL'),
        entities: [join(process.cwd(), 'dist/**/*.entity.js')],
        synchronize: true,
      }),
    }),
    BullModule.forRoot({
      ...REDIS_CONFIG,
      prefix: 'bullmq',
    }),
    BullModule.registerQueue({
      name: QUEUE_TYPE.PRICE_FETCH,
    }),
    SavePriceModule,
    TrackPriceModule,
  ],
  controllers: [AppController, SavePriceController],
  providers: [AppService, SavePriceService],
})
export class AppModule {}
