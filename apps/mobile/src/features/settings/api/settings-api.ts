import { apiRequest } from '@/src/services/api/api-client';
import {
  LanguagePreferenceDto,
  UpdateLanguagePreferenceRequest,
  UpdateUserProfileRequest,
  UserProfileDto,
} from '@/src/features/settings/types';

export const settingsApi = {
  getCurrentUser(): Promise<UserProfileDto> {
    return apiRequest<UserProfileDto>({
      method: 'GET',
      url: '/api/users/me',
    });
  },

  updateCurrentUser(request: UpdateUserProfileRequest): Promise<UserProfileDto> {
    return apiRequest<UserProfileDto>({
      method: 'PUT',
      url: '/api/users/me',
      data: request,
    });
  },

  getLanguage(): Promise<LanguagePreferenceDto> {
    return apiRequest<LanguagePreferenceDto>({
      method: 'GET',
      url: '/api/settings/language',
    });
  },

  updateLanguage(request: UpdateLanguagePreferenceRequest): Promise<LanguagePreferenceDto> {
    return apiRequest<LanguagePreferenceDto>({
      method: 'PUT',
      url: '/api/settings/language',
      data: request,
    });
  },
};
