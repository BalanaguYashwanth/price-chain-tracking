import { DataSource, Repository } from 'typeorm';
import { Process, Processor } from '@nestjs/bull';
import { JOB_TYPE, QUEUE_TYPE } from './common/constants';
import { Price } from './entities/price.entity';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { getTokenPrice } from './common/thirdparty.api';

@Processor(QUEUE_TYPE.PRICE_FETCH)
export class PriceProcessConsumer {
  constructor(
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Process(JOB_TYPE.PRICE_PROCESS_INTERVAL)
  async priceProcessInterval() {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const unixTimestamp = Math.floor(Date.now() / 1000);

      const prices = await getTokenPrice();
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

      await queryRunner.manager.insert(Price, priceData);

      await queryRunner.commitTransaction();
      return { status: 'completed' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new Error(error?.message || 'Job failed');
    } finally {
      await queryRunner.release();
    }
  }
}
