import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsOptional, MinLength, MaxLength } from 'class-validator';

export class AskQuestionDto {
  @ApiProperty({ example: 'Почему цена на этот маршрут выше рынка?' })
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @ApiProperty({ example: 'uuid', description: 'ID маршрута для контекста (необязательно)', required: false })
  @IsOptional()
  @IsUUID()
  routeId?: string;
}

export class ChatAnswerDto {
  @ApiProperty({ example: 'Цена обусловлена высоким качеством доставки (HQ).' })
  answer: string;
}
