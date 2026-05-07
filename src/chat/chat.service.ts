import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Route, RouteType } from '../routes/entities/route.entity';
import { AiService } from '../ai/ai.service';
import { AskQuestionDto, ChatAnswerDto } from './dto/ask-question.dto';

type ParsedSearchParams = {
  country: string | null;
  routeType: RouteType | null;
  maxPrice: number | null;
};

const PARSE_SYSTEM_PROMPT = `Ты помощник, который извлекает параметры поиска SMS-маршрутов из текстового запроса менеджера.

Доступные типы маршрутов (routeType): bypass, direct, hq, sim.

Из сообщения пользователя извлеки:
- country: название страны (или null)
- routeType: тип маршрута — одно из: bypass, direct, hq, sim (или null)
- maxPrice: максимальная цена (число, или null)

Отвечай ТОЛЬКО валидным JSON без пояснений:
{"country": "...", "routeType": "...", "maxPrice": 0.05}`;

const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  [RouteType.BYPASS]: 'Bypass',
  [RouteType.DIRECT]: 'Direct',
  [RouteType.HQ]: 'HQ',
  [RouteType.SIM]: 'SIM',
};

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(Route)
    private readonly routesRepo: Repository<Route>,
    private readonly aiService: AiService,
  ) {}

  async ask(dto: AskQuestionDto): Promise<ChatAnswerDto> {
    const params = await this.parseSearchParams(dto.message);

    if (!params.country && !params.routeType && params.maxPrice === null) {
      return {
        answer: 'Не удалось определить параметры поиска. Попробуйте уточнить запрос, например: «лучшие маршруты в Россию» или «Direct-маршруты дешевле 0.05».',
      };
    }

    const routes = await this.findBestRoutes(params);

    if (routes.length === 0) {
      return { answer: this.buildNotFoundMessage(params) };
    }

    return { answer: this.formatRoutes(routes, params) };
  }

  private async parseSearchParams(message: string): Promise<ParsedSearchParams> {
    const raw = await this.aiService.complete(PARSE_SYSTEM_PROMPT, message);

    if (!raw) {
      return { country: null, routeType: null, maxPrice: null };
    }

    try {
      const jsonMatch = raw.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) return { country: null, routeType: null, maxPrice: null };

      const parsed = JSON.parse(jsonMatch[0]);
      const validRouteTypes = Object.values(RouteType) as string[];

      return {
        country: typeof parsed.country === 'string' && parsed.country !== 'null' ? parsed.country : null,
        routeType:
          typeof parsed.routeType === 'string' && validRouteTypes.includes(parsed.routeType)
            ? (parsed.routeType as RouteType)
            : null,
        maxPrice: typeof parsed.maxPrice === 'number' ? parsed.maxPrice : null,
      };
    } catch {
      this.logger.warn('Не удалось распарсить JSON от AI: ' + raw);
      return { country: null, routeType: null, maxPrice: null };
    }
  }

  private async findBestRoutes(params: ParsedSearchParams): Promise<Route[]> {
    const qb = this.routesRepo
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.provider', 'provider')
      .where('route.isActive = :isActive', { isActive: true });

    if (params.country) {
      qb.andWhere('LOWER(route.country) LIKE LOWER(:country)', {
        country: `%${params.country}%`,
      });
    }

    if (params.routeType) {
      qb.andWhere('route.routeType = :routeType', { routeType: params.routeType });
    }

    if (params.maxPrice !== null) {
      qb.andWhere('route.price <= :maxPrice', { maxPrice: params.maxPrice });
    }

    return qb.orderBy('route.price', 'ASC').limit(5).getMany();
  }

  private formatRoutes(routes: Route[], params: ParsedSearchParams): string {
    const header = this.buildHeader(params);
    const lines = routes.map((r, i) => {
      const type = ROUTE_TYPE_LABELS[r.routeType] ?? r.routeType;
      const operator = r.operator ? ` (${r.operator})` : '';
      return `${i + 1}. ${r.country}${operator} — ${type} — ${r.provider?.name ?? '—'} — ${Number(r.price).toFixed(4)} ${r.currency}`;
    });

    return `${header}\n\n${lines.join('\n')}`;
  }

  private buildHeader(params: ParsedSearchParams): string {
    const parts: string[] = [];
    if (params.country) parts.push(`страна: ${params.country}`);
    if (params.routeType) parts.push(`тип: ${ROUTE_TYPE_LABELS[params.routeType]}`);
    if (params.maxPrice !== null) parts.push(`макс. цена: ${params.maxPrice}`);
    return `Лучшие маршруты (${parts.join(', ')}):`;
  }

  private buildNotFoundMessage(params: ParsedSearchParams): string {
    const parts: string[] = [];
    if (params.country) parts.push(`страна «${params.country}»`);
    if (params.routeType) parts.push(`тип ${ROUTE_TYPE_LABELS[params.routeType]}`);
    if (params.maxPrice !== null) parts.push(`цена ≤ ${params.maxPrice}`);
    return `Активных маршрутов не найдено (${parts.join(', ')}).`;
  }
}
