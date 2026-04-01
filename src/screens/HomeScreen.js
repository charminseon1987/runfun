import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Play, Bell, Flame } from 'lucide-react-native';
import { C, ax, SEASON, greeting } from '../theme/season';
import FriendCard from '../components/FriendCard';
import { useAppData } from '../context/AppDataContext';
import { haversineKm, formatDistanceKm } from '../utils/geo';
import { api } from '../api/client';

const UPCOMING = [
  { id: '1', emoji: '🏙️', name: '서울 국제 마라톤', dday: 10, dist: '풀', loc: '광화문' },
  { id: '2', emoji: '🌸', name: '한강 봄 하프', dday: 25, dist: '하프', loc: '잠실' },
  { id: '3', emoji: '🌊', name: '제주 국제 마라톤', dday: 46, dist: '풀', loc: '서귀포' },
];

/** 대표 좌표(lat, lng) — 내 위치와 거리 계산에 사용 */
const COURSES = [
  { id: '1', emoji: '🌙', name: '한강 야경코스', region: '서울', km: '10.5', rating: '4.9', tag: '야간추천', tagC: C.purple, lat: 37.528, lng: 127.067 },
  { id: '2', emoji: '⛰️', name: '북한산 둘레길', region: '서울', km: '8.2', rating: '4.8', tag: '트레일', tagC: C.success, lat: 37.659, lng: 127.011 },
  { id: '3', emoji: '🌸', name: '전주 한옥마을', region: '전주', km: '6.5', rating: '4.7', tag: '명소코스', tagC: C.orange, lat: 35.815, lng: 127.152 },
  { id: '4', emoji: '🌃', name: '올림픽공원', region: '서울', km: '7.1', rating: '4.6', tag: '시티런', tagC: C.accentB, lat: 37.52, lng: 127.121 },
];

const HOT_COURSES = [
  { id: 'h1', emoji: '🐶', name: '댕댕이 코스', region: '서울', desc: '반려견 동반 가능 · 평지 위주', km: '4.8', tag: '요즘핫해', tagC: C.accent, lat: 37.526, lng: 127.04 },
  { id: 'h2', emoji: '🐋', name: '고래 코스', region: '울산', desc: '해안 라인 · 바다뷰 야외런', km: '7.3', tag: '바다감성', tagC: C.accentB, lat: 35.499, lng: 129.412 },
  { id: 'h3', emoji: '🌉', name: '선셋 브릿지 코스', region: '부산', desc: '노을 명소 · 포토스팟 많음', km: '6.2', tag: '인생샷', tagC: C.orange, lat: 35.153, lng: 129.119 },
  { id: 'h4', emoji: '🌲', name: '숲길 리커버리 코스', region: '경기', desc: '쿠션감 좋은 트레일', km: '5.4', tag: '회복런', tagC: C.success, lat: 37.411, lng: 127.095 },
];

