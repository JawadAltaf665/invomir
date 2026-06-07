import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';

import { TranslationService } from './translation.service';

describe('TranslationService', () => {
  let http: HttpTestingController;
  let service: TranslationService;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(TranslationService);
    document = TestBed.inject(DOCUMENT);
  });

  afterEach(() => http.verify());

  it('loads the selected bundle, falls back to English, and applies RTL', async () => {
    const languageChange = firstValueFrom(service.setLanguage('ar'));

    http.expectOne('/assets/i18n/en.json').flush({
      'common.save': 'Save',
      'common.uploadedPercentage': '{{progress}}% uploaded',
    });
    http.expectOne('/assets/i18n/ar.json').flush({
      'common.save': 'حفظ',
    });

    await languageChange;

    expect(service.translate('common.save')).toBe('حفظ');
    expect(service.translate('common.uploadedPercentage', { progress: 40 })).toBe('40% uploaded');
    expect(service.language()).toBe('ar');
    expect(service.direction()).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });
});
