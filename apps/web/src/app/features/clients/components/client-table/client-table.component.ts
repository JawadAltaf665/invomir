import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from '@angular/router';
import {
  LucideChevronDown,
  LucideChevronUp,
  LucideEdit3,
  LucideEye,
  LucideTrash2,
  LucideUserPlus,
} from '@lucide/angular';

import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { ClientListItemView } from '../../models/client.models';

@Component({
  selector: 'app-client-table',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    RouterLink,
    PaginationComponent,
    LucideChevronDown,
    LucideChevronUp,
    LucideEdit3,
    LucideEye,
    LucideTrash2,
    LucideUserPlus,
  ],
  templateUrl: './client-table.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientTableComponent {
  readonly rows = input.required<readonly ClientListItemView[]>();
  readonly isLoading = input(false);
  readonly currentPage = input(1);
  readonly pageSize = input(20);
  readonly totalPages = input(0);
  readonly totalCount = input(0);
  readonly canCreate = input(false);
  readonly canUpdate = input(false);
  readonly canDelete = input(false);

  readonly pageRequested = output<number>();
  readonly pageSizeRequested = output<number>();
  readonly createRequested = output<void>();
  readonly deleteRequested = output<ClientListItemView>();

  protected readonly skeletonRows = [1, 2, 3, 4, 5] as const;
  protected readonly openActionClientId = signal<string | null>(null);
}
