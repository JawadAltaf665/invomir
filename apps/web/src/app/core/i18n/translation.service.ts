import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { Observable, catchError, firstValueFrom, forkJoin, map, of, shareReplay, tap } from 'rxjs';

import {
  SupportedLanguage,
  TextDirection,
  defaultLanguage,
  getLanguageOption,
  normalizeSupportedLanguage,
} from './language.config';
import { TranslationKey } from './translation-key';

type TranslationDictionary = Readonly<Record<string, string>>;
type TranslationParameters = Readonly<Record<string, string | number>>;

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly fallbackTranslationsSignal = signal<TranslationDictionary>({});
  private readonly translationsSignal = signal<TranslationDictionary>({});
  private readonly languageSignal = signal<SupportedLanguage>(defaultLanguage);
  private readonly cache = new Map<SupportedLanguage, Observable<TranslationDictionary>>();

  readonly language = this.languageSignal.asReadonly();
  readonly direction = computed<TextDirection>(() => getLanguageOption(this.language()).direction);

  initialize(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      this.applyDocumentLanguage(defaultLanguage);
      return Promise.resolve();
    }

    return firstValueFrom(this.setLanguage(defaultLanguage));
  }

  setLanguage(language: string): Observable<void> {
    const normalizedLanguage = normalizeSupportedLanguage(language);

    if (!isPlatformBrowser(this.platformId)) {
      this.languageSignal.set(normalizedLanguage);
      this.applyDocumentLanguage(normalizedLanguage);
      return of(void 0);
    }

    return forkJoin({
      fallback: this.loadTranslations(defaultLanguage),
      selected: this.loadTranslations(normalizedLanguage),
    }).pipe(
      tap(({ fallback, selected }) => {
        this.fallbackTranslationsSignal.set(fallback);
        this.translationsSignal.set(selected);
        this.languageSignal.set(normalizedLanguage);
        this.applyDocumentLanguage(normalizedLanguage);
      }),
      map(() => void 0),
    );
  }

  translate(key: TranslationKey | string, parameters: TranslationParameters = {}): string {
    const value = this.translationsSignal()[key] ?? this.fallbackTranslationsSignal()[key] ?? key;

    return Object.entries(parameters).reduce(
      (translatedValue, [parameter, replacement]) =>
        translatedValue.replaceAll(`{{${parameter}}}`, String(replacement)),
      value,
    );
  }

  private loadTranslations(language: SupportedLanguage): Observable<TranslationDictionary> {
    const cachedTranslations = this.cache.get(language);
    if (cachedTranslations) {
      return cachedTranslations;
    }

    const translations = this.http.get<TranslationDictionary>(`/assets/i18n/${language}.json`).pipe(
      catchError(() =>
        language === defaultLanguage ? of({}) : this.loadTranslations(defaultLanguage),
      ),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.cache.set(language, translations);
    return translations;
  }

  private applyDocumentLanguage(language: SupportedLanguage): void {
    const option = getLanguageOption(language);
    this.document.documentElement.lang = option.code;
    this.document.documentElement.dir = option.direction;
  }
}
