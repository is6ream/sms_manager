import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Provider } from '../providers/entities/provider.entity';
import { Route, RouteType } from '../routes/entities/route.entity';
import {
  ImportResultDto,
  ImportRowErrorDto,
  FilePreviewDto,
  SampleRowDto,
} from './dto/import-result.dto';
import { AiService } from '../ai/ai.service';

const COLUMN_PATTERNS: Record<string, RegExp> = {
  operator: /^(network|networks|оператор|operator)$/i,
  country: /страна|country|направление|destination|регион/i,
  routeType: /^(тип|type|канал|channel|маршрут|quality|качество|route\s*type|sms\s*type)$/i,
  price: /цена|price|стоимость|cost|тариф|tariff|rate/i,
};

const ROUTE_TYPE_MAP: Record<string, RouteType> = {
  hq: RouteType.HQ,
  bypass: RouteType.BYPASS,
  direct: RouteType.DIRECT,
  sim: RouteType.SIM,
  'high quality': RouteType.HQ,
  'local direct': RouteType.DIRECT,
  прямой: RouteType.DIRECT,
  байпас: RouteType.BYPASS,
  симка: RouteType.SIM,
  dir: RouteType.DIRECT,
};

type DetectHeadersResult = {
  headerRowIndex: number;
  columnMap: Record<string, number>;
  detectedColumns: Record<string, string>;
  currency: string;
};

@Injectable()
export class ImportService {
  private readonly logger = new Logger(ImportService.name);

  constructor(
    @InjectRepository(Provider)
    private readonly providersRepo: Repository<Provider>,
    @InjectRepository(Route)
    private readonly routesRepo: Repository<Route>,
    private readonly aiService: AiService,
  ) {}

