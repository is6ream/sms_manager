import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { routesApi } from '../api/routes';
import { providersApi } from '../api/providers';
import type { RouteType, SearchRoutesParams } from '../types';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';
import { useChat } from '../context/ChatContext';

const ROUTE_TYPE_LABELS: Record<RouteType, string> = {
  bypass: 'Bypass',
  direct: 'Direct',
  hq: 'HQ',
  sim: 'SIM',
};

const ROUTE_TYPE_COLORS: Record<RouteType, string> = {
  bypass: 'bg-amber-50 text-amber-700 border-amber-200',
  direct: 'bg-green-50 text-green-700 border-green-200',
  hq: 'bg-blue-50 text-blue-700 border-blue-200',
  sim: 'bg-purple-50 text-purple-700 border-purple-200',
};

const emptyForm = {
  providerId: '',
  country: '',
  routeType: '' as RouteType | '',
  price: '',
  currency: 'USD',
};

const inputCls =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors';

const selectCls =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors';

export default function RoutesPage() {
  const qc = useQueryClient();
  const { openChat } = useChat();
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState<SearchRoutesParams>({});
  const [filterInput, setFilterInput] = useState({
    country: '',
    routeType: '' as RouteType | '',
    providerId: '',
    maxPrice: '',
  });
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
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Цены SMS по странам и типам маршрутов</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
        >
          {showForm ? (
            'Скрыть'
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить маршрут
            </>
          )}
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-800">Новый маршрут</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Поставщик *</label>
                <select
                  value={form.providerId}
                  onChange={(e) => setForm({ ...form, providerId: e.target.value })}
                  className={selectCls}
                >
                  <option value="">Выберите...</option>
                  {providers?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Страна *</label>
                <input
                  type="text"
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  placeholder="Япония"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Тип маршрута *</label>
                <select
                  value={form.routeType}
                  onChange={(e) => setForm({ ...form, routeType: e.target.value as RouteType })}
                  className={selectCls}
                >
                  <option value="">Выберите...</option>
                  <option value="bypass">Bypass</option>
                  <option value="direct">Direct</option>
                  <option value="hq">HQ</option>
                  <option value="sim">SIM</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Цена *</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  placeholder="0.0320"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Валюта</label>
                <input
                  type="text"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            {error && <ErrorMessage message={error} />}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
              >
                {createMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); setForm(emptyForm); }}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 transition-colors"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <form onSubmit={handleSearch}>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Страна</label>
              <input
                type="text"
                value={filterInput.country}
                onChange={(e) => setFilterInput({ ...filterInput, country: e.target.value })}
                placeholder="Япония"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors w-36"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Тип маршрута</label>
              <select
                value={filterInput.routeType}
                onChange={(e) => setFilterInput({ ...filterInput, routeType: e.target.value as RouteType })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors w-36"
              >
                <option value="">Все</option>
                <option value="bypass">Bypass</option>
                <option value="direct">Direct</option>
                <option value="hq">HQ</option>
                <option value="sim">SIM</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Поставщик</label>
              <select
                value={filterInput.providerId}
                onChange={(e) => setFilterInput({ ...filterInput, providerId: e.target.value })}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors w-40"
              >
                <option value="">Все</option>
                {providers?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Макс. цена</label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={filterInput.maxPrice}
                onChange={(e) => setFilterInput({ ...filterInput, maxPrice: e.target.value })}
                placeholder="0.0500"
                className="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors w-32"
              />
            </div>
            <div className="flex gap-2 pb-0.5">
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Найти
              </button>
              {isSearchActive && (
                <button
                  type="button"
                  onClick={handleResetSearch}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
                >
                  Сбросить
                </button>
              )}
            </div>
          </div>
          {isSearchActive && (
            <p className="text-xs text-gray-400 mt-2">Результаты поиска — отсортировано по цене</p>
          )}
        </form>
      </div>

      {loading && <Spinner message="Загрузка маршрутов..." />}
      {isError && <ErrorMessage message="Не удалось загрузить маршруты" />}

      {routes && routes.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">
            {isSearchActive ? 'По вашему запросу ничего не найдено' : 'Маршрутов пока нет'}
          </p>
        </div>
      )}

      {routes && routes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Страна</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Тип</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Поставщик</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Цена</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider hidden sm:table-cell">Статус</th>
                <th className="px-4 py-3 w-8" />
                <th className="px-4 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {routes.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{r.country}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${ROUTE_TYPE_COLORS[r.routeType]}`}>
                      {ROUTE_TYPE_LABELS[r.routeType]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{r.provider?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900">
                    {parseFloat(r.price).toFixed(4)}
                    <span className="text-gray-400 ml-1 text-xs">{r.currency}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {r.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                        Активен
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
                        Отключён
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-3">
                    <button
                      onClick={() => openChat(r)}
                      title="AI-поиск маршрутов"
                      className="text-gray-300 hover:text-indigo-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-4 4-1-4z" />
                      </svg>
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteMutation.mutate(r.id)}
                      disabled={deleteMutation.isPending}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                    >
                      Удалить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 text-xs text-gray-400">
            {routes.length}{' '}
            {routes.length === 1 ? 'маршрут' : routes.length < 5 ? 'маршрута' : 'маршрутов'}
          </div>
        </div>
      )}
    </div>
  );
}
