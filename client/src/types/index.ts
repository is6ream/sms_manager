export type RouteType = 'bypass' | 'direct' | 'hq' | 'sim';

export interface Provider {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  providerId: string;
  provider: Provider;
  country: string;
  routeType: RouteType;
  price: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SearchRoutesParams {
  country?: string;
  routeType?: RouteType;
  providerId?: string;
  maxPrice?: number;
}

export interface CreateProviderDto {
  name: string;
}

export interface CreateRouteDto {
  providerId: string;
  country: string;
  routeType: RouteType;
  price: number;
  currency?: string;
  isActive?: boolean;
}
