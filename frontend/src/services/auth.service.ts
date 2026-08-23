import api from './api';
import { User, ApiResponse, ApiError, ValidationErrorItem } from '../types/auth.types';
import axios from 'axios';
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error) && error.response) {
    const data = error.response.data;
    const status = error.response.status;
    if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      const validationErrors: ValidationErrorItem[] = data.errors;
      const firstErrorMsg = validationErrors[0].msg || validationErrors[0].message || 'Validation error';
      throw new ApiError(firstErrorMsg, status, validationErrors);
    }
    const errorMessage = data.error || data.message || 'An unexpected error occurred';
    throw new ApiError(errorMessage, status);
  }
  const genericMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
  throw new ApiError(genericMessage);
};
const login = async (email: string, password: string): Promise<ApiResponse<User>> => {
  try {
    const response = await api.post<ApiResponse<User>>('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
const register = async (name: string, email: string, password: string): Promise<ApiResponse<User>> => {
  try {
    const response = await api.post<ApiResponse<User>>('/auth/register', { name, email, password });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
const logout = async (): Promise<ApiResponse> => {
  try {
    const response = await api.post<ApiResponse>('/auth/logout');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
const getCurrentUser = async (): Promise<ApiResponse<User>> => {
  try {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
export default {
  login,
  register,
  logout,
  getCurrentUser,
};