import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { apiUrl } from '../../../core/config/api-url';
import { ApiResponse } from '../../../core/models/api-response.model';
import { MonthlyReportsDto, MonthlyReportsQuery, ReportExportQuery } from '../models/report.models';

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private readonly http = inject(HttpClient);

  getMonthlyReports(query: MonthlyReportsQuery): Observable<ApiResponse<MonthlyReportsDto>> {
    return this.http.get<ApiResponse<MonthlyReportsDto>>(apiUrl('/api/reports/monthly'), {
      params: this.toMonthlyParams(query),
    });
  }

  exportReport(query: ReportExportQuery): Observable<HttpResponse<Blob>> {
    return this.http.get(apiUrl('/api/reports/export'), {
      params: this.toExportParams(query),
      observe: 'response',
      responseType: 'blob',
    });
  }

  private toMonthlyParams(query: MonthlyReportsQuery): HttpParams {
    let params = new HttpParams().set('months', Math.min(24, Math.max(1, query.months || 12)));

    if (query.year) {
      params = params.set('year', query.year);
    }

    if (query.year && query.month) {
      params = params.set('month', query.month);
    }

    return params;
  }

  private toExportParams(query: ReportExportQuery): HttpParams {
    let params = new HttpParams()
      .set('format', query.format)
      .set('from', query.from)
      .set('to', query.to);

    if (query.status) {
      params = params.set('status', query.status);
    }

    return params;
  }
}
