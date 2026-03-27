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

module.exports = {
  expo: {
    ...appJson.expo,
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
