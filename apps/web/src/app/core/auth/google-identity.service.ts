import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import { environment } from '../../../environments/environment';

type GoogleButtonText = 'continue_with' | 'signin_with' | 'signup_with';

interface GoogleCredentialResponse {
  credential?: string;
  select_by?: string;
}

interface GoogleInitializeConfig {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}

interface GoogleButtonOptions {
  type: 'standard';
  theme: 'outline';
  size: 'large';
  shape: 'rectangular';
  text: GoogleButtonText;
  logo_alignment: 'left';
  width?: number;
}

interface GoogleAccountsId {
  initialize(config: GoogleInitializeConfig): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
}

interface GoogleIdentity {
  accounts: {
    id: GoogleAccountsId;
  };
}

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}

@Injectable({ providedIn: 'root' })
export class GoogleIdentityService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private scriptLoadPromise: Promise<void> | null = null;

  get isConfigured(): boolean {
    return environment.googleClientId.trim().length > 0;
  }

  async renderButton(
    host: HTMLElement,
    onCredential: (idToken: string) => void,
    text: GoogleButtonText = 'continue_with'
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    if (!this.isConfigured) {
      throw new Error('Google sign-in is not configured.');
    }

    await this.loadScript();

    const google = window.google;
    if (!google) {
      throw new Error('Google sign-in is unavailable.');
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      auto_select: false,
      cancel_on_tap_outside: true,
      callback: response => {
        if (response.credential) {
          onCredential(response.credential);
        }
      }
    });

    const hostWidth = Math.floor(host.getBoundingClientRect().width);
    const buttonWidth = Math.max(Math.min(hostWidth || 320, 400), 240);

    host.replaceChildren();
    google.accounts.id.renderButton(host, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text,
      logo_alignment: 'left',
      width: buttonWidth
    });
  }

  private loadScript(): Promise<void> {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    if (this.scriptLoadPromise) {
      return this.scriptLoadPromise;
    }

    this.scriptLoadPromise = new Promise<void>((resolve, reject) => {
      const existingScript = this.document.querySelector<HTMLScriptElement>(
        'script[src="https://accounts.google.com/gsi/client"]'
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Google sign-in failed to load.')), {
          once: true
        });
        return;
      }

      const script = this.document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Google sign-in failed to load.'));
      this.document.head.appendChild(script);
    });

    return this.scriptLoadPromise;
  }
}
