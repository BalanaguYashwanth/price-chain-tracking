import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsNumber } from 'class-validator';

export class AlertDTO {
  @ApiProperty({
    description: 'The coin type (e.g., ETH, MATIC)',
    example: 'ETH',
  })
  @IsString()
  coin: string;

  @ApiProperty({
    description: 'The price for the alert',
    example: 1000,
  })
  @IsNumber()
  target_price: number;

  @ApiProperty({
    description: 'Email to notify when the alert is triggered',
    example: 'user@example.com',
  })
  @IsEmail()
  target_email: string;
}

export class ConvertionDto {
  @ApiProperty({
    description: 'The coin value ETH',
    example: '0',
  })
  @IsNumber()
  ethAmount: 10;
}
