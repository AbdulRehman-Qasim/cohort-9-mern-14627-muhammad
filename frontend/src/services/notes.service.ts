import api from './api';
import axios from 'axios';
import { ApiResponse, ApiError, ValidationErrorItem } from '../types/auth.types';
import { Note, CreateNoteData, UpdateNoteData } from '../types/notes.types';
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
const getNotes = async (): Promise<ApiResponse<Note[]>> => {
  try {
    const response = await api.get<ApiResponse<Note[]>>('/notes');
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
const getNoteById = async (id: string): Promise<ApiResponse<Note>> => {
  try {
    const response = await api.get<ApiResponse<Note>>(`/notes/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
const createNote = async (data: CreateNoteData): Promise<ApiResponse<Note>> => {
  try {
    const response = await api.post<ApiResponse<Note>>('/notes', data);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
const updateNote = async (id: string, data: UpdateNoteData): Promise<ApiResponse<Note>> => {
  try {
    const response = await api.patch<ApiResponse<Note>>(`/notes/${id}`, data);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
const deleteNote = async (id: string): Promise<ApiResponse<{ id: string }>> => {
  try {
    const response = await api.delete<ApiResponse<{ id: string }>>(`/notes/${id}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
const importNotes = async (notes: Partial<Note>[]): Promise<ApiResponse<Note[]>> => {
  try {
    const response = await api.post<ApiResponse<Note[]>>('/notes/import', { notes });
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};
export default {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  importNotes
};