import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { TrackPriceService } from './track-price.service';

@Controller('track-price')
export class TrackPriceController {
  constructor(private readonly trackPriceService: TrackPriceService) {}

  @Get(':date')
  getHourlyPrices(@Param('date') date: Date): any {
    try {
      return this.trackPriceService.getHourlyPrices(date);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: error.message || 'Failed to track price',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/alert')
  async createAlert(@Body() alertDto): Promise<any> {
    try {
      return await this.trackPriceService.createAlert(alertDto);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: error.message || 'Failed to create alert',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('/convertion')
  getConvertion(@Body() convertionDto): any {
    try {
      return this.trackPriceService.getConvertionRate(convertionDto);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          message: error.message || 'Failed to get convertion',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
