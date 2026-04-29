import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Route } from '../../routes/entities/route.entity';

@Entity('providers')
export class Provider {
  @ApiProperty({ example: 'uuid', description: 'Уникальный идентификатор' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Aggregator X', description: 'Название агрегатора' })
  @Column({ length: 255 })
  name: string;

  @OneToMany(() => Route, (route) => route.provider)
  routes: Route[];

  @ApiProperty({ description: 'Дата создания' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Дата обновления' })
  @UpdateDateColumn()
  updatedAt: Date;
}
