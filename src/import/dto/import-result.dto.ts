import { ApiProperty } from '@nestjs/swagger';

export class ImportRowErrorDto {
  @ApiProperty({ example: 2, description: 'Номер строки в файле' })
  row: number;

  @ApiProperty({ example: 'Не удалось распознать тип маршрута: "premium"' })
  message: string;
}

export class ImportResultDto {
  @ApiProperty({ example: 50, description: 'Всего строк данных в файле' })
  total: number;

  @ApiProperty({ example: 47, description: 'Успешно создано маршрутов' })
  created: number;

  @ApiProperty({ example: 2, description: 'Пропущено (дубли или пустые строки)' })
  skipped: number;

  @ApiProperty({ type: [ImportRowErrorDto], description: 'Строки с ошибками' })
  errors: ImportRowErrorDto[];

  @ApiProperty({
    description: 'Найденные колонки в файле',
    example: { country: 'Country', operator: 'Network', routeType: 'Route type', price: 'Price' },
  })
  detectedColumns: Record<string, string>;
}

export class SampleRowDto {
  @ApiProperty({ example: 'Russia' })
  country: string;

  @ApiProperty({ example: 'MTS', required: false })
  operator: string;

  @ApiProperty({ example: 'direct', required: false })
  routeType: string;

  @ApiProperty({ example: '0.0320' })
  price: string;
}

export class FilePreviewDto {
  @ApiProperty({
    description: 'Обнаруженные колонки',
    example: { country: 'Country', operator: 'Network', routeType: 'Route type', price: 'Price (USD)' },
  })
  detectedColumns: Record<string, string>;

  @ApiProperty({ example: 150, description: 'Количество строк данных' })
  rowCount: number;

  @ApiProperty({ example: 'USD', description: 'Определённая валюта' })
  currency: string;

  @ApiProperty({ type: [SampleRowDto], description: 'Первые 5 строк для предпросмотра' })
  sampleRows: SampleRowDto[];
}
