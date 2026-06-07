import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LucideShieldCheck, LucideUpload } from '@lucide/angular';

import { UserProfileDto } from '../../models/settings.models';
import { TranslationService } from '../../../../core/i18n/translation.service';
import {
  acceptedProfilePictureExtensions,
  acceptedProfilePictureTypes,
  formatProfileName,
  formatSettingsDate,
  formatSettingsDateTime,
  formatSettingsLabel,
  isAcceptedProfilePictureFile,
  maxProfilePictureBytes,
  resolveProfilePictureUrl,
} from '../../utils/settings-formatters';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-account-profile-card',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  imports: [TranslatePipe, MatButtonModule, MatProgressBarModule, LucideShieldCheck, LucideUpload],
  templateUrl: './account-profile-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountProfileCardComponent implements OnDestroy {
  private readonly translation = inject(TranslationService);
  readonly profile = input<UserProfileDto | null>(null);
  readonly isLoading = input(false);
  readonly canManage = input(false);
  readonly isUploading = input(false);
  readonly progress = input(0);
  readonly errorMessages = input<readonly string[]>([]);
  readonly successMessage = input('');
  readonly cacheKey = input<string | number>('');

  readonly profilePictureSelected = output<File>();

  protected readonly formatProfileName = formatProfileName;
  protected readonly formatSettingsLabel = formatSettingsLabel;
  protected readonly acceptedFileTypes = [
    ...acceptedProfilePictureTypes,
    ...acceptedProfilePictureExtensions,
  ].join(',');
  protected readonly localErrorMessages = signal<readonly string[]>([]);
  private readonly previewUrl = signal<string | null>(null);

  protected readonly displayProfilePictureUrl = computed(
    () =>
      this.previewUrl() ??
      resolveProfilePictureUrl(this.profile()?.profilePictureUrl ?? null, this.cacheKey()),
  );

  protected readonly profileInitials = computed(() => {
    const profile = this.profile();

    if (!profile) {
      return 'IM';
    }

    const firstInitial = profile.firstName.trim().charAt(0);
    const lastInitial = profile.lastName.trim().charAt(0);
    const initials = `${firstInitial}${lastInitial}`.trim();

    return initials.length > 0 ? initials.toUpperCase() : 'IM';
  });

  ngOnDestroy(): void {
    this.clearPreview();
  }

  protected formatSettingsDate(value: string | null): string {
    return formatSettingsDate(
      value,
      this.translation.language(),
      this.translation.translate('common.notSet'),
    );
  }

  protected formatSettingsDateTime(value: string | null): string {
    return formatSettingsDateTime(
      value,
      this.translation.language(),
      this.translation.translate('common.notSet'),
    );
  }

  protected selectProfilePicture(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file) {
      this.processFile(file);
    }

    input.value = '';
  }

  private processFile(file: File): void {
    if (!this.canManage() || this.isUploading()) {
      return;
    }

    const errors = this.validateFile(file);

    if (errors.length > 0) {
      this.localErrorMessages.set(errors);
      return;
    }

    this.localErrorMessages.set([]);
    this.setPreview(file);
    this.profilePictureSelected.emit(file);
  }

  private validateFile(file: File): readonly string[] {
    const errors: string[] = [];

    if (!isAcceptedProfilePictureFile(file)) {
      errors.push(this.translation.translate('settings.profilePictureTypeError'));
    }

    if (file.size > maxProfilePictureBytes) {
      errors.push(this.translation.translate('settings.profilePictureSizeError'));
    }

    return errors;
  }

  private setPreview(file: File): void {
    this.clearPreview();
    this.previewUrl.set(URL.createObjectURL(file));
  }

  private clearPreview(): void {
    const currentPreviewUrl = this.previewUrl();

    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      this.previewUrl.set(null);
    }
  }
}
