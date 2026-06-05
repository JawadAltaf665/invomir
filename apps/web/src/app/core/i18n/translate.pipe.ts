import { Pipe, PipeTransform, inject } from '@angular/core';

import { TranslationService } from './translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(key: string, parameters: Readonly<Record<string, string | number>> = {}): string {
    return this.translation.translate(key, parameters);
  }
}
