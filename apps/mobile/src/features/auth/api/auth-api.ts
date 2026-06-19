import { apiRequest } from '@/src/services/api/api-client';
import {
  AuthTokenDto,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  LogoutRequest,
  RegisterRequest,
} from '@/src/features/auth/types';

export const authApi = {
  login(request: LoginRequest): Promise<AuthTokenDto> {
    return apiRequest<AuthTokenDto>({
      method: 'POST',
      url: '/api/auth/login',
      data: request,
    });
  },

  register(request: RegisterRequest): Promise<AuthTokenDto> {
    return apiRequest<AuthTokenDto>({
      method: 'POST',
      url: '/api/auth/register',
      data: request,
    });
  },

  googleLogin(request: GoogleLoginRequest): Promise<AuthTokenDto> {
    return apiRequest<AuthTokenDto>({
      method: 'POST',
      url: '/api/auth/google',
      data: request,
    });
  },

  forgotPassword(request: ForgotPasswordRequest): Promise<string> {
    return apiRequest<string>({
      method: 'POST',
      url: '/api/auth/forgot-password',
      data: request,
    });
  },

  logout(request: LogoutRequest): Promise<string> {
    return apiRequest<string>({
      method: 'POST',
      url: '/api/auth/logout',
      data: request,
    });
  },
};
