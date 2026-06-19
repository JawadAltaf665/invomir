import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { AuthTokenDto } from '@/src/features/auth/types';

const sessionKey = 'invomir.mobile.session';

export async function saveSession(token: AuthTokenDto): Promise<void> {
  await writeSecureValue(sessionKey, JSON.stringify(token));
}

export async function loadSession(): Promise<AuthTokenDto | null> {
  const raw = await readSecureValue(sessionKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthTokenDto;
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await deleteSecureValue(sessionKey);
}

async function writeSecureValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.setItem(key, value);
    return;
  }

  await SecureStore.setItemAsync(key, value);
}

async function readSecureValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return window.localStorage.getItem(key);
  }

  return SecureStore.getItemAsync(key);
}

async function deleteSecureValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    window.localStorage.removeItem(key);
    return;
  }

  await SecureStore.deleteItemAsync(key);
}
