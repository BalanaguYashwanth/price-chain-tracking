import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { JOB_TYPE, QUEUE_TYPE } from './common/constants';
import { CronExpression } from '@nestjs/schedule';

@Injectable()
export class SavePriceService {
  constructor(@InjectQueue(QUEUE_TYPE.PRICE_FETCH) private queue: Queue) {}

  async priceTracking() {
    const config = {
      priority: 1,
      repeat: { cron: CronExpression.EVERY_5_MINUTES },
      attempts: 3,
      backoff: 5000,
    };
    return await this.queue.add(JOB_TYPE.PRICE_PROCESS_INTERVAL, {}, config);
  }
}
