import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { DashboardStatCard, DashboardTone } from '../../models/dashboard.models';

@Component({
  selector: 'app-revenue-card',
  standalone: true,
  templateUrl: './revenue-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RevenueCardComponent {
  readonly card = input.required<DashboardStatCard>();

  protected readonly toneClass = computed(() => this.toToneClass(this.card().tone));

  private toToneClass(tone: DashboardTone): string {
    const toneClassByKey: Record<DashboardTone, string> = {
      neutral: 'bg-neutral-300',
      primary: 'bg-primary',
      success: 'bg-emerald-500',
      warning: 'bg-amber-500',
      danger: 'bg-red-500',
    };

    return `mt-1 size-2.5 shrink-0 rounded-full ${toneClassByKey[tone]}`;
  }
}
