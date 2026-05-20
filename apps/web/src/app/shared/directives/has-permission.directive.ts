import { Directive, Input, TemplateRef, ViewContainerRef, effect, inject } from '@angular/core';

import { AuthSessionService } from '../../core/auth/auth-session.service';
import { Permission } from '../../core/permissions/permissions';

@Directive({
  selector: '[appHasPermission]',
  standalone: true
})
export class HasPermissionDirective {
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly authSession = inject(AuthSessionService);
  private requiredPermissions: readonly Permission[] = [];
  private hasView = false;

  @Input()
  set appHasPermission(permission: Permission | readonly Permission[]) {
    this.requiredPermissions = Array.isArray(permission) ? permission : [permission];
    this.updateView();
  }

  constructor() {
    effect(() => {
      this.authSession.permissions();
      this.updateView();
    });
  }

  private updateView(): void {
    const canView =
      this.requiredPermissions.length === 0 || this.authSession.hasAnyPermission(this.requiredPermissions);

    if (canView && !this.hasView) {
      this.viewContainerRef.createEmbeddedView(this.templateRef);
      this.hasView = true;
      return;
    }

    if (!canView && this.hasView) {
      this.viewContainerRef.clear();
      this.hasView = false;
    }
  }
}
