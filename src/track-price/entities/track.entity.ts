import { IsEmail, Min } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'alert' })
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  // coin column to store the coin type like Ethereum, Polygon
  @Column()
  coin: string;

  // Change the column type to float or numeric
  @Column('float')
  @Min(0)
  target_price: number;

  @Column()
  @IsEmail()
  target_email: string;
}
