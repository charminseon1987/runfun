/** 두 좌표 사이 거리 (미터), Haversine */
export function haversineMeters(a, b) {
  const R = 6371000;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

/** 경로 좌표 배열의 총 거리 (km) */
export function pathDistanceKm(coords) {
  if (!coords || coords.length < 2) return 0;
  let m = 0;
  for (let i = 1; i < coords.length; i++) {
    m += haversineMeters(coords[i - 1], coords[i]);
  }
  return Math.round((m / 1000) * 1000) / 1000;
}

/** 저장용으로 좌표 다운샘플 (너무 긴 경로 방지) */
export function downsampleCoords(coords, maxPoints = 200) {
  if (!coords?.length || coords.length <= maxPoints) return coords || [];
  const step = Math.ceil(coords.length / maxPoints);
  const out = [];
  for (let i = 0; i < coords.length; i += step) out.push(coords[i]);
  if (out[out.length - 1] !== coords[coords.length - 1]) out.push(coords[coords.length - 1]);
  return out;
}
