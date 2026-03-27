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
      google: {
        ...googleOAuth,
        ...(appJson.expo.extra?.google || {}),
      },
    },
    android: {
      ...appJson.expo.android,
      config: {
        ...(appJson.expo.android?.config || {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    ios: {
      ...appJson.expo.ios,
      config: {
        ...(appJson.expo.ios?.config || {}),
        ...(googleMapsApiKey ? { googleMapsApiKey } : {}),
      },
    },
  },
};
