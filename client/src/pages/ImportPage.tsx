import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { importApi, FilePreview, ImportResult } from '../api/import';
import { providersApi } from '../api/providers';

type Step = 'choice' | 'upload' | 'configure' | 'result' | 'manual';

const FIELD_LABELS: Record<string, string> = {
  operator: 'Оператор',
  country: 'Страна',
  routeType: 'Тип маршрута',
  price: 'Цена',
};

const inputCls =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors';

const selectCls =
  'w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-200 transition-colors';

export default function ImportPage() {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>('choice');
  const [dragOver, setDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [newProviderName, setNewProviderName] = useState('');
  const [providerMode, setProviderMode] = useState<'existing' | 'new'>('existing');
  const [result, setResult] = useState<ImportResult | null>(null);
  const [manualName, setManualName] = useState('');

  const { data: providers } = useQuery({
    queryKey: ['providers'],
    queryFn: providersApi.getAll,
  });

  const previewMutation = useMutation({
    mutationFn: importApi.previewFile,
    onSuccess: (data) => {
      setPreview(data);
      setStep('configure');
    },
  });

  const importMutation = useMutation({
    mutationFn: ({ file, providerId }: { file: File; providerId: string }) =>
      importApi.uploadExcel(file, providerId),
    onSuccess: (data) => {
      setResult(data);
      setStep('result');
      qc.invalidateQueries({ queryKey: ['routes'] });
      qc.invalidateQueries({ queryKey: ['providers'] });
    },
  });

  const createProviderMutation = useMutation({
    mutationFn: providersApi.create,
    onSuccess: (provider) => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      if (uploadedFile) {
        importMutation.mutate({ file: uploadedFile, providerId: provider.id });
      }
    },
  });

  const manualCreateMutation = useMutation({
    mutationFn: providersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] });
      setStep('result');
      setResult(null);
    },
  });

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    setUploadedFile(file);
    setPreview(null);
    previewMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0] ?? null);
  };

  const handleImportConfirm = async () => {
    if (!uploadedFile) return;
    if (providerMode === 'new') {
      if (!newProviderName.trim()) return;
      createProviderMutation.mutate({ name: newProviderName.trim() });
    } else {
      if (!selectedProviderId) return;
      importMutation.mutate({ file: uploadedFile, providerId: selectedProviderId });
    }
  };

  const handleReset = () => {
    setStep('choice');
    setUploadedFile(null);
    setPreview(null);
    setSelectedProviderId('');
    setNewProviderName('');
    setProviderMode('existing');
    setResult(null);
    setManualName('');
    previewMutation.reset();
    importMutation.reset();
    createProviderMutation.reset();
    manualCreateMutation.reset();
  };

  const isImporting = importMutation.isPending || createProviderMutation.isPending;

  const importError =
    (importMutation.error as any)?.response?.data?.message ||
    (createProviderMutation.error as any)?.response?.data?.message ||
    (previewMutation.error as any)?.response?.data?.message;

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-start justify-between">
        <p className="text-sm text-gray-500">Загрузите прайс-лист или внесите данные самостоятельно</p>
        {step !== 'choice' && (
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Начать заново
          </button>
        )}
      </div>

      {/* Step: choice */}
      {step === 'choice' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setStep('upload')}
            className="group flex flex-col items-start gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-indigo-300 hover:shadow-md transition-all text-left"
          >
            <div className="w-11 h-11 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Загрузить файл</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Импорт прайс-листа в формате .xlsx — маршруты добавятся автоматически
              </p>
            </div>
          </button>

          <button
            onClick={() => setStep('manual')}
            className="group flex flex-col items-start gap-4 p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-indigo-300 hover:shadow-md transition-all text-left"
          >
            <div className="w-11 h-11 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">Внести самостоятельно</p>
              <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                Создайте поставщика вручную и добавляйте маршруты через раздел «Маршруты»
              </p>
            </div>
          </button>
        </div>
      )}

      {/* Step: upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !previewMutation.isPending && inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg px-8 py-14 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-gray-300 hover:border-indigo-300 hover:bg-gray-50 bg-white'
            } ${previewMutation.isPending ? 'pointer-events-none opacity-70' : ''}`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
            />
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
            </div>
            {previewMutation.isPending ? (
              <div className="space-y-1">
                <p className="text-gray-700 text-sm font-medium">Анализируем файл...</p>
                <p className="text-gray-400 text-xs">{uploadedFile?.name}</p>
              </div>
            ) : (
              <>
                <p className="text-gray-700 text-sm font-medium">
                  Перетащите файл сюда или{' '}
                  <span className="text-indigo-600">нажмите для выбора</span>
                </p>
                <p className="text-gray-400 text-xs mt-1">Поддерживается .xlsx, .xls — до 10 МБ</p>
              </>
            )}
          </div>

          {previewMutation.isError && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {importError ?? 'Ошибка при чтении файла'}
            </div>
          )}
        </div>
      )}

      {/* Step: configure */}
      {step === 'configure' && preview && (
        <div className="space-y-4">
          {/* File info */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Файл проанализирован</h2>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{uploadedFile?.name}</span>
            </div>

            <div className="flex gap-6">
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-400">Строк данных</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{preview.rowCount}</p>
              </div>
              <div className="bg-gray-50 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-400">Валюта</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{preview.currency}</p>
              </div>
            </div>

            {Object.keys(preview.detectedColumns).length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Распознанные колонки:</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(preview.detectedColumns).map(([field, label]) => (
                    <span
                      key={field}
                      className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full"
                    >
                      <span className="text-indigo-400">{FIELD_LABELS[field] ?? field}:</span>
                      <span className="font-medium">«{label}»</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {preview.sampleRows.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">Пример данных:</p>
                <div className="overflow-x-auto rounded-md border border-gray-100">
                  <table className="text-xs w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-100">
                        <th className="text-left px-3 py-2 font-semibold text-gray-500">Страна</th>
                        {preview.detectedColumns.operator && (
                          <th className="text-left px-3 py-2 font-semibold text-gray-500">Оператор</th>
                        )}
                        {preview.detectedColumns.routeType && (
                          <th className="text-left px-3 py-2 font-semibold text-gray-500">Тип</th>
                        )}
                        <th className="text-right px-3 py-2 font-semibold text-gray-500">Цена</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {preview.sampleRows.map((row, i) => (
                        <tr key={i} className="bg-white">
                          <td className="px-3 py-2 font-medium text-gray-800">{row.country}</td>
                          {preview.detectedColumns.operator && (
                            <td className="px-3 py-2 text-gray-500">{row.operator || '—'}</td>
                          )}
                          {preview.detectedColumns.routeType && (
                            <td className="px-3 py-2 text-gray-500">{row.routeType || '—'}</td>
                          )}
                          <td className="px-3 py-2 text-right font-mono text-gray-800">{row.price}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Provider selection */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-4">
            <h2 className="text-sm font-semibold text-gray-800">Укажите поставщика</h2>

            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
              <button
                onClick={() => setProviderMode('existing')}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  providerMode === 'existing'
                    ? 'bg-white text-gray-900 shadow-sm font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Существующий
              </button>
              <button
                onClick={() => setProviderMode('new')}
                className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                  providerMode === 'new'
                    ? 'bg-white text-gray-900 shadow-sm font-medium'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Создать нового
              </button>
            </div>

            {providerMode === 'existing' ? (
              <div className="max-w-sm">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Поставщик</label>
                <select
                  value={selectedProviderId}
                  onChange={(e) => setSelectedProviderId(e.target.value)}
                  className={selectCls}
                >
                  <option value="">Выберите поставщика...</option>
                  {providers?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {providers?.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Поставщиков нет — создайте нового</p>
                )}
              </div>
            ) : (
              <div className="max-w-sm">
                <label className="block text-xs font-medium text-gray-600 mb-1.5">Название поставщика</label>
                <input
                  type="text"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                  placeholder="Например: Global Limited"
                  className={inputCls}
                />
              </div>
            )}

            {(importError || importMutation.isError || createProviderMutation.isError) && (
              <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {importError ?? 'Ошибка при импорте'}
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleImportConfirm}
                disabled={
                  isImporting ||
                  (providerMode === 'existing' && !selectedProviderId) ||
                  (providerMode === 'new' && !newProviderName.trim())
                }
                className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                {isImporting
                  ? `Импортируем ${preview.rowCount} строк...`
                  : `Импортировать ${preview.rowCount} строк`}
              </button>
              <button
                type="button"
                onClick={() => setStep('upload')}
                className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
              >
                Выбрать другой файл
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step: result */}
      {step === 'result' && (
        <div className="space-y-4">
          {result ? (
            <>
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-sm font-semibold text-gray-800">Результат импорта</h2>
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">{uploadedFile?.name}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-5">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-gray-900">{result.total}</div>
                    <div className="text-xs text-gray-400 mt-1">Строк в файле</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{result.created}</div>
                    <div className="text-xs text-gray-400 mt-1">Создано маршрутов</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-amber-500">{result.skipped}</div>
                    <div className="text-xs text-gray-400 mt-1">Пропущено</div>
                  </div>
                </div>

                {result.total > 0 && (
                  <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.round((result.created / result.total) * 100)}%` }}
                    />
                  </div>
                )}

                {Object.keys(result.detectedColumns).length > 0 && (
                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-medium text-gray-500 mb-2">Распознанные колонки:</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(result.detectedColumns).map(([field, label]) => (
                        <span
                          key={field}
                          className="inline-flex items-center gap-1 text-xs bg-indigo-50 text-indigo-700 border border-indigo-100 px-2.5 py-1 rounded-full"
                        >
                          <span className="text-indigo-400">{FIELD_LABELS[field] ?? field}:</span>
                          <span className="font-medium">«{label}»</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700">Строки с ошибками</h3>
                    <span className="text-xs text-red-500 font-medium">{result.errors.length} шт.</span>
                  </div>
                  <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                    {result.errors.map((err) => (
                      <div key={err.row} className="px-4 py-2.5 flex gap-4 text-sm">
                        <span className="text-gray-400 shrink-0 w-16 text-xs">Строка {err.row}</span>
                        <span className="text-red-600 text-xs">{err.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-900 font-semibold text-sm">Поставщик создан</p>
              <p className="text-gray-400 text-xs mt-1.5">
                Перейдите в раздел «Маршруты», чтобы добавить цены вручную
              </p>
            </div>
          )}

          <button
            onClick={handleReset}
            className="px-5 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 transition-colors shadow-sm"
          >
            Добавить ещё одного поставщика
          </button>
        </div>
      )}

      {/* Step: manual */}
      {step === 'manual' && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 space-y-4 max-w-md">
          <h2 className="text-sm font-semibold text-gray-800">Новый поставщик</h2>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Название поставщика *</label>
            <input
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="Например: МТС, Beeline, SMSHUB"
              className={inputCls}
            />
          </div>

          {manualCreateMutation.isError && (
            <div className="rounded-md bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
              {(manualCreateMutation.error as any)?.response?.data?.message ?? 'Ошибка при создании'}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!manualName.trim()) return;
                manualCreateMutation.mutate({ name: manualName.trim() });
              }}
              disabled={manualCreateMutation.isPending || !manualName.trim()}
              className="px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm"
            >
              {manualCreateMutation.isPending ? 'Создание...' : 'Создать'}
            </button>
            <button
              onClick={() => setStep('choice')}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-800 border border-gray-300 rounded-md transition-colors"
            >
              Назад
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
