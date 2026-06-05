export type SupportedLanguage =
  | 'en'
  | 'fr'
  | 'de'
  | 'es'
  | 'pt-BR'
  | 'ar'
  | 'it'
  | 'nl'
  | 'ur'
  | 'ja'
  | 'ru'
  | 'hi';

export type TextDirection = 'ltr' | 'rtl';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  direction: TextDirection;
}

export const defaultLanguage: SupportedLanguage = 'en';

export const supportedLanguages: readonly LanguageOption[] = [
  { code: 'en', label: 'English', direction: 'ltr' },
  { code: 'fr', label: 'Français', direction: 'ltr' },
  { code: 'de', label: 'Deutsch', direction: 'ltr' },
  { code: 'es', label: 'Español', direction: 'ltr' },
  { code: 'pt-BR', label: 'Português (Brasil)', direction: 'ltr' },
  { code: 'ar', label: 'العربية', direction: 'rtl' },
  { code: 'it', label: 'Italiano', direction: 'ltr' },
  { code: 'nl', label: 'Nederlands', direction: 'ltr' },
  { code: 'ur', label: 'اردو', direction: 'rtl' },
  { code: 'ja', label: '日本語', direction: 'ltr' },
  { code: 'ru', label: 'Русский', direction: 'ltr' },
  { code: 'hi', label: 'हिन्दी', direction: 'ltr' },
] as const;

export function normalizeSupportedLanguage(language: string | null | undefined): SupportedLanguage {
  const match = supportedLanguages.find(
    (option) => option.code.toLowerCase() === language?.trim().toLowerCase(),
  );

  return match?.code ?? defaultLanguage;
}

export function getLanguageOption(language: string | null | undefined): LanguageOption {
  const normalizedLanguage = normalizeSupportedLanguage(language);
  return (
    supportedLanguages.find((option) => option.code === normalizedLanguage) ?? supportedLanguages[0]
  );
}
