import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providersApi } from '../api/providers';
import type { Provider } from '../types';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

const inputCls =
  'border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors';

export default function ProvidersPage() {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [error, setError] = useState('');

  const { data: providers, isLoading, isError } = useQuery({
    queryKey: ['providers'],
    queryFn: providersApi.getAll,
  });

  const createMutation = useMutation({
    mutationFn: providersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      setName('');
      setError('');
    },
    onError: () => setError('Не удалось создать поставщика'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      providersApi.update(id, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      setEditId(null);
    },
    onError: () => setError('Не удалось обновить поставщика'),
  });

  const deleteMutation = useMutation({
    mutationFn: providersApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
    onError: () => setError('Не удалось удалить поставщика'),
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createMutation.mutate({ name: name.trim() });
  };

  const handleEdit = (p: Provider) => {
    setEditId(p.id);
    setEditName(p.name);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId && editName.trim()) {
      updateMutation.mutate({ id: editId, name: editName.trim() });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">SMS-агрегаторы и их управление</p>

      {/* Add form */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <form onSubmit={handleCreate} className="flex gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название агрегатора"
            className={`flex-1 ${inputCls}`}
          />
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm whitespace-nowrap"
          >
            {createMutation.isPending ? 'Сохранение...' : '+ Добавить'}
          </button>
        </form>
      </div>

      {error && <ErrorMessage message={error} />}

      {isLoading && <Spinner message="Загрузка поставщиков..." />}
      {isError && <ErrorMessage message="Не удалось загрузить поставщиков" />}

      {providers && providers.length === 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm py-16 text-center">
          <p className="text-gray-400 text-sm">Поставщиков пока нет. Добавьте первого.</p>
        </div>
      )}

      {providers && providers.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider">Название</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 text-xs uppercase tracking-wider hidden sm:table-cell">Добавлен</th>
                <th className="px-4 py-3 w-36" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {providers.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {editId === p.id ? (
                      <form onSubmit={handleUpdate} className="flex gap-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className={`${inputCls} w-48`}
                        />
                        <button
                          type="submit"
                          className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-md transition-colors"
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditId(null)}
                          className="text-xs text-gray-400 hover:text-gray-700 px-2"
                        >
                          Отмена
                        </button>
                      </form>
                    ) : (
                      <span className="font-medium text-gray-900">{p.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                    {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-4">
                      <button
                        onClick={() => handleEdit(p)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(p.id)}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-2.5 text-xs text-gray-400">
            {providers.length}{' '}
            {providers.length === 1 ? 'поставщик' : providers.length < 5 ? 'поставщика' : 'поставщиков'}
          </div>
        </div>
      )}
    </div>
  );
}
