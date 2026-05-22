import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LucideRotateCcw, LucideSearch } from '@lucide/angular';

import { ClientListFilters } from '../../models/client.models';

@Component({
  selector: 'app-client-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    LucideRotateCcw,
    LucideSearch,
  ],
  templateUrl: './client-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientSearchComponent {
  readonly filters = input.required<ClientListFilters>();
  readonly isLoading = input(false);

  readonly filtersChange = output<Partial<ClientListFilters>>();
  readonly resetRequested = output<void>();

  protected readonly form = new FormGroup({
    searchTerm: new FormControl('', { nonNullable: true }),
  });

  private patchedSearchTerm = '';

  constructor() {
    effect(() => {
      const searchTerm = this.filters().searchTerm ?? '';

      if (searchTerm === this.patchedSearchTerm) {
        return;
      }

      this.patchedSearchTerm = searchTerm;
      this.form.patchValue({ searchTerm }, { emitEvent: false });
    });
  }

  protected applyFilters(): void {
    const searchTerm = this.form.controls.searchTerm.value.trim();
    this.patchedSearchTerm = searchTerm;
    this.filtersChange.emit({ searchTerm, q: searchTerm || null, page: 1 });
  }

  protected resetFilters(): void {
    this.patchedSearchTerm = '';
    this.form.reset({ searchTerm: '' });
    this.resetRequested.emit();
  }
}
