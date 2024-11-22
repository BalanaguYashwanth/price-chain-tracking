import { Controller, Post } from '@nestjs/common';
import { SavePriceService } from './save-price.service';
import { ApiOperation } from '@nestjs/swagger';

@Controller('save-price')
export class SavePriceController {
  constructor(private readonly savePriceService: SavePriceService) {}

  @Post('/')
  @ApiOperation({
    summary: 'Trigger this api, To save data of trade into db',
  })
  async priceTracking() {
    return this.savePriceService.savePrice();
  }
}
