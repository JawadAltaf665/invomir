import { ChangeDetectionStrategy, Component, ElementRef, ViewChild, inject, input, output, signal } from '@angular/core';

import { GoogleIdentityService } from '../../../../core/auth/google-identity.service';

type GoogleButtonText = 'continue_with' | 'signin_with' | 'signup_with';

@Component({
  selector: 'app-google-auth-button',
  standalone: true,
  templateUrl: './google-auth-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GoogleAuthButtonComponent {
  @ViewChild('buttonHost', { static: true })
  private readonly buttonHost?: ElementRef<HTMLElement>;

  private readonly googleIdentity = inject(GoogleIdentityService);

  readonly disabled = input(false);
  readonly text = input<GoogleButtonText>('continue_with');
  readonly credential = output<string>();
  readonly failed = output<string>();

  protected readonly localError = signal<string | null>(null);

  ngAfterViewInit(): void {
    void this.renderGoogleButton();
  }

  private async renderGoogleButton(): Promise<void> {
    const host = this.buttonHost?.nativeElement;
    if (!host) {
      return;
    }

    try {
      await this.googleIdentity.renderButton(
        host,
        idToken => {
          this.localError.set(null);
          this.credential.emit(idToken);
        },
        this.text()
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google sign-in is unavailable.';
      this.localError.set(message);
      this.failed.emit(message);
    }
  }
}
