import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_TOKEN_KEY = '@runfun/api_token';

function getWsBaseUrl() {
  const apiBase = (Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000/v1').replace(/\/$/, '');
  const withoutV1 = apiBase.replace(/\/v1$/, '');
  if (withoutV1.startsWith('https://')) return withoutV1.replace('https://', 'wss://');
  if (withoutV1.startsWith('http://')) return withoutV1.replace('http://', 'ws://');
  return `ws://${withoutV1}`;
}

async function getToken() {
  try {
    return await AsyncStorage.getItem(API_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function createRunningSocket(sessionId, { onMessage, onOpen, onClose } = {}) {
  const token = await getToken();
  if (!token || !sessionId) return null;

  const base = getWsBaseUrl();
  const url = `${base}/ws/running/${encodeURIComponent(String(sessionId))}?token=${encodeURIComponent(token)}`;
  const ws = new WebSocket(url);

  ws.onopen = () => onOpen?.();
  ws.onclose = () => onClose?.();
  ws.onerror = () => {};
  ws.onmessage = (event) => {
    if (!event?.data) return;
    try {
      const parsed = JSON.parse(event.data);
      onMessage?.(parsed);
    } catch {
      onMessage?.(null);
    }
  };

  return ws;
}

export function sendRunningSocket(ws, payload) {
  if (!ws || ws.readyState !== 1 || !payload) return false;
  try {
    ws.send(JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function closeRunningSocket(ws) {
  if (!ws) return;
  try {
    ws.close();
  } catch {}
}
