import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { redisStore } from 'cache-manager-redis-yet';
import { TrackPriceService } from './track-price.service';
import { TrackPriceController } from './track-price.controller';
import { SavePriceModule } from 'src/save-price/save-price.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { Alert } from './entities/track.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { AlertProcessor } from './alert-process.consumer';
import { QUEUE_TYPE } from 'src/common/constants';
import { ENV_CONFIG, REDIS_CONFIG } from 'src/common/config';
import { ConfigModule, ConfigService } from '@nestjs/config';
const config = new ConfigService();
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([Alert]),
    ScheduleModule.forRoot(),
    SavePriceModule,
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
    }),
    BullModule.forRoot({
      ...REDIS_CONFIG,
      prefix: 'bullmq',
    }),
    BullModule.registerQueue({
      name: QUEUE_TYPE.ALERTS,
    }),
    MailerModule.forRoot({
      transport: {
        service: config.get(ENV_CONFIG.EMAIL_SERVICE),
        host: config.get(ENV_CONFIG.EMAIL_HOST),
        port: 465,
        secure: true,
        auth: {
          user: config.get(ENV_CONFIG.EMAIL_USER),
          pass: config.get(ENV_CONFIG.EMAIL_PASS),
        },
      },
    }),
  ],
  providers: [TrackPriceService, AlertProcessor],
  controllers: [TrackPriceController],
})
export class TrackPriceModule {}
