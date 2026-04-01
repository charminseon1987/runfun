/**
 * RunMate API 클라이언트
 * - JWT 자동 첨부 (@runfun/api_token)
 * - Base URL: app.config.js extra.apiBaseUrl
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_TOKEN_KEY = '@runfun/api_token';

function getBaseUrl() {
  return (Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000/v1').replace(/\/$/, '');
}

async function getToken() {
  try {
    return await AsyncStorage.getItem(API_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function saveApiToken(token) {
  await AsyncStorage.setItem(API_TOKEN_KEY, token);
}

export async function clearApiToken() {
  await AsyncStorage.removeItem(API_TOKEN_KEY);
}

async function request(method, path, body) {
  const base = getBaseUrl();
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);

  const res = await fetch(`${base}${path}`, opts);
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j.detail || JSON.stringify(j);
    } catch {
      detail = res.statusText;
    }
    const err = new Error(detail || `HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  get: (path) => request('GET', path),
  post: (path, body) => request('POST', path, body),
  patch: (path, body) => request('PATCH', path, body),
  delete: (path) => request('DELETE', path),
};
