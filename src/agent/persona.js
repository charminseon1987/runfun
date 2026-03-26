import { SEASON } from '../theme/season';

/**
 * RunMate AI 코치 페르소나 — 톤·역할·빠른 답변 규칙
 * (추후 OpenAI 등 연동 시 systemPrompt 로 그대로 사용 가능)
 */
export const COACH_PERSONA = {
  id: 'runmate-coach',
  name: 'RunMate 코치',
  shortName: '코치',
  emoji: '🌸',
  tagline: '페이스·부상 예방·시즌 코스를 함께해요',
  role: '러닝 코치',
  tone: '친근하고 짧게, 격려와 구체적 숫자(거리·페이스)를 섞는다',
  systemPrompt: `당신은 RunMate 앱의 러닝 코치입니다. 한국어로 답합니다.
사용자를 존댓말로 부르되 부담 없이 격려합니다. 의학적 진단은 하지 말고,
부상·통증은 전문의 상담을 권합니다. 시즌이 봄이면 벚꽃·봄 러닝을 가볍게 언급해도 됩니다.`,
};

export const QUICK_ACTIONS = [
  { id: 'today', label: '오늘 뭐 뛸까?' },
  { id: 'pace', label: '페이스 조언' },
  { id: 'injury', label: '무릎 부담 줄이기' },
  { id: 'spring', label: '벚꽃 러닝 코스' },
  { id: 'hydrate', label: '수분·휴식' },
];

/**
 * @param {{ intent?: string, userText?: string, season?: string }} p
 */
export function getCoachReply({ intent = 'free', userText = '', season = SEASON }) {
  const t = (userText || '').trim().toLowerCase();

  const match = (re) => re.test(t);

  if (intent === 'today' || match(/오늘|뭐.*뛰|추천|계획/)) {
    return `${COACH_PERSONA.emoji} 이번 주 누적이 꽤 쌓였어요. 오늘은 가볍게 30~40분 또는 5km 내 페이스런만 가도 충분해요. 막판에 속도 올리지 말고 호흡이 대화 가능한 강도로 마무리해 보세요!`;
  }
  if (intent === 'pace' || match(/페이스|속도|빨리|느리/)) {
    return '페이스는 “지금 숨이 약간 차지만 문장 말할 수 있다”가 러닝 초반엔 딱이에요. 1km마다 10~20초만 늦춰도 심박이 안정돼요. 레이스 전엔 목표 페이스보다 10~15초 느리게 롱런하는 연습을 추천해요.';
  }
  if (intent === 'injury' || match(/무릎|아프|통증|부상/)) {
    return '무릎이 아프면 거리·속도 둘 다 줄이고 48시간은 휴식 우선이에요. 스트레칭보다는 엉덩이·허벅지 근력(스쿼트, 클램)이 장기적으로 도움이 됩니다. 붓기·열감이 있으면 병원 진료를 권해요. (코치는 진단이 아니라 일반 가이드예요.)';
  }
  if (intent === 'spring' || (season === 'spring' && match(/벚꽃|한강|봄|꽃/))) {
    return '봄이면 한강 뚝섬·여의도·반포 쪽이 분위기 좋아요. 바람이 강한 날은 처음 2km는 페이스를 20초 정도 여유 있게 잡아보세요. 끝나고 가볍게 걷기 5분이 회복에 도움이 돼요 🌸';
  }
  if (intent === 'hydrate' || match(/물|수분|휴식|피로/)) {
    return '러닝 전후 200~300ml 정도 나눠 마시고, 45분 넘게 뛰면 중간에 한 모금씩도 좋아요. 다음 날 가볍게 뛸 땐 전날 수면이 제일 중요해요!';
  }
  if (match(/마라톤|풀코스|하프|대회/)) {
    return '대회 4주 전부터는 새로운 신발·페이스 실험은 피하고, 주간 총거리만 천천히 유지해요. D-7은 강도 낮추고 D-2~3은 가볍게 흔들어 주기만 하면 돼요.';
  }
  if (match(/안녕|hello|hi|누구/)) {
    return `안녕하세요! 저는 ${COACH_PERSONA.name}예요. ${COACH_PERSONA.tagline}. 아래 빠른 질문을 누르거나, 편하게 문장으로 물어보세요.`;
  }

  if (t.length > 0) {
    return `${COACH_PERSONA.emoji} “${userText.slice(0, 80)}${userText.length > 80 ? '…' : ''}” 말씀이네요. 지금 단계에선 주 3회 이하, 한 번에 +10% 이내로만 거리 늘리는 걸 추천해요. 더 구체적으로 알려주시면 (목표 거리·통증 여부) 맞춰 볼게요!`;
  }

  return `${COACH_PERSONA.emoji} 궁금한 걸 입력해 보시거나, 아래 버튼으로 빠른 질문을 눌러 주세요. 함께 페이스 맞춰 드릴게요!`;
}
