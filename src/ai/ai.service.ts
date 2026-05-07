import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

export type ColumnMapping = {
  country?: number;
  operator?: number;
  routeType?: number;
  price?: number;
};

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly groq: Groq | null = null;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (apiKey) {
      this.groq = new Groq({ apiKey });
    } else {
      this.logger.warn('GROQ_API_KEY не задан — AI-определение колонок отключено');
    }
  }

  get isEnabled(): boolean {
    return this.groq !== null;
  }

  /**
   * Определяет маппинг колонок Excel с помощью Groq.
   * @param headers Массив заголовков строки (значение ячейки по индексу).
   * @returns Маппинг имя_поля → индекс колонки (1-based) или null если не удалось.
   */
  async detectColumns(headers: string[]): Promise<ColumnMapping | null> {
    if (!this.groq) return null;

    const prompt = `You are an expert at reading SMS/telecom price tables exported from Excel.

Given the following column headers (index: value), determine which column corresponds to each field:
- country: destination country or region
- operator: mobile network operator name (optional)
- routeType: route/channel type like HQ, Direct, Bypass, SIM (optional)
- price: numeric price or rate

Headers (0-based index):
${headers.map((h, i) => `${i}: "${h}"`).join('\n')}

Respond ONLY with valid JSON in this exact format (use null if column not found):
{"country": <index or null>, "operator": <index or null>, "routeType": <index or null>, "price": <index or null>}`;

    try {
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0,
        max_tokens: 100,
      });

      const text = response.choices[0]?.message?.content?.trim() ?? '';
      const jsonMatch = text.match(/\{[^}]+\}/);
      if (!jsonMatch) {
        this.logger.warn('AI вернул неожиданный ответ: ' + text);
        return null;
      }

      const parsed: Record<string, number | null> = JSON.parse(jsonMatch[0]);
      const mapping: ColumnMapping = {};

      for (const field of ['country', 'operator', 'routeType', 'price'] as const) {
        const idx = parsed[field];
        if (typeof idx === 'number' && idx >= 0 && idx < headers.length) {
          mapping[field] = idx + 1; // ExcelJS использует 1-based колонки
        }
      }

      this.logger.log(`AI определил колонки: ${JSON.stringify(mapping)}`);
      return mapping;
    } catch (err) {
      this.logger.error('Ошибка запроса к Groq: ' + (err as Error).message);
      return null;
    }
  }

  /**
   * Отправляет произвольный запрос с системным промптом.
   * @returns Ответ модели или null при ошибке.
   */
  async complete(systemPrompt: string, userMessage: string): Promise<string | null> {
    if (!this.groq) return null;

    try {
      const response = await this.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0,
        max_tokens: 300,
      });

      return response.choices[0]?.message?.content?.trim() ?? null;
    } catch (err) {
      this.logger.error('Ошибка запроса к Groq: ' + (err as Error).message);
      return null;
    }
  }
}
