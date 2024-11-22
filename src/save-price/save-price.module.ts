import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { QUEUE_TYPE } from './common/constants';
import { SavePriceController } from './save-price.controller';
import { SavePriceService } from './save-price.service';
import { PriceProcessConsumer } from './price-process-interval.consumer';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Price } from './entities/price.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Price]),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
      prefix: 'bullmq',
    }),
    BullModule.registerQueue({
      name: QUEUE_TYPE.PRICE_FETCH,
    }),
  ],
  controllers: [SavePriceController],
  providers: [SavePriceService, PriceProcessConsumer],
  exports: [TypeOrmModule],
})
export class SavePriceModule {}
