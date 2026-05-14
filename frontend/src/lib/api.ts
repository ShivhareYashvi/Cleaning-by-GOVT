import axios from 'axios';
import { getSessionToken } from '../store/session';

const configuredApiUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api/v1';
const apiUrl = new URL(configuredApiUrl, window.location.origin);

export const API_BASE_URL = apiUrl.toString().replace(/\/$/, '');
export const API_ORIGIN = apiUrl.origin;

export const api = axios.create({
  baseURL: API_BASE_URL
});

api.interceptors.request.use((config) => {
  const token = getSessionToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function buildTrackingSocketUrl(pickupId: number): string {
  const protocol = apiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${apiUrl.host}/api/v1/tracking/pickups/${pickupId}/ws`;
}