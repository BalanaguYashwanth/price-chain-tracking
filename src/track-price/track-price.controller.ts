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
import { AlertDTO, ConvertionDto } from './track-price.dto';
import { ApiBody } from '@nestjs/swagger';

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
  @ApiBody({
    type: AlertDTO, // Use the DTO class to define input structure
  })
  async createAlert(@Body() alertDto: AlertDTO): Promise<any> {
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
  getConvertion(@Body() convertionDto: ConvertionDto): any {
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
