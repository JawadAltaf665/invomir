import { apiRequest, apiRequestVoid } from '@/src/services/api/api-client';
import {
  ClientDetailDto,
  ClientDto,
  ClientListItemDto,
  ClientListQuery,
  ClientSaveRequest,
} from '@/src/features/clients/types';
import { PagedResult } from '@/src/types/api';

export const clientsApi = {
  listClients(query: ClientListQuery): Promise<PagedResult<ClientListItemDto>> {
    return apiRequest<PagedResult<ClientListItemDto>>({
      method: 'GET',
      url: '/api/clients',
      params: {
        page: Math.max(1, query.page),
        limit: Math.min(100, Math.max(1, query.limit)),
        q: query.q?.trim() || undefined,
      },
    });
  },

  getClient(id: string, page = 1, limit = 20): Promise<ClientDetailDto> {
    return apiRequest<ClientDetailDto>({
      method: 'GET',
      url: `/api/clients/${id}`,
      params: {
        page,
        limit,
      },
    });
  },

  createClient(request: ClientSaveRequest): Promise<ClientDto> {
    return apiRequest<ClientDto>({
      method: 'POST',
      url: '/api/clients',
      data: request,
    });
  },

  updateClient(id: string, request: ClientSaveRequest): Promise<ClientDto> {
    return apiRequest<ClientDto>({
      method: 'PUT',
      url: `/api/clients/${id}`,
      data: request,
    });
  },

  deleteClient(id: string): Promise<void> {
    return apiRequestVoid({
      method: 'DELETE',
      url: `/api/clients/${id}`,
    });
  },
};
