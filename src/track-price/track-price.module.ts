import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { redisStore } from 'cache-manager-redis-yet';
import { TrackPriceService } from './track-price.service';
import { TrackPriceController } from './track-price.controller';
import { SavePriceModule } from 'src/save-price/save-price.module';
import { MailerModule } from '@nestjs-modules/mailer';
import {
  EMAIL_HOST,
  EMAIL_PASS,
  EMAIL_SERVICE,
  EMAIL_USER,
} from 'src/save-price/common/config';

@Module({
  imports: [
    CacheModule.register({
      store: redisStore,
      host: 'localhost',
      port: 6379,
    }),
    SavePriceModule,
    ScheduleModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        service: EMAIL_SERVICE,
        host: EMAIL_HOST,
        port: 465,
        secure: true,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      },
    }),
  ],
  providers: [TrackPriceService],
  controllers: [TrackPriceController],
})
export class TrackPriceModule {}
