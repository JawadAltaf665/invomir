import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TeamBadgeTone } from '../../models/team.models';

@Component({
  selector: 'app-team-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span
      class="inline-flex min-w-0 items-center rounded-xl border px-2.5 py-1 text-xs font-medium"
      [ngClass]="badgeClass()"
    >
      {{ label() }}
    </span>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<TeamBadgeTone>('neutral');

  protected badgeClass(): string {
    switch (this.tone()) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'info':
        return 'border-primary/20 bg-primary/10 text-primary';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'danger':
        return 'border-red-200 bg-red-50 text-red-700';
      default:
        return 'border-neutral-200 bg-neutral-50 text-neutral-600';
    }
  }
}
