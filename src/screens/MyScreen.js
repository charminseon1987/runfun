import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import { C } from '../theme/season';
import { useAgent } from '../context/AgentContext';

const RECENT = [
  { id: '1', emoji: '🌙', name: '한강 야경코스', km: 7.2, pace: "5'38\"", dur: '40:35', kcal: 412, ago: '오늘' },
  { id: '2', emoji: '⛰️', name: '북한산 둘레길', km: 5.8, pace: "6'12\"", dur: '35:58', kcal: 334, ago: '어제' },
  { id: '3', emoji: '🌿', name: '올림픽공원', km: 5.4, pace: "5'52\"", dur: '31:42', kcal: 308, ago: '3일 전' },
];

const STAMPS = [
  { id: '1', emoji: '🌉', name: '한강 야경', rarity: '골드', rarC: C.gold },
  { id: '2', emoji: '⛰️', name: '북한산', rarity: '실버', rarC: '#A0A0A0' },
  { id: '3', emoji: '🌸', name: '봄꽃 코스', rarity: '스페셜', rarC: C.orange },
  { id: '4', emoji: '🌊', name: '해안 런', rarity: '브론즈', rarC: '#CD7F32' },
  { id: '5', emoji: '🏙️', name: '도심 새벽', rarity: '에픽', rarC: C.purple },
];

