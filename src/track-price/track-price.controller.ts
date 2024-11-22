import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TrackPriceService } from './track-price.service';

@Controller('track-price')
export class TrackPriceController {
  constructor(private readonly trackPriceService: TrackPriceService) {}

  @Get(':date')
  getHourPrices(@Param('date') date: Date): any {
    return this.trackPriceService.getHourPrices(date);
  }

  @Post('/convertion')
  getConvertion(@Body() convertionDto): any {
    return this.trackPriceService.getConvertionRate(convertionDto);
  }
}
