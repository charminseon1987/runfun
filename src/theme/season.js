/**
 * RunFun 시즌 테마 — SEASON 만 바꾸면 팔레트 전환
 */
export const SEASON = 'spring';

export const PALETTE = {
  spring: {
    bg: '#141018',
    surface: '#1E1A22',
    surfaceL2: '#2A242E',
    mapBg: '#18141C',
    accent: '#F5A3B8',
    accentDeep: '#E07A8F',
    accentB: '#7EC8E3',
    accentB2: '#C9B8E8',
    danger: '#FF8A8A',
    gold: '#F5D4A8',
    orange: '#F5B895',
    purple: '#D4A5D4',
    success: '#7DD3A8',
    text: '#F8F0F3',
    textSub: 'rgba(248,240,243,0.56)',
    border: 'rgba(255, 182, 200, 0.14)',
    onAccent: '#2D1B24',
    axRgb: { r: 245, g: 163, b: 184 },
  },
};

export const C = { ...(PALETTE[SEASON] || PALETTE.spring) };

export const ax = (a) => {
  const { r, g, b } = C.axRgb;
  return `rgba(${r},${g},${b},${a})`;
};

export function greeting() {
  const h = new Date().getHours();
  if (SEASON === 'spring') {
    if (h < 6) return '벚꽃 같은 새벽, 가볍게 몸 풀어볼까요? 🌸';
    if (h < 12) return '좋은 아침! 봄 햇살 러닝 어때요? 🌿';
    if (h < 18) return '한강 벚꽃길 생각나는 오후예요 🌸';
    return '저녁 산책 겸 가볍게 달려볼까요? 🌙';
  }
  if (h < 6) return '새벽 러닝 준비됐나요? 🌙';
  if (h < 12) return '좋은 아침이에요! ☀️';
  if (h < 18) return '오늘도 달려볼까요? 💪';
  return '저녁 러닝 어때요? 🌆';
}
