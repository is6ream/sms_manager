import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ImportService } from './import.service';
import { ImportResultDto, FilePreviewDto } from './dto/import-result.dto';

class ImportExcelBodyDto {
  @ApiProperty({ example: 'uuid', description: 'ID поставщика' })
  @IsUUID()
  providerId: string;
}

const fileInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    if (
      allowed.includes(file.mimetype) ||
      file.originalname.endsWith('.xlsx') ||
      file.originalname.endsWith('.xls')
    ) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Поддерживаются только файлы .xlsx и .xls'), false);
    }
  },
});

const fileApiBody = {
  schema: {
    type: 'object' as const,
    required: ['file'],
    properties: {
      file: {
        type: 'string',
        format: 'binary',
        description: 'Excel-файл (.xlsx)',
      },
    },
  },
};

@ApiTags('Импорт')
@Controller('import')
export class ImportController {
  constructor(private readonly importService: ImportService) {}

  @Post('preview')
  @UseInterceptors(fileInterceptor)
  @ApiOperation({ summary: 'Предпросмотр Excel-файла без сохранения данных' })
  @ApiConsumes('multipart/form-data')
  @ApiBody(fileApiBody)
  @ApiResponse({ status: 201, description: 'Информация о файле', type: FilePreviewDto })
  @ApiResponse({ status: 400, description: 'Невалидный файл' })
  async previewExcel(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<FilePreviewDto> {
    if (!file) {
      throw new BadRequestException('Файл не передан. Используйте поле "file".');
    }
    return this.importService.previewFile(file.buffer);
  }

  @Post('excel')
  @UseInterceptors(fileInterceptor)
  @ApiOperation({ summary: 'Загрузить Excel-файл и импортировать маршруты для поставщика' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'providerId'],
      properties: {
        file: { type: 'string', format: 'binary', description: 'Excel-файл (.xlsx)' },
        providerId: { type: 'string', description: 'UUID поставщика' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Результат импорта', type: ImportResultDto })
  @ApiResponse({ status: 400, description: 'Невалидный файл или неверный формат' })
  async uploadExcel(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: ImportExcelBodyDto,
  ): Promise<ImportResultDto> {
    if (!file) {
      throw new BadRequestException('Файл не передан. Используйте поле "file".');
    }
    if (!body?.providerId) {
      throw new BadRequestException('Не указан providerId поставщика.');
    }
    return this.importService.importFromBuffer(file.buffer, body.providerId);
  }
}
