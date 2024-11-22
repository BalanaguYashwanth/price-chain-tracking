import { Controller, Post } from '@nestjs/common';
import { SavePriceService } from './save-price.service';

@Controller('save-price')
export class SavePriceController {
  constructor(private readonly savePriceService: SavePriceService) {}

  @Post('/')
  async priceTracking() {
    return this.savePriceService.savePrice();
  }
}
