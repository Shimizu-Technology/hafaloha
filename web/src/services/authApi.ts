import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import api from './api';

export type GetTokenFn = () => Promise<string | null>;

export class MissingAuthTokenError extends Error {
  constructor() {
    super('Authentication token is missing');
    this.name = 'MissingAuthTokenError';
  }
}

async function buildAuthHeaders(getToken: GetTokenFn, headers?: Record<string, string>) {
  const token = await getToken();
  if (!token) {
    throw new MissingAuthTokenError();
  }

  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  };
}

export async function authGet<T = unknown>(
  path: string,
  getToken: GetTokenFn,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> {
  const headers = await buildAuthHeaders(getToken, config.headers as Record<string, string> | undefined);
  return api.get<T>(path, { ...config, headers });
}

export async function authPost<T = unknown>(
  path: string,
  data: unknown,
  getToken: GetTokenFn,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> {
  const headers = await buildAuthHeaders(getToken, config.headers as Record<string, string> | undefined);
  return api.post<T>(path, data, { ...config, headers });
}

export async function authPatch<T = unknown>(
  path: string,
  data: unknown,
  getToken: GetTokenFn,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> {
  const headers = await buildAuthHeaders(getToken, config.headers as Record<string, string> | undefined);
  return api.patch<T>(path, data, { ...config, headers });
}

export async function authPut<T = unknown>(
  path: string,
  data: unknown,
  getToken: GetTokenFn,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> {
  const headers = await buildAuthHeaders(getToken, config.headers as Record<string, string> | undefined);
  return api.put<T>(path, data, { ...config, headers });
}

export async function authDelete<T = unknown>(
  path: string,
  getToken: GetTokenFn,
  config: AxiosRequestConfig = {}
): Promise<AxiosResponse<T>> {
  const headers = await buildAuthHeaders(getToken, config.headers as Record<string, string> | undefined);
  return api.delete<T>(path, { ...config, headers });
}

