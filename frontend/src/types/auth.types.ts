export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ValidationErrorItem {
  msg?: string;
  message?: string;
  param?: string;
  path?: string;
}

export class ApiError extends Error {
  status?: number;
  errors?: ValidationErrorItem[];

  constructor(message: string, status?: number, errors?: ValidationErrorItem[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}
