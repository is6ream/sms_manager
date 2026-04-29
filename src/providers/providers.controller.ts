import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { Provider } from './entities/provider.entity';

@ApiTags('Поставщики')
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post()
  @ApiOperation({ summary: 'Создать поставщика' })
  @ApiResponse({ status: 201, description: 'Поставщик создан', type: Provider })
  create(@Body() dto: CreateProviderDto): Promise<Provider> {
    return this.providersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Получить список всех поставщиков' })
  @ApiResponse({ status: 200, description: 'Список поставщиков', type: [Provider] })
  findAll(): Promise<Provider[]> {
    return this.providersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить поставщика по ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Поставщик найден', type: Provider })
  @ApiResponse({ status: 404, description: 'Поставщик не найден' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Provider> {
    return this.providersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить поставщика' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Поставщик обновлён', type: Provider })
  @ApiResponse({ status: 404, description: 'Поставщик не найден' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProviderDto,
  ): Promise<Provider> {
    return this.providersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить поставщика' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Поставщик удалён' })
  @ApiResponse({ status: 404, description: 'Поставщик не найден' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.providersService.remove(id);
  }
}
