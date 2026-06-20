import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { appConfig } from '@/src/config/environment';
import { InvoicePdfResult } from '@/src/features/invoices/types';
import { apiClient } from '@/src/services/api/api-client';
import { getAccessToken } from '@/src/services/api/auth-token';

export async function downloadInvoicePdf(id: string, preview: boolean): Promise<InvoicePdfResult> {
  const fileName = `invomir-invoice-${id}.pdf`;

  if (Platform.OS === 'web') {
    const response = await apiClient.request<Blob>({
      method: 'GET',
      url: `/api/invoices/${id}/pdf`,
      params: { preview },
      responseType: 'blob',
      headers: {
        Accept: 'application/pdf',
      },
    });
    const resolvedFileName = resolveFileName(response.headers['content-disposition']?.toString(), fileName);
    const objectUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = resolvedFileName;
    anchor.click();
    URL.revokeObjectURL(objectUrl);

    return {
      fileName: resolvedFileName,
      contentType: response.headers['content-type']?.toString() ?? 'application/pdf',
    };
  }

  const token = getAccessToken();
  const baseDirectory = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;

  if (!baseDirectory) {
    throw new Error('PDF download is unavailable on this device.');
  }

  const fileUri = `${baseDirectory}${fileName}`;
  const query = new URLSearchParams({ preview: String(preview) }).toString();
  const download = await FileSystem.downloadAsync(`${appConfig.apiBaseUrl}/api/invoices/${id}/pdf?${query}`, fileUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return {
    fileName,
    contentType: 'application/pdf',
    uri: download.uri,
  };
}

function resolveFileName(contentDisposition: string | undefined, fallback: string): string {
  const match = contentDisposition?.match(/filename="?([^";]+)"?/i);
  return match?.[1] ?? fallback;
}