  async previewFile(buffer: Uint8Array): Promise<FilePreviewDto> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(Buffer.from(buffer) as any);
    } catch {
      throw new BadRequestException('Не удалось прочитать файл. Убедитесь, что это валидный .xlsx файл.');
    }

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('Файл не содержит листов.');
    }

    const { headerRowIndex, columnMap, detectedColumns, currency } =
      await this.detectHeaders(sheet);

    let rowCount = 0;
    const sampleRows: SampleRowDto[] = [];

    for (let rowNumber = headerRowIndex + 1; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const rawValues = this.extractRowValues(row, columnMap);

      if (!rawValues.country && !rawValues.price) continue;

      rowCount++;
      if (sampleRows.length < 5) {
        sampleRows.push({
          country: rawValues.country,
          operator: rawValues.operator,
          routeType: rawValues.routeType,
          price: rawValues.price,
        });
      }
    }

    return { detectedColumns, rowCount, currency, sampleRows };
  }

  async importFromBuffer(buffer: Uint8Array, providerId: string): Promise<ImportResultDto> {
    const workbook = new ExcelJS.Workbook();
    try {
      await workbook.xlsx.load(Buffer.from(buffer) as any);
    } catch {
      throw new BadRequestException('Не удалось прочитать файл. Убедитесь, что это валидный .xlsx файл.');
    }

    const sheet = workbook.worksheets[0];
    if (!sheet) {
      throw new BadRequestException('Файл не содержит листов.');
    }

    const { headerRowIndex, columnMap, detectedColumns, currency } =
      await this.detectHeaders(sheet);

    if (!columnMap.country || !columnMap.price) {
      throw new BadRequestException(
        `Не удалось найти обязательные колонки (страна, цена). Найдено: ${JSON.stringify(detectedColumns)}`,
      );
    }

    const provider = await this.providersRepo.findOne({ where: { id: providerId } });
    if (!provider) {
      throw new BadRequestException(`Поставщик с id "${providerId}" не найден`);
    }

    const result: ImportResultDto = {
      total: 0,
      created: 0,
      skipped: 0,
      errors: [],
      detectedColumns,
    };

    for (let rowNumber = headerRowIndex + 1; rowNumber <= sheet.rowCount; rowNumber++) {
      const row = sheet.getRow(rowNumber);
      const rawValues = this.extractRowValues(row, columnMap);

      if (!rawValues.country && !rawValues.price) continue;

      result.total++;
      const rowError = await this.processRow(rawValues, rowNumber, provider, currency);

      if (rowError) {
        result.errors.push(rowError);
        result.skipped++;
      } else {
        result.created++;
      }
    }

    return result;
  }

  private async detectHeaders(sheet: ExcelJS.Worksheet): Promise<DetectHeadersResult> {
    const columnMap: Record<string, number> = {};
    const detectedColumns: Record<string, string> = {};
    let headerRowIndex = 1;
    let currency = 'USD';

    for (let r = 1; r <= Math.min(8, sheet.rowCount); r++) {
      const row = sheet.getRow(r);
      let matchCount = 0;
      const tempMap: Record<string, number> = {};
      const tempLabels: Record<string, string> = {};
      let tempCurrency = 'USD';

      row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
        const text = String(cell.value ?? '').trim();
        for (const [field, pattern] of Object.entries(COLUMN_PATTERNS)) {
          if (pattern.test(text) && !tempMap[field]) {
            tempMap[field] = colNumber;
            tempLabels[field] = text;
            matchCount++;
          }
        }
        if (/eur|euro/i.test(text) && /price|цена|стоимость|тариф/i.test(text)) {
          tempCurrency = 'EUR';
        }
      });

      if (matchCount >= 2) {
        headerRowIndex = r;
        Object.assign(columnMap, tempMap);
        Object.assign(detectedColumns, tempLabels);
        currency = tempCurrency;
        this.logger.log(`Regex определил заголовки в строке ${r}: ${JSON.stringify(tempLabels)}`);
        return { headerRowIndex, columnMap, detectedColumns, currency };
      }
    }

    // Fallback: пробуем AI, если regex не нашёл достаточно колонок
    if (this.aiService.isEnabled) {
      this.logger.log('Regex не распознал заголовки — пробую AI-определение');
      const aiResult = await this.tryAiDetection(sheet);
      if (aiResult) return aiResult;
    }

    return { headerRowIndex, columnMap, detectedColumns, currency };
  }

  private async tryAiDetection(sheet: ExcelJS.Worksheet): Promise<DetectHeadersResult | null> {
    for (let r = 1; r <= Math.min(8, sheet.rowCount); r++) {
      const row = sheet.getRow(r);
      const headers: string[] = [];

      row.eachCell({ includeEmpty: true }, (cell) => {
        headers.push(String(cell.value ?? '').trim());
      });

      if (headers.every((h) => !h)) continue;

      const aiMapping = await this.aiService.detectColumns(headers);
      if (!aiMapping || (!aiMapping.country && !aiMapping.price)) continue;

      const columnMap: Record<string, number> = {};
      const detectedColumns: Record<string, string> = {};

      for (const [field, colIndex] of Object.entries(aiMapping) as [string, number][]) {
        columnMap[field] = colIndex;
        detectedColumns[field] = headers[colIndex - 1] ?? field;
      }

      const currency = headers.some((h) => /eur/i.test(h)) ? 'EUR' : 'USD';
      this.logger.log(`AI определил заголовки в строке ${r}: ${JSON.stringify(detectedColumns)}`);
      return { headerRowIndex: r, columnMap, detectedColumns, currency };
    }

    return null;
  }

  private extractRowValues(
    row: ExcelJS.Row,
    columnMap: Record<string, number>,
  ): Record<string, string> {
    const get = (field: string): string => {
      const col = columnMap[field];
      if (!col) return '';
      const cell = row.getCell(col);
      const val = cell.value;
      if (val === null || val === undefined) return '';
      if (typeof val === 'object' && 'result' in val) {
        return String((val as ExcelJS.CellFormulaValue).result ?? '');
      }
      return String(val).trim();
    };

    return {
      operator: get('operator'),
      country: get('country'),
      routeType: get('routeType'),
      price: get('price'),
    };
  }

  private async processRow(
    values: Record<string, string>,
    rowNumber: number,
    provider: Provider,
    currency: string,
  ): Promise<ImportRowErrorDto | null> {
    const { operator, country, routeType: routeTypeRaw, price: priceRaw } = values;

    if (!country || !priceRaw) {
      return { row: rowNumber, message: 'Пустые обязательные поля: страна или цена' };
    }

    const routeType = routeTypeRaw
      ? (this.normalizeRouteType(routeTypeRaw) ?? RouteType.DIRECT)
      : RouteType.DIRECT;

    const price = this.parsePrice(priceRaw);
    if (isNaN(price) || price < 0) {
      return { row: rowNumber, message: `Некорректная цена: "${priceRaw}"` };
    }

    await this.routesRepo.save(
      this.routesRepo.create({
        providerId: provider.id,
        country: country.trim(),
        operator: operator?.trim() || null,
        routeType,
        price,
        currency,
        isActive: true,
      }),
    );

    return null;
  }

  private parsePrice(raw: string): number {
    const cleaned = raw.replace(/[^0-9.,-]/g, '').replace(',', '.');
    return parseFloat(cleaned);
  }

  private normalizeRouteType(raw: string): RouteType | null {
    const key = raw.trim().toLowerCase();
    if (ROUTE_TYPE_MAP[key]) return ROUTE_TYPE_MAP[key];

    for (const [mapKey, value] of Object.entries(ROUTE_TYPE_MAP)) {
      if (key.includes(mapKey)) return value;
    }

    return null;
  }
}
