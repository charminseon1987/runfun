const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const appJson = require('./app.json');

/** .env 값에 따옴표·공백이 있어도 동작하도록 */
function envTrim(name) {
  const raw = process.env[name];
  if (raw == null || raw === '') return '';
  return String(raw).replace(/^["'\s]+|["'\s]+$/g, '').trim();
}

const googleMapsApiKey = envTrim('GOOGLE_MAPS_API_KEY');

const basePlugins = appJson.expo.plugins || [];
const mapsPlugins =
  googleMapsApiKey.length > 0
    ? [
        [
          'react-native-maps',
          {
            androidGoogleMapsApiKey: googleMapsApiKey,
            iosGoogleMapsApiKey: googleMapsApiKey,
          },
        ],
      ]
    : [];

/** Google OAuth (웹/안드로이드/iOS 클라이언트 ID — Google Cloud 콘솔에서 생성) */
const googleOAuth = {
  webClientId: envTrim('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
  iosClientId: envTrim('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
  androidClientId: envTrim('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
};

module.exports = {
  expo: {
    ...appJson.expo,
    scheme: 'runfun',
    extra: {
      ...(appJson.expo.extra || {}),
      /** 백엔드 API (링크 미리보기 등). 실제 기기에서는 PC IP:8000 등으로 설정 */
      apiBaseUrl: envTrim('EXPO_PUBLIC_API_BASE_URL') || 'http://localhost:8000/v1',
      google: {
        ...googleOAuth,
        ...(appJson.expo.extra?.google || {}),
      },
    },
    android: {
      ...appJson.expo.android,
      /** Google Maps 키를 앱 제한으로 쓸 때 Cloud Console에 이 패키지명 + 디버그 SHA-1을 등록하세요. */
      package: appJson.expo.android?.package || 'com.runmate.runfun',
      config: {
        ...(appJson.expo.android?.config || {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...appJson.expo.ios,
      bundleIdentifier: appJson.expo.ios?.bundleIdentifier || 'com.runmate.runfun',
      config: {
        ...(appJson.expo.ios?.config || {}),
        ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
      },
    },
    plugins: [...basePlugins, ...mapsPlugins],
  },
};
