import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { LucideShieldCheck, LucideUpload } from '@lucide/angular';

import { UserProfileDto } from '../../models/settings.models';
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

@Component({
  selector: 'app-account-profile-card',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  imports: [MatButtonModule, MatProgressBarModule, LucideShieldCheck, LucideUpload],
  templateUrl: './account-profile-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountProfileCardComponent implements OnDestroy {
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
  protected readonly formatSettingsDate = formatSettingsDate;
  protected readonly formatSettingsDateTime = formatSettingsDateTime;
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
      errors.push('Profile picture must be a PNG, JPG, or WEBP file.');
    }

    if (file.size > maxProfilePictureBytes) {
      errors.push('Profile picture file must not exceed 2MB.');
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