function sortByDistance(items, userLat, userLng) {
  return [...items]
    .map((c) => ({
      ...c,
      distFromMeKm: haversineKm(userLat, userLng, c.lat, c.lng),
    }))
    .sort((a, b) => a.distFromMeKm - b.distFromMeKm);
}

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { weekStats, streak, weeklyGoalKm } = useAppData();
  const [friendAlerts, setFriendAlerts] = useState(['a1', 'a2']);
  const [cheered, setCheered] = useState({});
  const [coursesNearMe, setCoursesNearMe] = useState(() => COURSES.map((c) => ({ ...c, distFromMeKm: null })));
  const [hotNearMe, setHotNearMe] = useState(() => HOT_COURSES.map((c) => ({ ...c, distFromMeKm: null })));
  const [upcomingMarathons, setUpcomingMarathons] = useState(UPCOMING);
  const [locHint, setLocHint] = useState('위치 확인 중…');

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 백엔드에서 마라톤 데이터 로드 (실패 시 시드 데이터 유지)
  useEffect(() => {
    api.get('/marathons?status_filter=open&limit=5')
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map((m) => {
            const raceDate = new Date(m.race_date);
            const today = new Date();
            const dday = Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24));
            const dist = Array.isArray(m.distances) && m.distances.length > 0
              ? m.distances[0]
              : '풀';
            return {
              id: m.id,
              emoji: m.is_world_major ? '🌍' : '🏙️',
              name: m.name,
              dday,
              dist: String(dist),
              loc: m.location || '',
            };
          });
          setUpcomingMarathons(mapped);
        }
      })
      .catch(() => {}); // 실패 시 시드 데이터 유지
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            setLocHint('위치 권한이 없어 기본 순서로 보여요');
            setCoursesNearMe(COURSES.map((c) => ({ ...c, distFromMeKm: null })));
            setHotNearMe(HOT_COURSES.map((c) => ({ ...c, distFromMeKm: null })));
          }
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const { latitude, longitude } = pos.coords;
        setCoursesNearMe(sortByDistance(COURSES, latitude, longitude));
        setHotNearMe(sortByDistance(HOT_COURSES, latitude, longitude));
        setLocHint('코스끼리 가까운 게 아니라, 내 위치에서 각 코스까지 직선거리 순이에요');
      } catch {
        if (!cancelled) {
          setLocHint('위치를 불러오지 못해 기본 순서로 보여요');
          setCoursesNearMe(COURSES.map((c) => ({ ...c, distFromMeKm: null })));
          setHotNearMe(HOT_COURSES.map((c) => ({ ...c, distFromMeKm: null })));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  const weeklyKm = weekStats.totalKm;
  const weeklyGoal = weeklyGoalKm;
  const progress = weeklyGoal > 0 ? weeklyKm / weeklyGoal : 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[hs.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={hs.greetTxt}>{greeting()}</Text>
          <Text style={hs.logoTxt}>
            <Text style={{ color: C.text }}>Run</Text>
            <Text style={{ color: C.accent }}>Mate</Text>
          </Text>
          {SEASON === 'spring' && (
            <Text style={hs.seasonHint}>🌸 벚꽃 시즌 · 봄맞이 테마</Text>
          )}
        </View>
        <TouchableOpacity style={hs.bellBtn}>
          <Bell size={22} color={C.text} />
          <View style={hs.bellDot} />
        </TouchableOpacity>
      </View>

      <View style={hs.weekCard}>
        <View style={hs.weekCardInner}>
          <View style={hs.weekTopRow}>
            <Text style={hs.weekLabel}>이번 주 러닝</Text>
            <View style={hs.streakBadge}>
              <Flame size={12} color={C.accentDeep} />
              <Text style={hs.streakTxt}> {streak}일 연속</Text>
            </View>
          </View>

          <View style={hs.weekStatsRow}>
            <View>
              <Text style={hs.weekKm}>
                {weeklyKm}
                <Text style={hs.weekKmUnit}> km</Text>
              </Text>
              <Text style={hs.weekKmSub}>/ {weeklyGoal}km 목표</Text>
            </View>
              <View style={hs.weekMiniStats}>
              <View style={hs.weekMiniItem}>
                <Text style={hs.weekMiniVal}>{weekStats.count}회</Text>
                <Text style={hs.weekMiniLbl}>러닝</Text>
              </View>
              <View style={[hs.weekMiniItem, { marginLeft: 20 }]}>
                <Text style={hs.weekMiniVal}>{weekStats.paceStr}</Text>
                <Text style={hs.weekMiniLbl}>주간 페이스</Text>
              </View>
            </View>
          </View>

          <View style={hs.progressBg}>
            <View style={[hs.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
          <Text style={hs.progressPct}>{Math.round(progress * 100)}% 달성</Text>
        </View>
      </View>

      <TouchableOpacity
        style={hs.startBtn}
        onPress={() => navigation.navigate('러닝')}
        activeOpacity={0.85}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Play size={22} color={C.onAccent} fill={C.onAccent} />
        </Animated.View>
        <Text style={hs.startBtnTxt}>달리기 시작</Text>
      </TouchableOpacity>

      {friendAlerts.length > 0 && (
        <View style={hs.section}>
          <View style={hs.sectionRow}>
            <Text style={hs.sectionTitle}>👥 지금 달리는 친구</Text>
            <TouchableOpacity>
              <Text style={hs.sectionMore}>전체보기</Text>
            </TouchableOpacity>
          </View>

          {friendAlerts.includes('a1') && (
            <FriendCard
              emoji="🧑"
              name="민준"
              course="한강공원 뚝섬"
              km={2.4}
              minAgo={0}
              cheered={!!cheered.a1}
              onDismiss={() => setFriendAlerts((p) => p.filter((x) => x !== 'a1'))}
              onJoin={() => {}}
              onCheer={() => setCheered((p) => ({ ...p, a1: true }))}
            />
          )}
          {friendAlerts.includes('a2') && (
            <FriendCard
              emoji="👩"
              name="수진"
              course="북한산 둘레길"
              km={5.1}
              minAgo={3}
              cheered={!!cheered.a2}
              onDismiss={() => setFriendAlerts((p) => p.filter((x) => x !== 'a2'))}
              onJoin={() => {}}
              onCheer={() => setCheered((p) => ({ ...p, a2: true }))}
            />
          )}
        </View>
      )}

      <View style={hs.section}>
        <View style={hs.sectionRow}>
          <Text style={hs.sectionTitle}>🏅 다가오는 마라톤</Text>
          <TouchableOpacity onPress={() => navigation.navigate('마라톤')}>
            <Text style={hs.sectionMore}>전체보기</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -16 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {upcomingMarathons.map((m) => (
            <TouchableOpacity
              key={m.id}
              style={hs.mCard}
              onPress={() => navigation.navigate('마라톤')}
            >
              <View style={hs.mCardTop}>
                <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
                <View
                  style={[
                    hs.ddayBadge,
                    {
                      backgroundColor: m.dday <= 14 ? 'rgba(255,122,122,0.15)' : ax(0.1),
                    },
                  ]}
                >
                  <Text style={[hs.ddayTxt, { color: m.dday <= 14 ? C.danger : C.accent }]}>
                    D-{m.dday}
                  </Text>
                </View>
              </View>
              <Text style={hs.mCardName} numberOfLines={2}>
                {m.name}
              </Text>
              <Text style={hs.mCardSub}>
                {m.dist} · {m.loc}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={hs.section}>
        <View style={hs.sectionRow}>
          <View style={{ flex: 1 }}>
            <Text style={hs.sectionTitle}>🗺️ 추천 코스</Text>
            {locHint ? (
              <Text style={hs.locHint} numberOfLines={2}>
                {locHint}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity>
            <Text style={hs.sectionMore}>지도보기</Text>
          </TouchableOpacity>
        </View>
        <View style={hs.courseGrid}>
          {coursesNearMe.map((c) => (
            <TouchableOpacity key={c.id} style={hs.courseCard}>
              <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={hs.courseName}>{c.name}</Text>
                <Text style={hs.courseMeta}>
                  {c.region} · 코스 {c.km}km · ⭐ {c.rating}
                </Text>
                {typeof c.distFromMeKm === 'number' ? (
                  <Text style={hs.courseMetaDist}>내 위치에서 직선 약 {formatDistanceKm(c.distFromMeKm)}</Text>
                ) : null}
              </View>
              <View style={[hs.courseTag, { backgroundColor: c.tagC + '22' }]}>
                <Text style={[hs.courseTagTxt, { color: c.tagC }]}>{c.tag}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={hs.section}>
        <View style={hs.sectionRow}>
          <Text style={hs.sectionTitle}>🔥 요즘 핫한 코스</Text>
          <TouchableOpacity>
            <Text style={hs.sectionMore}>추천 더보기</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -16 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}
        >
          {hotNearMe.map((c) => (
            <TouchableOpacity key={c.id} style={hs.hotCard} activeOpacity={0.9}>
              <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
              <Text style={hs.hotName}>{c.name}</Text>
              <Text style={hs.hotRegion}>{c.region}</Text>
              <Text style={hs.hotDesc} numberOfLines={2}>
                {c.desc}
              </Text>
              <View style={hs.hotBottom}>
                <Text style={hs.hotMeta}>
                  코스 {c.km}km
                  {typeof c.distFromMeKm === 'number'
                    ? ` · 직선 약 ${formatDistanceKm(c.distFromMeKm)}`
                    : ''}
                </Text>
                <View style={[hs.courseTag, { backgroundColor: c.tagC + '22' }]}>
                  <Text style={[hs.courseTagTxt, { color: c.tagC }]}>{c.tag}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

const hs = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  greetTxt: { color: C.textSub, fontSize: 13, marginBottom: 2 },
  logoTxt: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  seasonHint: { color: C.textSub, fontSize: 11, marginTop: 6, fontWeight: '600', letterSpacing: 0.2 },
  bellBtn: { position: 'relative', padding: 4 },
  bellDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.danger,
  },

  weekCard: { marginHorizontal: 16, marginBottom: 14, borderRadius: 20, overflow: 'hidden' },
  weekCardInner: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: ax(0.2),
  },
  weekTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekLabel: { color: C.textSub, fontSize: 13, fontWeight: '600' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ax(0.2),
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  streakTxt: { color: C.accentDeep, fontSize: 12, fontWeight: '700' },
  weekStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  weekKm: {
    color: C.accent,
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 50,
  },
  weekKmUnit: { fontSize: 18, fontWeight: '600', color: C.textSub },
  weekKmSub: { color: C.textSub, fontSize: 12, marginTop: 2 },
  weekMiniStats: { alignItems: 'flex-end', flexDirection: 'row' },
  weekMiniItem: { alignItems: 'flex-end' },
  weekMiniVal: { color: C.text, fontSize: 16, fontWeight: '800' },
  weekMiniLbl: { color: C.textSub, fontSize: 10, marginTop: 1 },
  progressBg: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: C.accent, borderRadius: 3 },
  progressPct: { color: C.textSub, fontSize: 11, marginTop: 5, textAlign: 'right' },

  startBtn: {
    marginHorizontal: 16,
    marginBottom: 20,
    height: 60,
    backgroundColor: C.accent,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  startBtnTxt: { fontSize: 17, fontWeight: '800', color: C.onAccent },

  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  locHint: { color: C.textSub, fontSize: 11, marginTop: 4, fontWeight: '600' },
  sectionMore: { color: C.accent, fontSize: 12, fontWeight: '600' },

  mCard: {
    width: 160,
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  mCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  ddayBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ddayTxt: { fontSize: 11, fontWeight: '800' },
  mCardName: { color: C.text, fontSize: 13, fontWeight: '700', lineHeight: 18, marginBottom: 4 },
  mCardSub: { color: C.textSub, fontSize: 11 },

  courseGrid: { gap: 8 },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  courseName: { color: C.text, fontSize: 14, fontWeight: '700' },
  courseMeta: { color: C.textSub, fontSize: 11, marginTop: 2 },
  courseMetaDist: { color: C.textSub, fontSize: 10, marginTop: 3, fontWeight: '600' },
  courseTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  courseTagTxt: { fontSize: 11, fontWeight: '700' },
  hotCard: {
    width: 196,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 14,
    padding: 12,
  },
  hotName: { color: C.text, fontSize: 14, fontWeight: '800', marginTop: 8 },
  hotRegion: { color: C.textSub, fontSize: 10, fontWeight: '700', marginTop: 2 },
  hotDesc: { color: C.textSub, fontSize: 11, marginTop: 4, minHeight: 32 },
  hotBottom: { marginTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hotMeta: { color: C.accent, fontSize: 12, fontWeight: '700' },
});
