import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-form-shell',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './auth-form-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthFormShellComponent {
  readonly title = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly footerLabel = input<string | null>(null);
  readonly footerLinkText = input<string | null>(null);
  readonly footerLink = input<string | null>(null);
}
