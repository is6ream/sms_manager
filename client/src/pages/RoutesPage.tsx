import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routesApi } from '../api/routes';
import { providersApi } from '../api/providers';
import type { RouteType, SearchRoutesParams } from '../types';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  bypass: 'Bypass',
  direct: 'Direct',
  hq: 'HQ',
  sim: 'SIM',
};

const ROUTE_TYPE_COLORS: Record<RouteType, string> = {
  bypass: 'bg-yellow-900/50 text-yellow-300 border-yellow-800',
  direct: 'bg-green-900/50 text-green-300 border-green-800',
  hq: 'bg-blue-900/50 text-blue-300 border-blue-800',
  sim: 'bg-purple-900/50 text-purple-300 border-purple-800',
};

const emptyForm = {
  providerId: '',
  country: '',
  routeType: '' as RouteType | '',
  price: '',
  currency: 'USD',
};

export default function RoutesPage() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState<SearchRoutesParams>({});
  const [filterInput, setFilterInput] = useState({ country: '', routeType: '' as RouteType | '', providerId: '', maxPrice: '' });
  const [isSearchActive, setIsSearchActive] = useState(false);

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: providersApi.getAll,
  });

  const { data: allRoutes, isLoading, isError } = useQuery({
    queryKey: ['routes'],
    queryFn: routesApi.getAll,
    enabled: !isSearchActive,
  });

  const { data: searchRoutes, isLoading: isSearchLoading } = useQuery({
    queryKey: ['routes', 'search', filters],
    queryFn: () => routesApi.search(filters),
    enabled: isSearchActive,
  });

  const routes = isSearchActive ? searchRoutes : allRoutes;
  const loading = isLoading || isSearchLoading;

  const createMutation = useMutation({
    mutationFn: routesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes'] });
      setForm(emptyForm);
      setShowForm(false);
      setError('');
    },
    onError: () => setError('Не удалось создать маршрут'),
  });

  const deleteMutation = useMutation({
    mutationFn: routesApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['routes'] }),
    onError: () => setError('Не удалось удалить маршрут'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.providerId || !form.country || !form.routeType || !form.price) {
      setError('Заполните все обязательные поля');
      return;
    }
    createMutation.mutate({
      providerId: form.providerId,
      country: form.country,
      routeType: form.routeType as RouteType,
      price: parseFloat(form.price),
      currency: form.currency || 'USD',
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params: SearchRoutesParams = {};
    if (filterInput.country) params.country = filterInput.country;
    if (filterInput.routeType) params.routeType = filterInput.routeType;
    if (filterInput.providerId) params.providerId = filterInput.providerId;
    if (filterInput.maxPrice) params.maxPrice = parseFloat(filterInput.maxPrice);
    setFilters(params);
    setIsSearchActive(true);
  };

  const handleResetSearch = () => {
    setFilterInput({ country: '', routeType: '', providerId: '', maxPrice: '' });
    setFilters({});
    setIsSearchActive(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Маршруты</h1>
          <p className="text-slate-400 text-sm mt-1">Цены SMS по странам и типам маршрутов</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-slate-100 text-slate-900 text-sm font-medium rounded-md hover:bg-white transition-colors"
        >
          {showForm ? 'Скрыть' : '+ Добавить маршрут'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-900 border border-slate-800 rounded-lg p-5 space-y-4">
          <h2 className="text-sm font-medium text-slate-300">Новый маршрут</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Поставщик *</label>
              <select
                value={form.providerId}
                onChange={(e) => setForm({ ...form, providerId: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
              >
                <option value="">Выберите...</option>
                {providers?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Страна *</label>
              <input
                type="text"
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                placeholder="Япония"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Тип маршрута *</label>
              <select
                value={form.routeType}
                onChange={(e) => setForm({ ...form, routeType: e.target.value as RouteType })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
              >
                <option value="">Выберите...</option>
                <option value="bypass">Bypass</option>
                <option value="direct">Direct</option>
                <option value="hq">HQ</option>
                <option value="sim">SIM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Цена *</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="0.0320"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Валюта</label>
              <input
                type="text"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500"
              />
            </div>
          </div>
          {error && <ErrorMessage message={error} />}
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-slate-100 text-slate-900 text-sm font-medium rounded-md hover:bg-white disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(''); setForm(emptyForm); }}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Отмена
            </button>
          </div>
        </form>
      )}

      <form onSubmit={handleSearch} className="bg-slate-900 border border-slate-800 rounded-lg p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Страна</label>
            <input
              type="text"
              value={filterInput.country}
              onChange={(e) => setFilterInput({ ...filterInput, country: e.target.value })}
              placeholder="Япония"
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500 w-36"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Тип маршрута</label>
            <select
              value={filterInput.routeType}
              onChange={(e) => setFilterInput({ ...filterInput, routeType: e.target.value as RouteType })}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500 w-36"
            >
              <option value="">Все</option>
              <option value="bypass">Bypass</option>
              <option value="direct">Direct</option>
              <option value="hq">HQ</option>
              <option value="sim">SIM</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Поставщик</label>
            <select
              value={filterInput.providerId}
              onChange={(e) => setFilterInput({ ...filterInput, providerId: e.target.value })}
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-slate-500 w-40"
            >
              <option value="">Все</option>
              {providers?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Макс. цена</label>
            <input
              type="number"
              step="0.0001"
              min="0"
              value={filterInput.maxPrice}
              onChange={(e) => setFilterInput({ ...filterInput, maxPrice: e.target.value })}
              placeholder="0.0500"
              className="bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-slate-500 w-32"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="px-4 py-2 bg-slate-700 text-white text-sm rounded-md hover:bg-slate-600 transition-colors"
            >
              Найти
            </button>
            {isSearchActive && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Сбросить
              </button>
            )}
          </div>
        </div>
        {isSearchActive && (
          <p className="text-xs text-slate-500 mt-2">
            Результаты поиска — отсортировано по цене
          </p>
        )}
      </form>

      {loading && <Spinner message="Загрузка маршрутов..." />}
      {isError && <ErrorMessage message="Не удалось загрузить маршруты" />}

      {routes && routes.length === 0 && (
        <p className="text-slate-500 text-sm py-8 text-center">
          {isSearchActive ? 'По вашему запросу ничего не найдено' : 'Маршрутов пока нет'}
        </p>
      )}

      {routes && routes.length > 0 && (
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Страна</th>
                <th className="text-left px-4 py-3 font-medium">Тип</th>
                <th className="text-left px-4 py-3 font-medium">Поставщик</th>
                <th className="text-right px-4 py-3 font-medium">Цена</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Статус</th>
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {routes.map((r) => (
                <tr key={r.id} className="bg-slate-900/50 hover:bg-slate-800/60 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{r.country}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ROUTE_TYPE_COLORS[r.routeType]}`}>
                      {ROUTE_TYPE_LABELS[r.routeType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{r.provider?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-100">
                    {parseFloat(r.price).toFixed(4)}
                    <span className="text-slate-500 ml-1 text-xs">{r.currency}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {r.isActive ? (
                      <span className="text-xs text-green-400">Активен</span>
                    ) : (
                      <span className="text-xs text-slate-500">Отключён</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(r.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-slate-900 border-t border-slate-800 px-4 py-2 text-xs text-slate-500">
            {routes.length} {routes.length === 1 ? 'маршрут' : routes.length < 5 ? 'маршрута' : 'маршрутов'}
          </div>
        </div>
      )}
    </div>
  );
}
