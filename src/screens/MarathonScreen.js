import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
  Modal,
  ScrollView,
  Image,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin, X } from 'lucide-react-native';
import { C } from '../theme/season';

/** 코스 맵 미리보기용 플레이스홀더(실서비스에서는 주최 측 공식 코스맵 URL로 교체) */
const PLACEHOLDER_MAP =
  'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1200&q=80';

const MARATHON_SEED = [
  {
    id: '1',
    title: '서울 국제 마라톤',
    date: '2026.04.05',
    raceTs: new Date('2026-04-05').getTime(),
    type: '국내',
    distance: 'FULL',
    applyUrl: 'https://www.seoul-marathon.com',
    fee: '풀 18만원 ~ (거리별 상이)',
    regDeadline: '2026.02.28 18:00',
    timeLimit: '7시간',
    description: '광화문 출발, 한강변을 따라 달리는 국내 대표 풀코스. 에이드 스테이션·의무 배정 안내는 공식 페이지에서 확인하세요.',
    courseMapUrl: PLACEHOLDER_MAP,
  },
  {
    id: '2',
    title: '뉴욕 시티 마라톤',
    date: '2026.11.03',
    raceTs: new Date('2026-11-03').getTime(),
    type: '세계',
    distance: 'FULL',
    applyUrl: 'https://www.nyrr.org/tcsnycmarathon',
    fee: 'USD 295 ~ (등록 시기별)',
    regDeadline: '2026.08.15 23:59 (현지)',
    timeLimit: '6시간 30분',
    description: '스태튼 아일랜드 출발, 5개 보로를 가로지르는 뉴욕의 대표 대회. 자격·추첨 규정은 공식 사이트를 확인해 주세요.',
    courseMapUrl: PLACEHOLDER_MAP,
  },
  {
    id: '3',
    title: '도쿄 마라톤',
    date: '2026.03.02',
    raceTs: new Date('2026-03-02').getTime(),
    type: '세계',
    distance: 'FULL',
    applyUrl: 'https://www.marathon.tokyo/en/participants/',
    fee: '¥16,500',
    regDeadline: '2025.08.31',
    timeLimit: '7시간',
    description: '도쿄 시청 앞 출발·골인. 해외 러너용 RUN as ONE 프로그램 등 신청 안내는 공식 페이지 기준입니다.',
    courseMapUrl: PLACEHOLDER_MAP,
  },
  {
    id: '4',
    title: '한강 봄 하프',
    date: '2026.04.20',
    raceTs: new Date('2026-04-20').getTime(),
    type: '국내',
    distance: 'HALF',
    applyUrl: 'https://www.hangangmarathon.co.kr',
    fee: '7만원',
    regDeadline: '2026.03.20 23:59',
    timeLimit: '3시간 30분',
    description: '봄 한강 뷰와 함께하는 하프 코스. 폐쇄 구간·짐 보관 등 실제 일정은 주최 공지를 참고하세요.',
    courseMapUrl: PLACEHOLDER_MAP,
  },
  {
    id: '5',
    title: '부산 10K 런',
    date: '2026.05.10',
    raceTs: new Date('2026-05-10').getTime(),
    type: '국내',
    distance: '10K',
    applyUrl: 'https://www.busanmarathon.com',
    fee: '4만원',
    regDeadline: '2026.04.01',
    timeLimit: '1시간 30분',
    description: '해운대 일대 단축 코스. 가족 참가·페이스존 여부는 매년 공지에 따라 달라질 수 있습니다.',
    courseMapUrl: PLACEHOLDER_MAP,
  },
  {
    id: '6',
    title: '보스턴 마라톤',
    date: '2026.04.21',
    raceTs: new Date('2026-04-21').getTime(),
    type: '세계',
    distance: 'FULL',
    applyUrl: 'https://www.baa.org/races/boston-marathon',
    fee: 'USD 230 ~',
    regDeadline: '자격 충족 후 등록 기간 내 (공식 안내)',
    timeLimit: '6시간',
    description: '퀄리파잉 타임 등 엄격한 참가 기준이 있는 대회입니다. 신청 전 자격 요건을 반드시 확인하세요.',
    courseMapUrl: PLACEHOLDER_MAP,
  },
  {
    id: '7',
    title: '제주 국제 마라톤',
    date: '2026.05.10',
    raceTs: new Date('2026-05-10').getTime(),
    type: '국내',
    distance: 'FULL',
    applyUrl: 'https://www.jejumarathon.com',
    fee: '12만원 ~',
    regDeadline: '2026.04.05',
    timeLimit: '6시간',
    description: '제주 해안·오름을 연상시키는 시원한 코스(예시). 정확한 코스도는 공식 코스맵을 확인하세요.',
    courseMapUrl: PLACEHOLDER_MAP,
  },
  {
    id: '8',
    title: '지난 대회 예시',
    date: '2025.01.01',
    raceTs: new Date('2025-01-01').getTime(),
    type: '국내',
    distance: 'FULL',
    applyUrl: '',
    fee: '—',
    regDeadline: '종료',
    timeLimit: '—',
    description: '과거 일정 표시용 더미 항목입니다. 신청 링크가 없으면 공식 이동 버튼이 비활성화됩니다.',
    courseMapUrl: PLACEHOLDER_MAP,
  },
];

