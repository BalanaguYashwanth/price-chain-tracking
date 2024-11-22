import { Min } from 'class-validator';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'price' })
export class Price {
  @PrimaryGeneratedColumn()
  id: number;

  // coin column to store the coin type like Ethereum, Polygon
  @Column()
  coin: string;

  // Change the column type to float or numeric
  @Column('float')
  @Min(0)
  price: number;

  @Column('bigint')
  timestamp: number;
}
