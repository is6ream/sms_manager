import api from './client';

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  errors: ImportRowError[];
  detectedColumns: Record<string, string>;
}

export interface SampleRow {
  country: string;
  operator: string;
  routeType: string;
  price: string;
}

export interface FilePreview {
  detectedColumns: Record<string, string>;
  rowCount: number;
  currency: string;
  sampleRows: SampleRow[];
}

export const importApi = {
  previewFile: (file: File): Promise<FilePreview> => {
    const formData = new FormData();
    formData.append('file', file);
    return api
      .post('/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },

  uploadExcel: (file: File, providerId: string): Promise<ImportResult> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('providerId', providerId);
    return api
      .post('/import/excel', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
