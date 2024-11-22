import { Controller, Get } from '@nestjs/common';
import { SavePriceService } from './save-price.service';

@Controller('save-price')
export class SavePriceController {
  constructor(private readonly savePriceService: SavePriceService) {}

  @Get('/')
  async priceTracking() {
    return this.savePriceService.priceTracking();
  }
}
