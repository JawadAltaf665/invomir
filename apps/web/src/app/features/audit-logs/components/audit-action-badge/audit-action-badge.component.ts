import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { AuditLogListItemView } from '../../models/audit-log.models';

@Component({
  selector: 'app-audit-action-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './audit-action-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditActionBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<AuditLogListItemView['actionTone']>('neutral');

  protected badgeClass(): string {
    const baseClass =
      'inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium';

    return `${baseClass} ${this.toneClass()}`;
  }

  private toneClass(): string {
    switch (this.tone()) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50 text-emerald-700';
      case 'warning':
        return 'border-amber-200 bg-amber-50 text-amber-700';
      case 'danger':
        return 'border-red-200 bg-red-50 text-red-700';
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-700';
      default:
        return 'border-neutral-200 bg-neutral-50 text-neutral-600';
    }
  }
}
