import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { AdminBadgeTone } from '../../models/admin-user.models';
import { adminBadgeClass } from '../../utils/admin-user-formatters';

@Component({
  selector: 'app-admin-user-badge',
  standalone: true,
  imports: [NgClass],
  templateUrl: './admin-user-badge.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUserBadgeComponent {
  readonly label = input.required<string>();
  readonly tone = input<AdminBadgeTone>('neutral');

  protected readonly badgeClass = computed(() => adminBadgeClass(this.tone()));
}
