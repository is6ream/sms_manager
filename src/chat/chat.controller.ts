import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { AskQuestionDto, ChatAnswerDto } from './dto/ask-question.dto';

@ApiTags('Чат')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('ask')
  @ApiOperation({ summary: 'Найти лучшие маршруты по текстовому запросу' })
  @ApiResponse({ status: 201, type: ChatAnswerDto })
  ask(@Body() dto: AskQuestionDto): Promise<ChatAnswerDto> {
    return this.chatService.ask(dto);
  }
}
