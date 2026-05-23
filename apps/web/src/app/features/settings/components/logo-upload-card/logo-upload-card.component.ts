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
import { LucideImage, LucideUpload } from '@lucide/angular';

import { UserProfileDto } from '../../models/settings.models';
import {
  acceptedLogoExtensions,
  acceptedLogoTypes,
  isAcceptedLogoFile,
  maxLogoBytes,
  resolveLogoUrl,
} from '../../utils/settings-formatters';

@Component({
  selector: 'app-logo-upload-card',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  imports: [MatButtonModule, MatProgressBarModule, LucideImage, LucideUpload],
  templateUrl: './logo-upload-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogoUploadCardComponent implements OnDestroy {
  readonly profile = input<UserProfileDto | null>(null);
  readonly canManage = input(false);
  readonly isUploading = input(false);
  readonly progress = input(0);
  readonly errorMessages = input<readonly string[]>([]);
  readonly successMessage = input('');

  readonly logoSelected = output<File>();

  protected readonly acceptedFileTypes = [...acceptedLogoTypes, ...acceptedLogoExtensions].join(
    ',',
  );
  protected readonly localErrorMessages = signal<readonly string[]>([]);
  protected readonly isDragging = signal(false);
  private readonly previewUrl = signal<string | null>(null);

  protected readonly displayLogoUrl = computed(
    () => this.previewUrl() ?? resolveLogoUrl(this.profile()?.logoUrl ?? null),
  );

  ngOnDestroy(): void {
    this.clearPreview();
  }

  protected selectLogo(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (file) {
      this.processFile(file);
    }

    input.value = '';
  }

  protected handleDragOver(event: DragEvent): void {
    if (!this.canManage() || this.isUploading()) {
      return;
    }

    event.preventDefault();
    this.isDragging.set(true);
  }

  protected handleDragLeave(): void {
    this.isDragging.set(false);
  }

  protected handleDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);

    if (!this.canManage() || this.isUploading()) {
      return;
    }

    const file = event.dataTransfer?.files?.[0] ?? null;

    if (file) {
      this.processFile(file);
    }
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
    this.logoSelected.emit(file);
  }

  private validateFile(file: File): readonly string[] {
    const errors: string[] = [];

    if (!isAcceptedLogoFile(file)) {
      errors.push('Logo must be a PNG, JPG, or SVG file.');
    }

    if (file.size > maxLogoBytes) {
      errors.push('Logo file must not exceed 2MB.');
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
