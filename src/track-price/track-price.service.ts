import { MailerService } from '@nestjs-modules/mailer';
import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { EMAIL_USER } from 'src/save-price/common/config';
import { Price } from 'src/save-price/entities/price.entity';
import { Repository } from 'typeorm';
import { getETHToBTCFromCoinbase } from './common/thirdparty.api';

@Injectable()
export class TrackPriceService {
  constructor(
    @InjectRepository(Price)
    private readonly priceRepository: Repository<Price>,
    private readonly mailService: MailerService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async getHourPrices(date: Date) {
    const specificDate = date;

    const hourlyAverages = await this.priceRepository
      .createQueryBuilder('price')
      .select([
        "to_char(to_timestamp(price.timestamp), 'YYYY-MM-DD HH24') as hour",
        'AVG(price.price) as avg_price',
      ])
      .where(
        "to_char(to_timestamp(price.timestamp), 'YYYY-MM-DD') = :specificDate",
        { specificDate },
      )
      .groupBy("to_char(to_timestamp(price.timestamp), 'YYYY-MM-DD HH24')")
      .orderBy(
        "to_char(to_timestamp(price.timestamp), 'YYYY-MM-DD HH24')",
        'ASC',
      )
      .getRawMany();

    return { hourlyAverages };
  }

  //todo - convert from cron to bullmq
  @Cron(CronExpression.EVERY_HOUR)
  async checkIncrease() {
    try {
      const TARGET_EMAIL = 'balanaguyashwanth@gmail.com';
      const currentHourPrices = await this.priceRepository
        .createQueryBuilder('price')
        .where(
          "to_char(to_timestamp(price.timestamp), 'YYYY-MM-DD HH24') = to_char(now(), 'YYYY-MM-DD HH24')",
        )
        .orderBy('price.timestamp', 'DESC')
        .limit(2)
        .getMany();

      // Fetch top 2 previous hour prices
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
        this.mailService
          .sendMail({
            to: TARGET_EMAIL,
            from: EMAIL_USER,
            subject: 'Alert - Eth increased more than 3%',
            text: 'Eth increased more than 3%',
          })
          .catch((err) => {
            throw new Error(err?.message);
          });
      }

      if (Number(polygonDiff) > 3) {
        this.mailService
          .sendMail({
            to: TARGET_EMAIL,
            from: EMAIL_USER,
            subject: 'Alert - Polygon increased more than 3%',
            text: 'Polygon increased more than 3%',
          })
          .catch((err) => {
            throw new Error(err?.message);
          });
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
        ethToBtcRate = await getETHToBTCFromCoinbase();
        await this.createRedisCache(redisKey, ethToBtcRate);
      }

      const fee = (platformFeePercentage / 100) * ethToBtcRate * ethAmount;
      const netBtc = ethToBtcRate * ethAmount - fee;

      return { btc: netBtc.toFixed(2), platformFeePercentage };
    } catch (error) {
      throw new Error(error?.message);
    }
  }
}