export default function MarathonScreen() {
  const insets = useSafeAreaInsets();
  const [regionTab, setRegionTab] = useState('all');
  const [sortMode, setSortMode] = useState('dday');
  const [detailMarathon, setDetailMarathon] = useState(null);

  const dayMs = 86400000;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const ddayKey = (ts) => {
    const r = new Date(ts);
    r.setHours(0, 0, 0, 0);
    const d = Math.round((r - today) / dayMs);
    return d >= 0 ? d : 50000 - d;
  };
  const ddayLabel = (ts) => {
    const r = new Date(ts);
    r.setHours(0, 0, 0, 0);
    const d = Math.round((r - today) / dayMs);
    if (d === 0) return 'D-Day';
    if (d > 0) return `D-${d}`;
    return `D+${-d}`;
  };
  const ddayStyle = (ts) => {
    const r = new Date(ts);
    r.setHours(0, 0, 0, 0);
    const d = Math.round((r - today) / dayMs);
    if (d < 0) return { bg: C.surfaceL2, text: C.textSub };
    if (d <= 14) return { bg: 'rgba(224,84,84,0.14)', text: C.danger };
    if (d <= 60) return { bg: 'rgba(184,146,46,0.18)', text: C.gold };
    return { bg: 'rgba(217,107,133,0.14)', text: C.accentDeep };
  };

  const filtered = useMemo(() => {
    let list = regionTab === 'all' ? MARATHON_SEED : MARATHON_SEED.filter((m) => m.type === regionTab);
    if (sortMode === 'dday') list = [...list].sort((a, b) => ddayKey(a.raceTs) - ddayKey(b.raceTs));
    if (sortMode === 'late') list = [...list].sort((a, b) => ddayKey(b.raceTs) - ddayKey(a.raceTs));
    return list;
  }, [regionTab, sortMode]);

  const openMarathonDetail = (item) => setDetailMarathon(item);

  const handleOpenOfficialApply = async (item) => {
    if (!item?.applyUrl) {
      Alert.alert('신청 링크 없음', '이 대회는 현재 신청 링크가 등록되어 있지 않아요.');
      return;
    }
    try {
      const supported = await Linking.canOpenURL(item.applyUrl);
      if (!supported) {
        Alert.alert('열 수 없는 링크', '신청 페이지를 열 수 없어요. 잠시 후 다시 시도해 주세요.');
        return;
      }
      await Linking.openURL(item.applyUrl);
    } catch {
      Alert.alert('신청 이동 실패', '신청 페이지 이동 중 문제가 발생했어요.');
    }
  };

  const detailIsPast = detailMarathon && detailMarathon.raceTs < Date.now();
  const detailCanApply = detailMarathon && !detailIsPast && Boolean(detailMarathon.applyUrl);

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={[ms.headerBox, { paddingTop: insets.top + 10 }]}>
        <Text style={ms.headerTitle}>🏅 마라톤 일정</Text>
      </View>

      <View style={ms.regionTabRow}>
        {[
          ['all', '전체'],
          ['국내', '국내'],
          ['세계', '세계'],
        ].map(([v, l]) => (
          <TouchableOpacity key={v} style={[ms.rTab, regionTab === v && ms.rTabOn]} onPress={() => setRegionTab(v)}>
            <Text style={regionTab === v ? ms.rTabTxtOn : ms.rTabTxt}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={ms.sortRow}>
        {[
          ['dday', 'D-Day↑'],
          ['late', 'D-Day↓'],
          ['api', '기본'],
        ].map(([v, l]) => (
          <TouchableOpacity key={v} style={[ms.sortChip, sortMode === v && ms.sortChipOn]} onPress={() => setSortMode(v)}>
            <Text style={sortMode === v ? ms.sortTxtOn : ms.sortTxt}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const ds = ddayStyle(item.raceTs);
          const isPast = item.raceTs < Date.now();
          return (
            <View style={ms.card}>
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={0.75} onPress={() => openMarathonDetail(item)}>
                <View style={ms.distBadge}>
                  <Text style={ms.distBadgeTxt}>{item.distance}</Text>
                </View>
                <Text style={[ms.cardTitle, isPast && { color: C.textSub }]}>{item.title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <MapPin size={11} color={C.textSub} />
                  <Text style={ms.cardSub}>
                    {' '}
                    {item.date} · {item.type}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <View style={[ms.ddayChip, { backgroundColor: ds.bg }]}>
                  <Text style={[ms.ddayTxt, { color: ds.text }]}>{ddayLabel(item.raceTs)}</Text>
                </View>
                {isPast ? (
                  <TouchableOpacity style={ms.closedBadge} onPress={() => openMarathonDetail(item)}>
                    <Text style={ms.closedTxt}>상세</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={ms.applyBtn} onPress={() => openMarathonDetail(item)}>
                    <Text style={ms.applyTxt}>신청하기</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border }} />}
      />

      <Modal
        visible={Boolean(detailMarathon)}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailMarathon(null)}
      >
        {detailMarathon ? (
          <View style={[ms.modalRoot, { paddingTop: insets.top }]}>
            <View style={ms.modalHeader}>
              <Text style={ms.modalHeaderTitle}>대회 상세</Text>
              <Pressable style={ms.modalClose} hitSlop={12} onPress={() => setDetailMarathon(null)}>
                <X size={22} color={C.text} />
              </Pressable>
            </View>
            <ScrollView
              style={ms.modalScroll}
              contentContainerStyle={[ms.modalScrollInner, { paddingBottom: insets.bottom + 100 }]}
              showsVerticalScrollIndicator={false}
            >
              <Text style={ms.modalRaceTitle}>{detailMarathon.title}</Text>
              <View style={ms.modalMetaRow}>
                <MapPin size={14} color={C.accent} />
                <Text style={ms.modalMetaTxt}>
                  {detailMarathon.date} · {detailMarathon.type} · {detailMarathon.distance}
                </Text>
              </View>
              <View style={ms.detailGrid}>
                <View style={ms.detailCell}>
                  <Text style={ms.detailLabel}>참가비 (안내)</Text>
                  <Text style={ms.detailValue}>{detailMarathon.fee}</Text>
                </View>
                <View style={ms.detailCell}>
                  <Text style={ms.detailLabel}>접수 마감</Text>
                  <Text style={ms.detailValue}>{detailMarathon.regDeadline}</Text>
                </View>
                <View style={[ms.detailCell, ms.detailCellWide]}>
                  <Text style={ms.detailLabel}>제한 시간</Text>
                  <Text style={ms.detailValue}>{detailMarathon.timeLimit}</Text>
                </View>
              </View>
              <Text style={ms.modalBody}>{detailMarathon.description}</Text>
              <Text style={ms.mapSectionLabel}>코스 미리보기</Text>
              <Text style={ms.mapHint}>실제 코스는 주최 측 공식 자료를 기준으로 하세요.</Text>
              <Image
                source={{ uri: detailMarathon.courseMapUrl || PLACEHOLDER_MAP }}
                style={ms.courseMapImg}
                resizeMode="cover"
              />
            </ScrollView>
            <View style={[ms.modalFooter, { paddingBottom: insets.bottom + 14 }]}>
              <TouchableOpacity
                style={[ms.modalApplyBtn, !detailCanApply && ms.modalApplyBtnOff]}
                disabled={!detailCanApply}
                onPress={() => void handleOpenOfficialApply(detailMarathon)}
              >
                <Text style={[ms.modalApplyTxt, !detailCanApply && ms.modalApplyTxtOff]}>
                  {detailIsPast
                    ? '종료된 대회'
                    : detailMarathon.applyUrl
                      ? '공식 페이지에서 신청하기'
                      : '신청 링크 없음'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const ms = StyleSheet.create({
  headerBox: { paddingHorizontal: 20, paddingBottom: 12, backgroundColor: C.bg },
  headerTitle: { color: C.text, fontSize: 22, fontWeight: '800' },
  regionTabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 4,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  rTab: { paddingHorizontal: 14, paddingVertical: 12, marginRight: 4 },
  rTabOn: { borderBottomWidth: 2, borderColor: C.accent },
  rTabTxt: { fontSize: 15, fontWeight: '600', color: C.textSub },
  rTabTxtOn: { fontSize: 15, fontWeight: '800', color: C.accent },
  sortRow: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10, gap: 8 },
  sortChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: C.surfaceL2,
    borderWidth: 1,
    borderColor: C.border,
  },
  sortChipOn: { backgroundColor: C.accent, borderColor: C.accent },
  sortTxt: { fontSize: 12, fontWeight: '600', color: C.textSub },
  sortTxtOn: { fontSize: 12, fontWeight: '700', color: C.onAccent },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  distBadge: {
    alignSelf: 'flex-start',
    backgroundColor: C.surfaceL2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: C.border,
  },
  distBadgeTxt: { color: C.accent, fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: C.text },
  cardSub: { fontSize: 12, color: C.textSub },
  ddayChip: { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  ddayTxt: { fontSize: 12, fontWeight: '800' },
  applyBtn: { backgroundColor: C.accent, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  applyTxt: { color: C.onAccent, fontSize: 12, fontWeight: '800' },
  closedBadge: { borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12, borderWidth: 1, borderColor: C.border },
  closedTxt: { color: C.textSub, fontSize: 12, fontWeight: '600' },
  modalRoot: { flex: 1, backgroundColor: C.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: C.border,
  },
  modalHeaderTitle: { fontSize: 17, fontWeight: '800', color: C.text },
  modalClose: { padding: 4 },
  modalScroll: { flex: 1 },
  modalScrollInner: { paddingHorizontal: 20, paddingTop: 16 },
  modalRaceTitle: { fontSize: 22, fontWeight: '800', color: C.text, lineHeight: 28 },
  modalMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  modalMetaTxt: { fontSize: 14, color: C.textSub, fontWeight: '600' },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
    gap: 10,
  },
  detailCell: {
    width: '47%',
    backgroundColor: C.surfaceL2,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
  detailCellWide: { width: '100%' },
  detailLabel: { fontSize: 11, fontWeight: '700', color: C.textSub, marginBottom: 4, letterSpacing: 0.3 },
  detailValue: { fontSize: 14, fontWeight: '700', color: C.text, lineHeight: 20 },
  modalBody: { marginTop: 16, fontSize: 15, lineHeight: 22, color: C.textSub },
  mapSectionLabel: { marginTop: 22, fontSize: 15, fontWeight: '800', color: C.text },
  mapHint: { fontSize: 12, color: C.textSub, marginTop: 4, marginBottom: 10 },
  courseMapImg: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    backgroundColor: C.surfaceL2,
    borderWidth: 1,
    borderColor: C.border,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: C.border,
    backgroundColor: C.bg,
  },
  modalApplyBtn: {
    backgroundColor: C.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalApplyBtnOff: { backgroundColor: C.surfaceL2, opacity: 0.85 },
  modalApplyTxt: { color: C.onAccent, fontSize: 16, fontWeight: '800' },
  modalApplyTxtOff: { color: C.textSub },
});
