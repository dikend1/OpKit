import { api } from './http';
import type { AuthResponse } from '../types';

export async function login(email: string, password: string): Promise<string> {
  const res = await api.post<AuthResponse>('/auth/login', { email, password });
  localStorage.setItem('token', res.access_token);
  return res.access_token;
}

export async function register(email: string, password: string): Promise<string> {
  const res = await api.post<AuthResponse>('/auth/register', { email, password });
  localStorage.setItem('token', res.access_token);
  return res.access_token;
}

export function logout() {
  localStorage.removeItem('token');
}

export function isAuthenticated(): boolean {
  return !!localStorage.getItem('token');
}
