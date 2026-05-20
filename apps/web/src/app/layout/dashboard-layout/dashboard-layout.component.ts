import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../core/auth/auth-session.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [MatButtonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './dashboard-layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardLayoutComponent {
  protected readonly authSession = inject(AuthSessionService);
  protected readonly isLoggingOut = signal(false);
  private readonly router = inject(Router);

  protected logout(): void {
    if (this.isLoggingOut()) {
      return;
    }

    this.isLoggingOut.set(true);
    this.authSession
      .logout()
      .pipe(finalize(() => this.isLoggingOut.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/auth/login']),
        error: () => void this.router.navigate(['/auth/login'])
      });
  }
}
