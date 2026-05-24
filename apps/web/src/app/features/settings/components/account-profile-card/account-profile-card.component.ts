import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideShieldCheck, LucideUsers } from '@lucide/angular';

import { UserProfileDto } from '../../models/settings.models';
import {
  formatProfileName,
  formatSettingsDate,
  formatSettingsDateTime,
  formatSettingsLabel,
} from '../../utils/settings-formatters';

@Component({
  selector: 'app-account-profile-card',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  imports: [LucideShieldCheck, LucideUsers],
  templateUrl: './account-profile-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountProfileCardComponent {
  readonly profile = input<UserProfileDto | null>(null);
  readonly isLoading = input(false);

  protected readonly formatProfileName = formatProfileName;
  protected readonly formatSettingsDate = formatSettingsDate;
  protected readonly formatSettingsDateTime = formatSettingsDateTime;
  protected readonly formatSettingsLabel = formatSettingsLabel;
}
