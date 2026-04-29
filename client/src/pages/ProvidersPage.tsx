import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providersApi } from '../api/providers';
import type { Provider } from '../types';
import Spinner from '../components/Spinner';
import ErrorMessage from '../components/ErrorMessage';

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">Поставщики</h1>
        <p className="text-slate-400 text-sm mt-1">SMS-агрегаторы и их управление</p>
      </div>

      <form onSubmit={handleCreate} className="flex gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название агрегатора"
          className="flex-1 bg-slate-800 border border-slate-700 rounded-md px-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
        />
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="px-5 py-2 bg-slate-100 text-slate-900 text-sm font-medium rounded-md hover:bg-white disabled:opacity-50 transition-colors"
        >
          {createMutation.isPending ? 'Сохранение...' : 'Добавить'}
        </button>
      </form>

      {error && <ErrorMessage message={error} />}

      {isLoading && <Spinner message="Загрузка поставщиков..." />}
      {isError && <ErrorMessage message="Не удалось загрузить поставщиков" />}

      {providers && providers.length === 0 && (
        <p className="text-slate-500 text-sm py-8 text-center">
          Поставщиков пока нет. Добавьте первого.
        </p>
      )}

      {providers && providers.length > 0 && (
        <div className="rounded-lg border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Название</th>
                <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Добавлен</th>
                <th className="px-4 py-3 w-28" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {providers.map((p) => (
                <tr key={p.id} className="bg-slate-900/50 hover:bg-slate-800/60 transition-colors">
                  <td className="px-4 py-3">
                    {editId === p.id ? (
                      <form onSubmit={handleUpdate} className="flex gap-2">
                        <input
                          autoFocus
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-slate-400 w-48"
                        />
                        <button type="submit" className="text-xs text-slate-300 hover:text-white px-2 py-1 bg-slate-700 rounded">
                          Сохранить
                        </button>
                        <button type="button" onClick={() => setEditId(null)} className="text-xs text-slate-500 hover:text-slate-300">
                          Отмена
                        </button>
                      </form>
                    ) : (
                      <span className="text-white font-medium">{p.name}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 hidden sm:table-cell">
                    {new Date(p.createdAt).toLocaleDateString('ru-RU')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => handleEdit(p)}
                        className="text-xs text-slate-400 hover:text-white transition-colors"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(p.id)}
                        disabled={deleteMutation.isPending}
                        className="text-xs text-red-500 hover:text-red-400 transition-colors disabled:opacity-50"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
