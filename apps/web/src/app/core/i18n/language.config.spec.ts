import { describe, expect, it } from 'vitest';

import {
  defaultLanguage,
  getLanguageOption,
  normalizeSupportedLanguage,
  supportedLanguages,
} from './language.config';

describe('language configuration', () => {
  it('registers every supported language in one configuration', () => {
    expect(supportedLanguages.map((language) => language.code)).toEqual([
      'en',
      'fr',
      'de',
      'es',
      'pt-BR',
      'ar',
      'it',
      'nl',
      'ur',
      'ja',
      'ru',
      'hi',
    ]);
  });

  it('normalizes supported language codes and falls back to English', () => {
    expect(normalizeSupportedLanguage(' PT-br ')).toBe('pt-BR');
    expect(normalizeSupportedLanguage('unsupported')).toBe(defaultLanguage);
    expect(normalizeSupportedLanguage(null)).toBe(defaultLanguage);
  });

  it('marks Arabic and Urdu as right-to-left languages', () => {
    expect(getLanguageOption('ar').direction).toBe('rtl');
    expect(getLanguageOption('ur').direction).toBe('rtl');
    expect(getLanguageOption('fr').direction).toBe('ltr');
  });
});
