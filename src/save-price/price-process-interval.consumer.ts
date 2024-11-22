import { Job } from 'bull';
import { Process, Processor } from '@nestjs/bull';
import { JOB_TYPE, QUEUE_TYPE, SUPPORTED_CHAINS } from './common/constants';
import { Repository } from 'typeorm';
import { Price } from './entities/price.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { getTokenPrice } from './common/thirdparty.api';

@Processor(QUEUE_TYPE.PRICE_FETCH)
export class PriceProcessConsumer {
  constructor(
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
  ) {}
  @Process(JOB_TYPE.PRICE_PROCESS_INTERVAL)
  async priceProcessInterval() {
    //todo - initiate the transaction sessions and pull from moralis
    try {
      const unixTimestamp = Math.floor(Date.now() / 1000);

      // const prices = await getTokenPrice(SUPPORTED_CHAINS);
      const prices = { eth: 3323.35, polygon: 3325.05 };
      const priceData = [
        {
          coin: 'ethereum',
          price: Number(prices.eth),
          timestamp: unixTimestamp,
        },
        {
          coin: 'polygon',
          price: Number(prices.polygon),
          timestamp: unixTimestamp,
        },
      ];

      await this.priceRepository.insert(priceData);
      return { status: 'completed' };
    } catch (error) {
      throw new Error(error?.message || 'Job failed');
    }
  }
}