export default function MyScreen() {
  const insets = useSafeAreaInsets();
  const { openAgent } = useAgent();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={[ps.heroBox, { paddingTop: insets.top + 16 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View style={ps.avatarWrap}>
            <Text style={{ fontSize: 36 }}>🏃</Text>
            <View style={ps.editDot}>
              <Text style={{ fontSize: 10 }}>✏️</Text>
            </View>
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={ps.heroName}>러너 김민수</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <View style={ps.gradeBadge}>
                <Text style={{ fontSize: 11 }}>👑</Text>
                <Text style={ps.gradeTxt}> 골드 러너</Text>
              </View>
              <Text style={{ color: C.textSub, fontSize: 12 }}>서울 · 30대</Text>
            </View>
            <Text style={ps.streakTxt}>🔥 5일 연속 러닝 중</Text>
          </View>
          <TouchableOpacity style={ps.settingsBtn}>
            <Text style={{ color: C.textSub, fontSize: 20 }}>⚙️</Text>
          </TouchableOpacity>
        </View>

        <View style={ps.statRow}>
          {[
            ['247', '러닝'],
            ['1,284', 'km'],
            ['38', '팔로워'],
            ['12', '스탬프'],
          ].map(([v, l], i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={ps.statDiv} />}
              <View style={ps.statItem}>
                <Text style={ps.statVal}>{v}</Text>
                <Text style={ps.statLbl}>{l}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={ps.section}>
        <View style={ps.yearCard}>
          <Text style={ps.yearLabel}>2026년 러닝 기록</Text>
          <View style={{ flexDirection: 'row', marginTop: 12 }}>
            {[
              ['1,284', 'km', '총 거리', C.accent],
              ['247', '회', '총 러닝', C.purple],
              ["5'52\"", '/km', '평균 페이스', C.orange],
            ].map(([v, u, l, color], i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[ps.yearVal, { color }]}>
                  {v}
                  <Text style={[ps.yearUnit, { color }]}>{u}</Text>
                </Text>
                <Text style={ps.yearLbl}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <View style={ps.section}>
        <View style={ps.sectionRow}>
          <Text style={ps.sectionTitle}>최근 러닝</Text>
          <TouchableOpacity>
            <Text style={ps.sectionMore}>전체보기</Text>
          </TouchableOpacity>
        </View>
        {RECENT.map((r) => (
          <View key={r.id} style={ps.runCard}>
            <View style={ps.runEmoji}>
              <Text style={{ fontSize: 22 }}>{r.emoji}</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={ps.runName}>{r.name}</Text>
                <Text style={{ color: C.textSub, fontSize: 11 }}>{r.ago}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 4 }}>
                <Text style={{ color: C.accent, fontSize: 12, fontWeight: '700' }}>{r.km}km</Text>
                <Text style={{ color: C.text, fontSize: 12, fontWeight: '600' }}>{r.pace}</Text>
                <Text style={{ color: C.textSub, fontSize: 12 }}>{r.dur}</Text>
                <Text style={{ color: C.orange, fontSize: 12, fontWeight: '600' }}>{r.kcal}kcal</Text>
              </View>
            </View>
            <ChevronRight size={16} color={C.textSub} />
          </View>
        ))}
      </View>

      <View style={ps.section}>
        <View style={ps.sectionRow}>
          <Text style={ps.sectionTitle}>획득한 스탬프</Text>
          <TouchableOpacity>
            <Text style={ps.sectionMore}>전체보기</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -16 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {STAMPS.map((s) => (
            <View key={s.id} style={[ps.stampChip, { borderColor: s.rarC + '66' }]}>
              <Text style={{ fontSize: 24 }}>{s.emoji}</Text>
              <Text style={ps.stampName}>{s.name}</Text>
              <Text style={[ps.stampRarity, { color: s.rarC }]}>{s.rarity}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={ps.section}>
        {[
          [
            { icon: '👥', label: '친구 찾기', color: C.accentB },
            { icon: '🏆', label: '러닝 챌린지', color: C.gold },
            { icon: '📤', label: '앱 공유', color: C.accent },
          ],
          [
            { icon: '🔔', label: '알림 설정', color: C.orange },
            { icon: '🎯', label: '주간 목표', color: C.success },
            { icon: '🌐', label: '언어 설정', color: C.purple },
          ],
          [
            { icon: '❓', label: '도움말', color: C.textSub, action: 'agent' },
            { icon: '🚪', label: '로그아웃', color: C.danger },
          ],
        ].map((group, gi) => (
          <View key={gi} style={[ps.menuGroup, gi > 0 && { marginTop: 10 }]}>
            {group.map((item, i) => (
              <React.Fragment key={item.label}>
                {i > 0 && <View style={{ height: 1, backgroundColor: C.border, marginLeft: 50 }} />}
                <TouchableOpacity
                  style={ps.menuRow}
                  onPress={item.action === 'agent' ? openAgent : undefined}
                >
                  <View style={[ps.menuIcon, { backgroundColor: item.color + '22' }]}>
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                  </View>
                  <Text style={ps.menuLabel}>{item.label}</Text>
                  <ChevronRight size={16} color={C.textSub} />
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const ps = StyleSheet.create({
  heroBox: {
    backgroundColor: C.surface,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: C.border,
    marginBottom: 16,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.accentB + '33',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: C.accent,
  },
  editDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroName: { color: C.text, fontSize: 20, fontWeight: '800' },
  gradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.gold + '22',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gradeTxt: { color: C.gold, fontSize: 11, fontWeight: '700' },
  streakTxt: { color: C.accent, fontSize: 12, fontWeight: '600', marginTop: 5 },
  settingsBtn: { padding: 4 },
  statRow: {
    flexDirection: 'row',
    backgroundColor: C.surfaceL2,
    borderRadius: 12,
    marginTop: 16,
    paddingVertical: 12,
  },
  statDiv: { width: 1, backgroundColor: C.border },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { color: C.text, fontSize: 17, fontWeight: '800' },
  statLbl: { color: C.textSub, fontSize: 11, marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 8 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingTop: 8,
  },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  sectionMore: { color: C.accent, fontSize: 12, fontWeight: '600' },
  yearCard: {
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  yearLabel: { color: C.textSub, fontSize: 13, fontWeight: '600' },
  yearVal: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  yearUnit: { fontSize: 11, fontWeight: '600' },
  yearLbl: { color: C.textSub, fontSize: 11, marginTop: 3, textAlign: 'center' },
  runCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  runEmoji: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: C.surfaceL2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  runName: { color: C.text, fontSize: 14, fontWeight: '700' },
  stampChip: {
    width: 76,
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderWidth: 1.5,
  },
  stampName: { color: C.text, fontSize: 10, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  stampRarity: { fontSize: 9, fontWeight: '700', marginTop: 2 },
  menuGroup: {
    backgroundColor: C.surface,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.border,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuLabel: { flex: 1, color: C.text, fontSize: 14, fontWeight: '500' },
});
