import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const STORAGE_KEY = '@runfun/google_user_v1';

const AuthContext = createContext(null);

function readGoogleCfg() {
  const g = Constants.expoConfig?.extra?.google || {};
  const web = (g.webClientId || '').trim();
  const ios = (g.iosClientId || '').trim();
  const android = (g.androidClientId || '').trim();
  const fallback = web || ios || android;
  return {
    webClientId: web || fallback || undefined,
    iosClientId: ios || fallback || undefined,
    androidClientId: android || fallback || undefined,
  };
}

function hasGoogleCfg(cfg) {
  return !!(cfg.webClientId || cfg.iosClientId || cfg.androidClientId);
}

async function fetchGoogleProfile(accessToken) {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('userinfo');
  const p = await res.json();
  return {
    sub: p.sub,
    email: p.email,
    name: p.name,
    picture: p.picture,
  };
}

function GoogleAuthBridge({ children, cfg, user, setUser, ready }) {
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: cfg.webClientId,
    iosClientId: cfg.iosClientId,
    androidClientId: cfg.androidClientId,
  });

  const persistUser = useCallback(async (u) => {
    setUser(u);
    if (u) await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else await AsyncStorage.removeItem(STORAGE_KEY);
  }, [setUser]);

  useEffect(() => {
    if (!response) return;
    if (response.type === 'error') {
      const err = response.params?.error_description || response.error?.message || '로그인에 실패했어요.';
      Alert.alert('Google', String(err));
      return;
    }
    if (response.type !== 'success') return;
    const token =
      response.authentication?.accessToken ||
      response.params?.access_token;
    if (!token) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await fetchGoogleProfile(token);
        if (!cancelled) await persistUser(profile);
      } catch {
        if (!cancelled) Alert.alert('Google', '프로필을 불러오지 못했어요.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [response, persistUser]);

  const signInWithGoogle = useCallback(async () => {
    if (!request) {
      Alert.alert('Google', '인증 요청을 준비하는 중이에요. 잠시 후 다시 시도해 주세요.');
      return;
    }
    try {
      await promptAsync();
    } catch {
      Alert.alert('Google', '로그인 창을 열 수 없어요.');
    }
  }, [request, promptAsync]);

  const signOut = useCallback(async () => {
    await persistUser(null);
  }, [persistUser]);

  const value = useMemo(
    () => ({
      user,
      ready,
      googleConfigured: true,
      signInWithGoogle,
      signOut,
      requestReady: !!request,
    }),
    [user, ready, signInWithGoogle, signOut, request]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const cfg = useMemo(() => readGoogleCfg(), []);
  const configured = hasGoogleCfg(cfg);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await AsyncStorage.getItem(STORAGE_KEY);
        if (s && alive) setUser(JSON.parse(s));
      } catch {
        /* ignore */
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const signInDisabled = useCallback(() => {
    Alert.alert(
      'Google 연동',
      'Google Cloud Console에서 OAuth 클라이언트 ID를 만든 뒤, 프로젝트 루트 .env에 다음을 넣고 앱을 다시 실행해 주세요.\n\nEXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=...\n(필요 시 EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID)\n\n리다이렉트 URI에 https://auth.expo.io/@username/runfun (Expo Go) 또는 scheme runfun 이 포함되도록 설정하세요.'
    );
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const valueFallback = useMemo(
    () => ({
      user,
      ready,
      googleConfigured: false,
      signInWithGoogle: signInDisabled,
      signOut,
      requestReady: false,
    }),
    [user, ready, signInDisabled, signOut]
  );

  if (!configured) {
    return <AuthContext.Provider value={valueFallback}>{children}</AuthContext.Provider>;
  }

  return (
    <GoogleAuthBridge cfg={cfg} user={user} setUser={setUser} ready={ready}>
      {children}
    </GoogleAuthBridge>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 사용하세요.');
  return ctx;
}
