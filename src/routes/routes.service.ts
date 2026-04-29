import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from './entities/route.entity';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { SearchRoutesDto } from './dto/search-routes.dto';

@Injectable()
export class RoutesService {
  constructor(
    @InjectRepository(Route)
    private readonly routesRepository: Repository<Route>,
  ) {}

  create(dto: CreateRouteDto): Promise<Route> {
    const route = this.routesRepository.create(dto);
    return this.routesRepository.save(route);
  }

  findAll(): Promise<Route[]> {
    return this.routesRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Route> {
    const route = await this.routesRepository.findOne({ where: { id } });
    if (!route) {
      throw new NotFoundException(`Маршрут с id "${id}" не найден`);
    }
    return route;
  }

  async update(id: string, dto: UpdateRouteDto): Promise<Route> {
    const route = await this.findOne(id);
    Object.assign(route, dto);
    return this.routesRepository.save(route);
  }

  async remove(id: string): Promise<void> {
    const route = await this.findOne(id);
    await this.routesRepository.remove(route);
  }

  search(filters: SearchRoutesDto): Promise<Route[]> {
    const qb = this.routesRepository
      .createQueryBuilder('route')
      .leftJoinAndSelect('route.provider', 'provider')
      .orderBy('route.price', 'ASC');

    if (filters.country) {
      qb.andWhere('LOWER(route.country) LIKE LOWER(:country)', {
        country: `%${filters.country}%`,
      });
    }

    if (filters.routeType) {
      qb.andWhere('route.routeType = :routeType', { routeType: filters.routeType });
    }

    if (filters.providerId) {
      qb.andWhere('route.providerId = :providerId', { providerId: filters.providerId });
    }

    if (filters.maxPrice !== undefined) {
      qb.andWhere('route.price <= :maxPrice', { maxPrice: filters.maxPrice });
    }

    return qb.getMany();
  }
}
