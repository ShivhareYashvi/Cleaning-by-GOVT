import axios from 'axios';
import { getSessionToken } from '../store/session';

// Use relative path for API calls - will be proxied by Vite dev server
const apiUrl = '/api/v1';

export const API_BASE_URL = apiUrl;
export const API_ORIGIN = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

export const api = axios.create({
  baseURL: apiUrl
});

api.interceptors.request.use((config) => {
  const token = getSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function buildTrackingSocketUrl(pickupId: number): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/api/v1/tracking/pickups/${pickupId}/ws`;
}
