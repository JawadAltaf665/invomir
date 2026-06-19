import { Injectable, inject, signal } from '@angular/core';
import { finalize, map, switchMap } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  AdminPlan,
  AdminRole,
  AdminUserDetailDto,
  AdminUserPlanUpdateDto,
  AdminUserRoleUpdateDto,
  AdminUserTrialUpdateDto,
} from '../models/admin-user.models';
import { AdminUserApiService } from '../services/admin-user-api.service';

@Injectable()
export class AdminUserDetailStore {
  private readonly adminUserApi = inject(AdminUserApiService);

  private readonly userSignal = signal<AdminUserDetailDto | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly isUpdatingPlanSignal = signal(false);
  private readonly isUpdatingRoleSignal = signal(false);
  private readonly isUpdatingTrialSignal = signal(false);
  private readonly errorMessagesSignal = signal<readonly string[]>([]);
  private readonly actionErrorMessagesSignal = signal<readonly string[]>([]);
  private readonly successMessageSignal = signal('');

  readonly user = this.userSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isUpdatingPlan = this.isUpdatingPlanSignal.asReadonly();
  readonly isUpdatingRole = this.isUpdatingRoleSignal.asReadonly();
  readonly isUpdatingTrial = this.isUpdatingTrialSignal.asReadonly();
  readonly errorMessages = this.errorMessagesSignal.asReadonly();
  readonly actionErrorMessages = this.actionErrorMessagesSignal.asReadonly();
  readonly successMessage = this.successMessageSignal.asReadonly();

  loadUser(id: string): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorMessagesSignal.set([]);

    this.adminUserApi
      .getUser(id)
      .pipe(
        map((response) => this.unwrap(response, 'Admin user request failed.')),
        finalize(() => this.isLoadingSignal.set(false)),
      )
      .subscribe({
        next: (user) => this.userSignal.set(user),
        error: (error) => this.errorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  updatePlan(id: string, plan: AdminPlan): void {
    if (this.isUpdatingPlan()) {
      return;
    }

    this.isUpdatingPlanSignal.set(true);
    this.actionErrorMessagesSignal.set([]);
    this.successMessageSignal.set('');

    this.adminUserApi
      .updatePlan(id, { plan })
      .pipe(
        map((response) => this.unwrap<AdminUserPlanUpdateDto>(response, 'Plan update failed.')),
        switchMap(() => this.adminUserApi.getUser(id)),
        map((response) => this.unwrap(response, 'Admin user refresh failed.')),
        finalize(() => this.isUpdatingPlanSignal.set(false)),
      )
      .subscribe({
        next: (user) => {
          this.userSignal.set(user);
          this.successMessageSignal.set('User plan updated successfully.');
        },
        error: (error) => this.actionErrorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  updateRole(id: string, role: AdminRole): void {
    if (this.isUpdatingRole()) {
      return;
    }

    this.isUpdatingRoleSignal.set(true);
    this.actionErrorMessagesSignal.set([]);
    this.successMessageSignal.set('');

    this.adminUserApi
      .updateRole(id, { role })
      .pipe(
        map((response) => this.unwrap<AdminUserRoleUpdateDto>(response, 'Role update failed.')),
        switchMap(() => this.adminUserApi.getUser(id)),
        map((response) => this.unwrap(response, 'Admin user refresh failed.')),
        finalize(() => this.isUpdatingRoleSignal.set(false)),
      )
      .subscribe({
        next: (user) => {
          this.userSignal.set(user);
          this.successMessageSignal.set('User role updated successfully.');
        },
        error: (error) => this.actionErrorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  updateTrial(id: string, trialEndsAt: string): void {
    if (this.isUpdatingTrial()) {
      return;
    }

    this.isUpdatingTrialSignal.set(true);
    this.actionErrorMessagesSignal.set([]);
    this.successMessageSignal.set('');

    this.adminUserApi
      .updateTrial(id, { trialEndsAt })
      .pipe(
        map((response) => this.unwrap<AdminUserTrialUpdateDto>(response, 'Trial update failed.')),
        switchMap(() => this.adminUserApi.getUser(id)),
        map((response) => this.unwrap(response, 'Admin user refresh failed.')),
        finalize(() => this.isUpdatingTrialSignal.set(false)),
      )
      .subscribe({
        next: (user) => {
          this.userSignal.set(user);
          this.successMessageSignal.set('User trial updated successfully.');
        },
        error: (error) => this.actionErrorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  clearActionMessages(): void {
    this.actionErrorMessagesSignal.set([]);
    this.successMessageSignal.set('');
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }
}
