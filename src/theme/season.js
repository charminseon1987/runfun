/**
 * RunFun 시즌 테마 — SEASON 만 바꾸면 팔레트 전환
 */
export const SEASON = 'spring';

export const PALETTE = {
  /** 봄 팔레트 — 밝은 배경(화이트 베이스), 가독성 위주 */
  spring: {
    bg: '#FFFFFF',
    surface: '#F7F5F8',
    surfaceL2: '#EDE9F0',
    mapBg: '#E6E2EB',
    accent: '#D96B85',
    accentDeep: '#B8556E',
    accentB: '#4A9FB8',
    accentB2: '#9A8AB8',
    danger: '#E05454',
    gold: '#B8922E',
    orange: '#C9855C',
    purple: '#9B72A0',
    success: '#3FA678',
    text: '#1C1619',
    textSub: 'rgba(28,22,25,0.55)',
    border: 'rgba(28, 22, 25, 0.10)',
    onAccent: '#FFFFFF',
    axRgb: { r: 217, g: 107, b: 133 },
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
