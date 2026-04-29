import api from './client';
import type { Provider, CreateProviderDto } from '../types';

export const providersApi = {
  getAll: (): Promise<Provider[]> =>
    api.get('/providers').then((r) => r.data),

  getOne: (id: string): Promise<Provider> =>
    api.get(`/providers/${id}`).then((r) => r.data),

  create: (dto: CreateProviderDto): Promise<Provider> =>
    api.post('/providers', dto).then((r) => r.data),

  update: (id: string, dto: Partial<CreateProviderDto>): Promise<Provider> =>
    api.patch(`/providers/${id}`, dto).then((r) => r.data),

  remove: (id: string): Promise<void> =>
    api.delete(`/providers/${id}`).then(() => undefined),
};
