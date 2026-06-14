import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { appConfig } from '@/src/config/environment';
import { ReportExportQuery, ReportExportResult } from '@/src/features/reports/types';
import { apiClient } from '@/src/services/api/api-client';
import { getAccessToken } from '@/src/services/api/auth-token';

export async function exportReportFile(query: ReportExportQuery): Promise<ReportExportResult> {
  const params = {
    format: query.format,
    from: query.from,
    to: query.to,
    status: query.status ?? undefined,
  };

  if (Platform.OS === 'web') {
    const response = await apiClient.request<Blob>({
      method: 'GET',
      url: '/api/reports/export',
      params,
      responseType: 'blob',
      headers: {
        Accept: query.format === 'pdf' ? 'application/pdf' : 'text/csv',
      },
    });
    const contentType = response.headers['content-type']?.toString() ?? response.data.type;
    const fileName = resolveFileName(response.headers['content-disposition']?.toString(), query);
    const objectUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(objectUrl);

    return { fileName, contentType };
  }

  const token = getAccessToken();
  const fileName = buildFileName(query);
  const queryString = new URLSearchParams(
    Object.entries(params).reduce<Record<string, string>>((accumulator, [key, value]) => {
      if (value !== undefined) {
        accumulator[key] = String(value);
      }

      return accumulator;
    }, {}),
  ).toString();
  const baseDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

  if (!baseDirectory) {
    throw new Error('File export is unavailable on this device.');
  }

  const fileUri = `${baseDirectory}${fileName}`;
  const download = await FileSystem.downloadAsync(`${appConfig.apiBaseUrl}/api/reports/export?${queryString}`, fileUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return {
    fileName,
    contentType: query.format === 'pdf' ? 'application/pdf' : 'text/csv',
    uri: download.uri,
  };
}

function resolveFileName(contentDisposition: string | undefined, query: ReportExportQuery): string {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? buildFileName(query);
}

function buildFileName(query: ReportExportQuery): string {
  return `invomir-report-${query.from}-${query.to}.${query.format}`;
}
