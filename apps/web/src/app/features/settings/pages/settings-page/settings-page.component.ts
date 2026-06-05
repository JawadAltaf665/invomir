import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { LucideRefreshCcw } from '@lucide/angular';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { permissions } from '../../../../core/permissions/permissions';
import { AccountProfileCardComponent } from '../../components/account-profile-card/account-profile-card.component';
import { BusinessProfileFormComponent } from '../../components/business-profile-form/business-profile-form.component';
import { LogoUploadCardComponent } from '../../components/logo-upload-card/logo-upload-card.component';
import { PasswordChangeFormComponent } from '../../components/password-change-form/password-change-form.component';
import { ChangePasswordRequest, UpdateUserProfileRequest } from '../../models/settings.models';
import { SettingsStore } from '../../store/settings.store';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [
    TranslatePipe,
    MatButtonModule,
    AccountProfileCardComponent,
    BusinessProfileFormComponent,
    LogoUploadCardComponent,
    PasswordChangeFormComponent,
    LucideRefreshCcw,
  ],
  templateUrl: './settings-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsPageComponent implements OnInit {
  protected readonly settingsStore = inject(SettingsStore);
  private readonly authSession = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly canManageSettings = computed(() =>
    this.authSession.hasPermission(permissions.settings.manage),
  );

  protected readonly canEditBusinessProfile = computed(
    () => this.canManageSettings() && this.settingsStore.profile() !== null,
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.settingsStore.loadProfile();
  }

  protected refresh(): void {
    this.settingsStore.loadProfile();
  }

  protected saveBusinessProfile(request: UpdateUserProfileRequest): void {
    this.settingsStore.saveProfile(request).subscribe({
      error: () => undefined,
    });
  }

  protected uploadLogo(file: File): void {
    this.settingsStore.uploadLogo(file).subscribe({
      error: () => undefined,
    });
  }

  protected uploadProfilePicture(file: File): void {
    this.settingsStore.uploadProfilePicture(file).subscribe({
      error: () => undefined,
    });
  }

  protected changePassword(request: ChangePasswordRequest): void {
    this.settingsStore.changePassword(request).subscribe({
      next: () => {
        this.authSession.clearSession();
        void this.router.navigate(['/auth/login']);
      },
      error: () => undefined,
    });
  }
}
