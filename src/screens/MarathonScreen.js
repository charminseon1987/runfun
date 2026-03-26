import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapPin } from 'lucide-react-native';
import { C } from '../theme/season';

const MARATHON_SEED = [
  { id: '1', title: '서울 국제 마라톤', date: '2026.04.05', raceTs: new Date('2026-04-05').getTime(), type: '국내', distance: 'FULL', applyUrl: 'https://www.seoul-marathon.com' },
  { id: '2', title: '뉴욕 시티 마라톤', date: '2026.11.03', raceTs: new Date('2026-11-03').getTime(), type: '세계', distance: 'FULL', applyUrl: 'https://www.nyrr.org/tcsnycmarathon' },
  { id: '3', title: '도쿄 마라톤', date: '2026.03.02', raceTs: new Date('2026-03-02').getTime(), type: '세계', distance: 'FULL', applyUrl: 'https://www.marathon.tokyo/en/participants/' },
  { id: '4', title: '한강 봄 하프', date: '2026.04.20', raceTs: new Date('2026-04-20').getTime(), type: '국내', distance: 'HALF', applyUrl: 'https://www.hangangmarathon.co.kr' },
  { id: '5', title: '부산 10K 런', date: '2026.05.10', raceTs: new Date('2026-05-10').getTime(), type: '국내', distance: '10K', applyUrl: 'https://www.busanmarathon.com' },
  { id: '6', title: '보스턴 마라톤', date: '2026.04.21', raceTs: new Date('2026-04-21').getTime(), type: '세계', distance: 'FULL', applyUrl: 'https://www.baa.org/races/boston-marathon' },
  { id: '7', title: '제주 국제 마라톤', date: '2026.05.10', raceTs: new Date('2026-05-10').getTime(), type: '국내', distance: 'FULL', applyUrl: 'https://www.jejumarathon.com' },
  { id: '8', title: '지난 대회 예시', date: '2025.01.01', raceTs: new Date('2025-01-01').getTime(), type: '국내', distance: 'FULL', applyUrl: '' },
];

export default function MarathonScreen() {
  const insets = useSafeAreaInsets();
  const [regionTab, setRegionTab] = useState('all');
  const [sortMode, setSortMode] = useState('dday');

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
    if (d <= 14) return { bg: '#3a2228', text: C.danger };
    if (d <= 60) return { bg: '#3d3020', text: C.gold };
    return { bg: '#2a1f28', text: C.accent };
  };

  const filtered = useMemo(() => {
    let list = regionTab === 'all' ? MARATHON_SEED : MARATHON_SEED.filter((m) => m.type === regionTab);
    if (sortMode === 'dday') list = [...list].sort((a, b) => ddayKey(a.raceTs) - ddayKey(b.raceTs));
    if (sortMode === 'late') list = [...list].sort((a, b) => ddayKey(b.raceTs) - ddayKey(a.raceTs));
    return list;
  }, [regionTab, sortMode]);

  const handleApply = async (item) => {
    if (!item.applyUrl) {
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
              <View style={{ flex: 1 }}>
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
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <View style={[ms.ddayChip, { backgroundColor: ds.bg }]}>
                  <Text style={[ms.ddayTxt, { color: ds.text }]}>{ddayLabel(item.raceTs)}</Text>
                </View>
                {isPast ? (
                  <View style={ms.closedBadge}>
                    <Text style={ms.closedTxt}>마감</Text>
                  </View>
                ) : (
                  <TouchableOpacity style={ms.applyBtn} onPress={() => void handleApply(item)}>
                    <Text style={ms.applyTxt}>신청하기</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.border }} />}
      />
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
});
