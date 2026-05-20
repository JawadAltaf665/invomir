export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  errors: readonly string[];
}

export interface PagedResult<T> {
  items: readonly T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
