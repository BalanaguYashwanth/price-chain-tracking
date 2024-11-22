import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Repository } from 'typeorm';
import { Cache } from 'cache-manager';
import { InjectRepository } from '@nestjs/typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AlertDTO } from './track-price.dto';
import { ConfigService } from '@nestjs/config';
import { Alert } from './entities/track.entity';
import { ENV_CONFIG } from 'src/common/config';
import { Price } from 'src/save-price/entities/price.entity';
import { JOB_TYPE, QUEUE_TYPE } from 'src/common/constants';
import { getCryptoPriceFromCoinbase } from './common/thirdparty.api';

const config = new ConfigService();
@Injectable()
export class TrackPriceService {
  private queueConfig;
  constructor(
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    @InjectRepository(Alert)
    private readonly alertRepository: Repository<Alert>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @InjectQueue(QUEUE_TYPE.ALERTS) private queue: Queue,
  ) {
    this.queueConfig = {
      attempts: 3,
      backoff: 5000,
      delay: 1000,
    };
  }

  async getHourlyPrices(date: Date) {
    try {
      const specificDate = date;
      const hourlyAverages = await this.priceRepository
        .createQueryBuilder('price')
        .select([
          'price.coin',
          "to_char(to_timestamp(price.timestamp), 'YYYY-MM-DD HH24') as hour",
          'AVG(price.price) as avg_price',
        ])
        .where(
          "to_char(to_timestamp(price.timestamp), 'YYYY-MM-DD') = :specificDate",
          { specificDate },
        )
        .groupBy(
          "price.coin, to_char(to_timestamp(price.timestamp), 'YYYY-MM-DD HH24')",
        )
        .orderBy(
          "to_char(to_timestamp(price.timestamp), 'YYYY-MM-DD HH24')",
          'ASC',
        )
        .getRawMany();

      return { hourlyAverages };
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  async createAlert(alertDto: AlertDTO) {
    try {
      const { coin, target_price, target_email } = alertDto;
      await this.alertRepository.insert([
        { coin, target_price: Number(target_price), target_email },
      ]);
      return { status: 'created' };
    } catch (error) {
      throw new Error(error?.message || 'Failed to create alert');
    }
  }

  // todo - use bullmq or worker threads to loop and set alert

  // todo - convert from cron to bullmq
  @Cron(CronExpression.EVERY_HOUR)
  async checkIncrease() {
    try {
      const currentHourPrices = await this.priceRepository
        .createQueryBuilder('price')
        .where(
          "to_char(to_timestamp(price.timestamp), 'YYYY-MM-DD HH24') = to_char(now(), 'YYYY-MM-DD HH24')",
        )
        .orderBy('price.timestamp', 'DESC')
        .limit(2)
        .getMany();

      const previousHourPrices = await this.priceRepository
        .createQueryBuilder('price')
        .where(
          "to_char(to_timestamp(price.timestamp), 'YYYY-MM-DD HH24') = to_char(now() - interval '1 hour', 'YYYY-MM-DD HH24')",
        )
        .orderBy('price.timestamp', 'DESC')
        .limit(2)
        .getMany();

      const [currentEth, currentPolygon] = currentHourPrices;
      const [prevEth, prevPolygon] = previousHourPrices;
      const ethDiff = this.getPercentage(currentEth, prevEth);
      const polygonDiff = this.getPercentage(currentPolygon, prevPolygon);

      if (Number(ethDiff) > 3) {
        this.sendPriceIncreaseEmail({ chainType: 'eth' });
      }

      if (Number(polygonDiff) > 3) {
        this.sendPriceIncreaseEmail({ chainType: 'matic' });
      }

      return {};
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  getPercentage = (curr, prev) => {
    try {
      if (curr?.price && prev?.price) {
        const diff = ((curr.price - prev.price) / prev.price) * 100;
        const percentageChange = diff.toFixed(2);
        return percentageChange;
      }
    } catch (error) {
      throw new Error(error.message);
    }
  };

  private createRedisCache = async (key: string, value: any): Promise<void> => {
    await this.cacheManager.set(key, value.toString(), 300000);
  };

  async getConvertionRate(convertionDto) {
    try {
      const { ethAmount = 0 } = convertionDto;
      const redisKey = 'btcPrice';
      let ethToBtcRate = Number(await this.cacheManager.get(redisKey));
      const platformFeePercentage = 0.5;

      if (!ethToBtcRate) {
        const priceData = await getCryptoPriceFromCoinbase('ETH');
        await this.createRedisCache(redisKey, ethToBtcRate);
        ethToBtcRate = priceData.data.rates.BTC;
      }

      const fee = (platformFeePercentage / 100) * ethToBtcRate * ethAmount;
      const netBtc = ethToBtcRate * ethAmount - fee;

      return { btc: netBtc.toFixed(2), platformFeePercentage };
    } catch (error) {
      throw new Error(error?.message);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async checkAlerts() {
    const alerts = await this.alertRepository.find();
    alerts.forEach(async (alert) => {
      return await this.queue.add(
        JOB_TYPE.ALERT_PROCESS,
        { ...alert },
        this.queueConfig,
      );
    });
  }

  async sendPriceIncreaseEmail({ chainType }: { chainType: string }) {
    const TARGET_EMAIL = config.get(ENV_CONFIG.HYPERHIRE_EMAIL);
    const EMAIL_USER = config.get(ENV_CONFIG.EMAIL_USER);
    await this.queue.add(
      JOB_TYPE.SEND_EMAIL,
      {
        to: TARGET_EMAIL,
        from: EMAIL_USER,
        subject: `Alert - ${chainType} increased more than 3%`,
        text: `${chainType} increased more than 3%`,
      },
      this.queueConfig,
    );
  }
}
