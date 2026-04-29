import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ example: 'Aggregator X', description: 'Название агрегатора' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
