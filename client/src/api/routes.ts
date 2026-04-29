import api from './client';
import type { Route, CreateRouteDto, SearchRoutesParams } from '../types';

export const routesApi = {
  getAll: (): Promise<Route[]> =>
    api.get('/routes').then((r) => r.data),

  getOne: (id: string): Promise<Route> =>
    api.get(`/routes/${id}`).then((r) => r.data),

  search: (params: SearchRoutesParams): Promise<Route[]> =>
    api.get('/routes/search', { params }).then((r) => r.data),

  create: (dto: CreateRouteDto): Promise<Route> =>
    api.post('/routes', dto).then((r) => r.data),

  update: (id: string, dto: Partial<CreateRouteDto>): Promise<Route> =>
    api.patch(`/routes/${id}`, dto).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/routes/${id}`).then(() => undefined),
};
