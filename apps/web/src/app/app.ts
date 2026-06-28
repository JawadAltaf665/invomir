import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthSessionService } from './core/auth/auth-session.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly authSession = inject(AuthSessionService);
}
