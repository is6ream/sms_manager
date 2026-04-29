import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { RouteType } from '../entities/route.entity';

export class SearchRoutesDto {
  @ApiPropertyOptional({ example: 'Япония', description: 'Фильтр по стране (частичное совпадение)' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ enum: RouteType, description: 'Фильтр по типу маршрута' })
  @IsOptional()
  @IsEnum(RouteType)
  routeType?: RouteType;

  @ApiPropertyOptional({ example: 'uuid', description: 'Фильтр по ID поставщика' })
  @IsOptional()
  @IsUUID()
  providerId?: string;

  @ApiPropertyOptional({ example: 0.05, description: 'Максимальная цена' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  maxPrice?: number;
}
