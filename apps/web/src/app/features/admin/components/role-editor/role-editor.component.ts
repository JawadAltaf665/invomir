import { ChangeDetectionStrategy, Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { LucideSave, LucideShieldCheck } from '@lucide/angular';

import { AdminRole, adminRoles } from '../../models/admin-user.models';
import {
  formatPermissionLabel,
  formatRoleLabel,
  getPermissionGroupsForRole,
  normalizeAdminRole,
} from '../../utils/admin-user-formatters';
import { AdminUserBadgeComponent } from '../admin-user-badge/admin-user-badge.component';

@Component({
  selector: 'app-role-editor',
  standalone: true,
  host: {
    class: 'block',
  },
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    AdminUserBadgeComponent,
    LucideSave,
    LucideShieldCheck,
  ],
  templateUrl: './role-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoleEditorComponent {
  private readonly fb = inject(FormBuilder);

  readonly currentRole = input.required<string>();
  readonly canManage = input(false);
  readonly isSaving = input(false);

  readonly roleSubmitted = output<AdminRole>();

  protected readonly roleOptions = adminRoles.map((role) => ({
    value: role,
    label: formatRoleLabel(role),
  }));
  protected readonly formatPermissionLabel = formatPermissionLabel;
  protected readonly normalizeAdminRole = normalizeAdminRole;

  protected readonly form = this.fb.nonNullable.group({
    role: this.fb.nonNullable.control<AdminRole>('viewer'),
  });

  constructor() {
    effect(() => {
      this.form.patchValue(
        {
          role: normalizeAdminRole(this.currentRole()),
        },
        { emitEvent: false },
      );
    });
  }

  protected submitRole(): void {
    if (!this.canManage() || this.isSaving()) {
      return;
    }

    this.roleSubmitted.emit(this.form.controls.role.value);
  }

  protected permissionGroupsForRole(role: string) {
    return getPermissionGroupsForRole(role);
  }
}
