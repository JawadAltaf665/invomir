import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../../../core/config/api-url';
import { ApiResponse } from '../../../core/models/api-response.model';
import {
  EmailTemplateDto,
  EmailTemplateListQuery,
  EmailTemplatePageResult,
  EmailTemplatePreviewDto,
  EmailTemplatePreviewRequest,
  EmailTemplateRequest,
  QueuedEmailDto,
  QueuedEmailListQuery,
  QueuedEmailPageResult,
} from '../models/admin-email.models';

@Injectable({ providedIn: 'root' })
export class AdminEmailApiService {
  private readonly http = inject(HttpClient);

  listTemplates(query: EmailTemplateListQuery): Observable<ApiResponse<EmailTemplatePageResult>> {
    return this.http.get<ApiResponse<EmailTemplatePageResult>>(
      apiUrl('/api/admin/email-templates'),
      { params: this.toTemplateParams(query) },
    );
  }

  getTemplate(id: string): Observable<ApiResponse<EmailTemplateDto>> {
    return this.http.get<ApiResponse<EmailTemplateDto>>(
      apiUrl(`/api/admin/email-templates/${encodeURIComponent(id)}`),
    );
  }

  createTemplate(request: EmailTemplateRequest): Observable<ApiResponse<EmailTemplateDto>> {
    return this.http.post<ApiResponse<EmailTemplateDto>>(
      apiUrl('/api/admin/email-templates'),
      request,
    );
  }

  updateTemplate(
    id: string,
    request: EmailTemplateRequest,
  ): Observable<ApiResponse<EmailTemplateDto>> {
    return this.http.put<ApiResponse<EmailTemplateDto>>(
      apiUrl(`/api/admin/email-templates/${encodeURIComponent(id)}`),
      request,
    );
  }

  deleteTemplate(id: string): Observable<ApiResponse<boolean>> {
    return this.http.delete<ApiResponse<boolean>>(
      apiUrl(`/api/admin/email-templates/${encodeURIComponent(id)}`),
    );
  }

  activateTemplate(id: string): Observable<ApiResponse<EmailTemplateDto>> {
    return this.http.post<ApiResponse<EmailTemplateDto>>(
      apiUrl(`/api/admin/email-templates/${encodeURIComponent(id)}/activate`),
      {},
    );
  }

  deactivateTemplate(id: string): Observable<ApiResponse<EmailTemplateDto>> {
    return this.http.post<ApiResponse<EmailTemplateDto>>(
      apiUrl(`/api/admin/email-templates/${encodeURIComponent(id)}/deactivate`),
      {},
    );
  }

  previewTemplate(
    request: EmailTemplatePreviewRequest,
  ): Observable<ApiResponse<EmailTemplatePreviewDto>> {
    return this.http.post<ApiResponse<EmailTemplatePreviewDto>>(
      apiUrl('/api/admin/email-templates/preview'),
      request,
    );
  }

  listQueuedEmails(query: QueuedEmailListQuery): Observable<ApiResponse<QueuedEmailPageResult>> {
    return this.http.get<ApiResponse<QueuedEmailPageResult>>(
      apiUrl('/api/admin/queued-emails'),
      { params: this.toQueuedEmailParams(query) },
    );
  }

  getQueuedEmail(id: string): Observable<ApiResponse<QueuedEmailDto>> {
    return this.http.get<ApiResponse<QueuedEmailDto>>(
      apiUrl(`/api/admin/queued-emails/${encodeURIComponent(id)}`),
    );
  }

  retryQueuedEmail(id: string): Observable<ApiResponse<QueuedEmailDto>> {
    return this.http.post<ApiResponse<QueuedEmailDto>>(
      apiUrl(`/api/admin/queued-emails/${encodeURIComponent(id)}/retry`),
      {},
    );
  }

  cancelQueuedEmail(id: string): Observable<ApiResponse<QueuedEmailDto>> {
    return this.http.post<ApiResponse<QueuedEmailDto>>(
      apiUrl(`/api/admin/queued-emails/${encodeURIComponent(id)}/cancel`),
      {},
    );
  }

  private toTemplateParams(query: EmailTemplateListQuery): HttpParams {
    let params = new HttpParams()
      .set('page', Math.max(1, query.page || 1))
      .set('limit', Math.min(100, Math.max(1, query.limit || 20)));

    if (query.templateType) params = params.set('templateType', query.templateType);
    if (query.language?.trim()) params = params.set('language', query.language.trim());
    if (query.isActive !== '' && query.isActive !== undefined) {
      params = params.set('isActive', String(query.isActive));
    }
    if (query.search?.trim()) params = params.set('search', query.search.trim());

    return params;
  }

  private toQueuedEmailParams(query: QueuedEmailListQuery): HttpParams {
    let params = new HttpParams()
      .set('page', Math.max(1, query.page || 1))
      .set('limit', Math.min(100, Math.max(1, query.limit || 20)));

    if (query.status) params = params.set('status', query.status);
    if (query.tenantId?.trim()) params = params.set('tenantId', query.tenantId.trim());
    if (query.templateType) params = params.set('templateType', query.templateType);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.searchEmail?.trim()) params = params.set('searchEmail', query.searchEmail.trim());

    return params;
  }
}
