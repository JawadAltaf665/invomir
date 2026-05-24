import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { LucideChevronLeft, LucideChevronRight } from '@lucide/angular';

type PaginationItem = number | 'ellipsis';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    LucideChevronLeft,
    LucideChevronRight,
  ],
  templateUrl: './pagination.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  readonly page = input(1);
  readonly pageSize = input(20);
  readonly totalCount = input(0);
  readonly totalPages = input(0);
  readonly isLoading = input(false);
  readonly pageSizeOptions = input<readonly number[]>([10, 20, 50, 100]);
  readonly itemLabel = input('items');

  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  protected readonly safePageSize = computed(() => Math.max(1, this.pageSize() || 20));
  protected readonly safeTotalPages = computed(() =>
    Math.max(1, this.totalPages() || Math.ceil(this.totalCount() / this.safePageSize()) || 1),
  );
  protected readonly currentPage = computed(() =>
    Math.min(Math.max(1, this.page() || 1), this.safeTotalPages()),
  );
  protected readonly startItem = computed(() =>
    this.totalCount() === 0 ? 0 : (this.currentPage() - 1) * this.safePageSize() + 1,
  );
  protected readonly endItem = computed(() =>
    Math.min(this.totalCount(), this.currentPage() * this.safePageSize()),
  );
  protected readonly pageItems = computed<readonly PaginationItem[]>(() => {
    const totalPages = this.safeTotalPages();
    const currentPage = this.currentPage();

    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);

    if (currentPage <= 3) {
      pages.add(2);
      pages.add(3);
      pages.add(4);
    }

    if (currentPage >= totalPages - 2) {
      pages.add(totalPages - 1);
      pages.add(totalPages - 2);
      pages.add(totalPages - 3);
    }

    const sortedPages = Array.from(pages)
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((left, right) => left - right);
    const items: PaginationItem[] = [];

    sortedPages.forEach((page, index) => {
      const previousPage = sortedPages[index - 1];

      if (previousPage && page - previousPage > 1) {
        items.push('ellipsis');
      }

      items.push(page);
    });

    return items;
  });

  protected goToPreviousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  protected goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  protected goToPage(page: number): void {
    const nextPage = Math.min(Math.max(1, page), this.safeTotalPages());

    if (nextPage === this.currentPage() || this.isLoading()) {
      return;
    }

    this.pageChange.emit(nextPage);
  }

  protected changePageSize(pageSize: number): void {
    const nextPageSize = Number(pageSize);

    if (
      !Number.isFinite(nextPageSize) ||
      nextPageSize === this.safePageSize() ||
      this.isLoading()
    ) {
      return;
    }

    this.pageSizeChange.emit(nextPageSize);
  }

  protected pageItemTrack(item: PaginationItem, index: number): string {
    return item === 'ellipsis' ? `ellipsis-${index}` : `page-${item}`;
  }

  protected pageButtonClass(page: number): string {
    const baseClass =
      'grid h-10 min-w-10 place-items-center rounded-xl border px-3 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60';

    return page === this.currentPage()
      ? `${baseClass} border-primary bg-primary text-white`
      : `${baseClass} border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50`;
  }
}
