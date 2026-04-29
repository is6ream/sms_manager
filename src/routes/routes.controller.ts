import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
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
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { SearchRoutesDto } from './dto/search-routes.dto';
import { Route } from './entities/route.entity';

@ApiTags('Маршруты')
@Controller('routes')
export class RoutesController {
  constructor(private readonly routesService: RoutesService) {}

  @Post()
  @ApiOperation({ summary: 'Создать маршрут' })
  @ApiResponse({ status: 201, description: 'Маршрут создан', type: Route })
  create(@Body() dto: CreateRouteDto): Promise<Route> {
    return this.routesService.create(dto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Поиск маршрутов по фильтрам' })
  @ApiResponse({ status: 200, description: 'Список маршрутов по фильтру', type: [Route] })
  search(@Query() filters: SearchRoutesDto): Promise<Route[]> {
    return this.routesService.search(filters);
  }

  @Get()
  @ApiOperation({ summary: 'Получить все маршруты' })
  @ApiResponse({ status: 200, description: 'Список маршрутов', type: [Route] })
  findAll(): Promise<Route[]> {
    return this.routesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить маршрут по ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Маршрут найден', type: Route })
  @ApiResponse({ status: 404, description: 'Маршрут не найден' })
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Route> {
    return this.routesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить маршрут' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Маршрут обновлён', type: Route })
  @ApiResponse({ status: 404, description: 'Маршрут не найден' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRouteDto,
  ): Promise<Route> {
    return this.routesService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Удалить маршрут' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Маршрут удалён' })
  @ApiResponse({ status: 404, description: 'Маршрут не найден' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.routesService.remove(id);
  }
}
