import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricAvailability {
  available: boolean;
  label: string;
}

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  if (Platform.OS === 'web') {
    return { available: false, label: 'Biometric unlock' };
  }

  const [hasHardware, isEnrolled, supportedTypes] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync(),
  ]);

  return {
    available: hasHardware && isEnrolled,
    label: getBiometricLabel(supportedTypes),
  };
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const availability = await getBiometricAvailability();

  if (!availability.available) {
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    cancelLabel: 'Cancel',
    disableDeviceFallback: false,
    fallbackLabel: 'Use passcode',
    promptMessage: `Unlock InvoMir with ${availability.label}`,
  });

  return result.success;
}

function getBiometricLabel(types: readonly LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return 'Face ID';
  }

  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Fingerprint';
  }

  return 'Biometric unlock';
}
