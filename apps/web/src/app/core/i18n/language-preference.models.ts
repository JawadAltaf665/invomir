import { SupportedLanguage } from './language.config';

export interface LanguagePreferenceDto {
  language: SupportedLanguage | string;
}

export interface UpdateLanguagePreferenceRequest {
  language: SupportedLanguage;
}
