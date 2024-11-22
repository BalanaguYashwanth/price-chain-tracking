import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { MailerService } from '@nestjs-modules/mailer';
import { getCryptoPriceFromCoinbase } from './common/thirdparty.api';
import { ConfigService } from '@nestjs/config';
import { ENV_CONFIG } from 'src/common/config';
import { JOB_TYPE, QUEUE_TYPE } from 'src/common/constants';
import { Queue } from 'bull';

const config = new ConfigService();

@Processor(QUEUE_TYPE.ALERTS)
export class AlertProcessor {
  constructor(
    @InjectQueue(QUEUE_TYPE.ALERTS) private queue: Queue,
    private readonly mailService: MailerService,
  ) {}
  @Process(JOB_TYPE.ALERT_PROCESS)
  async process(job: any): Promise<any> {
    try {
      const { coin, target_price, target_email } = job.data;
      const priceData = await getCryptoPriceFromCoinbase(coin);
      const UsdRate = priceData.data.rates.USD;
      if (
        parseFloat(Number(target_price).toFixed(2)) ===
        parseFloat(Number(UsdRate).toFixed(2))
      ) {
        await this.queue.add(
          JOB_TYPE.SEND_EMAIL,
          {
            to: target_email,
            from: config.get(ENV_CONFIG.EMAIL_USER),
            subject: `Alert - Target reached ${coin}`,
            text: ` Target reached ${coin} - ${UsdRate} !!!`,
          },
          {
            attempts: 3,
            backoff: 5000,
            delay: 1000,
          },
        );
      }
      return { status: 'completed' };
    } catch (error) {
      console.error('Error fetching ETH price:', error.message);
      throw new Error('Failed to fetch ETH price');
    }
  }

  @Process(JOB_TYPE.SEND_EMAIL)
  async sendEmail(job: any) {
    const { data } = job;
    this.mailService.sendMail(data).catch((err) => {
      throw new Error(err?.message);
    });
  }
}
