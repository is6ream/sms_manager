import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  IsBoolean,
} from 'class-validator';
import { RouteType } from '../entities/route.entity';
import { Type } from 'class-transformer';

export class CreateRouteDto {
  @ApiProperty({ example: 'uuid', description: 'ID поставщика' })
  @IsUUID()
  @IsNotEmpty()
  providerId: string;

  @ApiProperty({ example: 'Япония', description: 'Страна назначения' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  country: string;

  @ApiProperty({ enum: RouteType, description: 'Тип маршрута' })
  @IsEnum(RouteType)
  routeType: RouteType;

  @ApiProperty({ example: 0.032, description: 'Цена за SMS' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 'USD', description: 'Валюта', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  currency?: string;

  @ApiProperty({ example: true, description: 'Активен ли маршрут', required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
