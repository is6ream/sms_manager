import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Provider } from '../../providers/entities/provider.entity';

export enum RouteType {
  BYPASS = 'bypass',
  DIRECT = 'direct',
  HQ = 'hq',
  SIM = 'sim',
}

@Entity('routes')
export class Route {
  @ApiProperty({ example: 'uuid', description: 'Уникальный идентификатор' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Provider, description: 'Поставщик' })
  @ManyToOne(() => Provider, (provider) => provider.routes, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'providerId' })
  provider: Provider;

  @Column()
  providerId: string;

  @ApiProperty({ example: 'Япония', description: 'Страна назначения' })
  @Column({ length: 255 })
  country: string;

  @ApiProperty({ enum: RouteType, description: 'Тип маршрута' })
  @Column({ type: 'enum', enum: RouteType })
  routeType: RouteType;

  @ApiProperty({ example: '0.0320', description: 'Цена за SMS' })
  @Column({ type: 'decimal', precision: 10, scale: 4 })
  price: number;

  @ApiProperty({ example: 'USD', description: 'Валюта' })
  @Column({ length: 10, default: 'USD' })
  currency: string;

  @ApiProperty({ example: true, description: 'Активен ли маршрут' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Дата создания' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  @UpdateDateColumn()
  updatedAt: Date;
}
