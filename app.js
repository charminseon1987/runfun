import { registerRootComponent } from 'expo';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, Image, TouchableOpacity,
  ScrollView, Dimensions, Animated, StatusBar,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';

enableScreens();

import {
  Home, Play, Calendar, User, Heart, MessageCircle,
  Clock, MapPin, Award, Share2, Bookmark, MoreHorizontal,
  Flame, ChevronRight, Bell, Users, Zap,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const { width: SCREEN_W } = Dimensions.get('window');

const C = {
  bg:        '#0B0C10',
  surface:   '#1E1F2A',
  surfaceL2: '#272838',
  accent:    '#00E87A',
  accentB:   '#007AFF',
  danger:    '#FF6B6B',
  gold:      '#FFD700',
  orange:    '#FF9500',
  purple:    '#7C3AED',
  text:      '#EEEEEF',
  textSub:   'rgba(238,238,239,0.55)',
  border:    'rgba(255,255,255,0.08)',
};

// ─── 헬퍼 ─────────────────────────────────────────────────────────────────────
const greeting = () => {
  const h = new Date().getHours();
  if (h < 6)  return '새벽 러닝 준비됐나요? 🌙';
  if (h < 12) return '좋은 아침이에요! ☀️';
  if (h < 18) return '오늘도 달려볼까요? 💪';
  return '저녁 러닝 어때요? 🌆';
};

// ─── 1. 홈 대시보드 ────────────────────────────────────────────────────────────
const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [friendAlerts, setFriendAlerts] = useState(['a1', 'a2']);
  const [cheered, setCheered] = useState({});

  const pulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const UPCOMING = [
    { id: '1', emoji: '🏙️', name: '서울 국제 마라톤',  dday: 10, dist: '풀',  loc: '광화문' },
    { id: '2', emoji: '🌸', name: '한강 봄 하프',       dday: 25, dist: '하프', loc: '잠실' },
    { id: '3', emoji: '🌊', name: '제주 국제 마라톤',   dday: 46, dist: '풀',  loc: '서귀포' },
  ];

  const COURSES = [
    { id: '1', emoji: '🌙', name: '한강 야경코스', km: '10.5', rating: '4.9', tag: '야간추천', tagC: C.purple },
    { id: '2', emoji: '⛰️', name: '북한산 둘레길',  km: '8.2',  rating: '4.8', tag: '트레일',  tagC: '#34C759' },
    { id: '3', emoji: '🌸', name: '전주 한옥마을', km: '6.5',  rating: '4.7', tag: '명소코스', tagC: C.orange },
    { id: '4', emoji: '🌃', name: '올림픽공원',    km: '7.1',  rating: '4.6', tag: '시티런',  tagC: C.accentB },
  ];

  const weeklyKm   = 18.4;
  const weeklyGoal = 30;
  const progress   = weeklyKm / weeklyGoal;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 헤더 ── */}
      <View style={[hs.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={hs.greetTxt}>{greeting()}</Text>
          <Text style={hs.logoTxt}>
            <Text style={{ color: C.text }}>Run</Text>
            <Text style={{ color: C.accent }}>Mate</Text>
          </Text>
        </View>
        <TouchableOpacity style={hs.bellBtn}>
          <Bell size={22} color={C.text} />
          <View style={hs.bellDot} />
        </TouchableOpacity>
      </View>

      {/* ── 이번 주 통계 카드 ── */}
      <View style={hs.weekCard}>
        <View style={hs.weekCardInner}>
          <View style={hs.weekTopRow}>
            <Text style={hs.weekLabel}>이번 주 러닝</Text>
            <View style={hs.streakBadge}>
              <Flame size={12} color={C.orange} />
              <Text style={hs.streakTxt}> 5일 연속</Text>
            </View>
          </View>

          <View style={hs.weekStatsRow}>
            <View>
              <Text style={hs.weekKm}>{weeklyKm}<Text style={hs.weekKmUnit}> km</Text></Text>
              <Text style={hs.weekKmSub}>/ {weeklyGoal}km 목표</Text>
            </View>
            <View style={hs.weekMiniStats}>
              <View style={hs.weekMiniItem}>
                <Text style={hs.weekMiniVal}>3회</Text>
                <Text style={hs.weekMiniLbl}>러닝</Text>
              </View>
              <View style={[hs.weekMiniItem, { marginLeft: 20 }]}>
                <Text style={hs.weekMiniVal}>5'48"</Text>
                <Text style={hs.weekMiniLbl}>평균 페이스</Text>
              </View>
            </View>
          </View>

          {/* 진행바 */}
          <View style={hs.progressBg}>
            <View style={[hs.progressFill, { width: `${Math.min(progress * 100, 100)}%` }]} />
          </View>
          <Text style={hs.progressPct}>{Math.round(progress * 100)}% 달성</Text>
        </View>
      </View>

      {/* ── 달리기 시작 버튼 ── */}
      <TouchableOpacity
        style={hs.startBtn}
        onPress={() => navigation.navigate('러닝')}
        activeOpacity={0.85}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Play size={22} color="#000" fill="#000" />
        </Animated.View>
        <Text style={hs.startBtnTxt}>달리기 시작</Text>
      </TouchableOpacity>

      {/* ── 친구 러닝 알림 ── */}
      {friendAlerts.length > 0 && (
        <View style={hs.section}>
          <View style={hs.sectionRow}>
            <Text style={hs.sectionTitle}>👥 지금 달리는 친구</Text>
            <TouchableOpacity><Text style={hs.sectionMore}>전체보기</Text></TouchableOpacity>
          </View>

          {friendAlerts.includes('a1') && (
            <FriendCard
              emoji="🧑"
              name="민준"
              course="한강공원 뚝섬"
              km={2.4}
              minAgo={0}
              cheered={!!cheered['a1']}
              onDismiss={() => setFriendAlerts(p => p.filter(x => x !== 'a1'))}
              onJoin={() => {}}
              onCheer={() => setCheered(p => ({ ...p, a1: true }))}
            />
          )}
          {friendAlerts.includes('a2') && (
            <FriendCard
              emoji="👩"
              name="수진"
              course="북한산 둘레길"
              km={5.1}
              minAgo={3}
              cheered={!!cheered['a2']}
              onDismiss={() => setFriendAlerts(p => p.filter(x => x !== 'a2'))}
              onJoin={() => {}}
              onCheer={() => setCheered(p => ({ ...p, a2: true }))}
            />
          )}
        </View>
      )}

      {/* ── 다가오는 마라톤 ── */}
      <View style={hs.section}>
        <View style={hs.sectionRow}>
          <Text style={hs.sectionTitle}>🏅 다가오는 마라톤</Text>
          <TouchableOpacity onPress={() => navigation.navigate('마라톤')}>
            <Text style={hs.sectionMore}>전체보기</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {UPCOMING.map(m => (
            <TouchableOpacity key={m.id} style={hs.mCard} onPress={() => navigation.navigate('마라톤')}>
              <View style={hs.mCardTop}>
                <Text style={{ fontSize: 26 }}>{m.emoji}</Text>
                <View style={[hs.ddayBadge, { backgroundColor: m.dday <= 14 ? 'rgba(255,107,107,0.15)' : 'rgba(0,232,122,0.1)' }]}>
                  <Text style={[hs.ddayTxt, { color: m.dday <= 14 ? C.danger : C.accent }]}>D-{m.dday}</Text>
                </View>
              </View>
              <Text style={hs.mCardName} numberOfLines={2}>{m.name}</Text>
              <Text style={hs.mCardSub}>{m.dist} · {m.loc}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── 추천 코스 ── */}
      <View style={hs.section}>
        <View style={hs.sectionRow}>
          <Text style={hs.sectionTitle}>🗺️ 추천 코스</Text>
          <TouchableOpacity><Text style={hs.sectionMore}>지도보기</Text></TouchableOpacity>
        </View>
        <View style={hs.courseGrid}>
          {COURSES.map(c => (
            <TouchableOpacity key={c.id} style={hs.courseCard}>
              <Text style={{ fontSize: 24 }}>{c.emoji}</Text>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={hs.courseName}>{c.name}</Text>
                <Text style={hs.courseMeta}>{c.km}km · ⭐ {c.rating}</Text>
              </View>
              <View style={[hs.courseTag, { backgroundColor: c.tagC + '22' }]}>
                <Text style={[hs.courseTagTxt, { color: c.tagC }]}>{c.tag}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const FriendCard = ({ emoji, name, course, km, minAgo, cheered, onDismiss, onJoin, onCheer }) => (
  <View style={hs.friendCard}>
    <View style={hs.friendAvatar}>
      <Text style={{ fontSize: 20 }}>{emoji}</Text>
      <View style={hs.friendOnline} />
    </View>
    <View style={{ flex: 1, marginLeft: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text style={hs.friendName}>{name}</Text>
        <View style={hs.runningBadge}><Text style={hs.runningBadgeTxt}>러닝 중</Text></View>
      </View>
      <Text style={hs.friendSub}>{course} · {km.toFixed(1)}km</Text>
      <Text style={hs.friendTime}>{minAgo === 0 ? '방금 시작' : `${minAgo}분 전 시작`}</Text>
    </View>
    <View style={{ gap: 6 }}>
      <TouchableOpacity style={hs.joinBtn} onPress={onJoin}>
        <Text style={hs.joinBtnTxt}>같이 달려</Text>
      </TouchableOpacity>
      <TouchableOpacity style={hs.cheerBtn} onPress={onCheer}>
        <Text style={hs.cheerBtnTxt}>{cheered ? '응원됨 ✓' : '응원 💪'}</Text>
      </TouchableOpacity>
    </View>
    <TouchableOpacity style={hs.dismissBtn} onPress={onDismiss}>
      <Text style={{ color: C.textSub, fontSize: 16, lineHeight: 16 }}>×</Text>
    </TouchableOpacity>
  </View>
);

const hs = StyleSheet.create({
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingBottom: 16 },
  greetTxt:     { color: C.textSub, fontSize: 13, marginBottom: 2 },
  logoTxt:      { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  bellBtn:      { position: 'relative', padding: 4 },
  bellDot:      { position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger },

  weekCard:     { marginHorizontal: 16, marginBottom: 14, borderRadius: 20, overflow: 'hidden' },
  weekCardInner:{ backgroundColor: C.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: 'rgba(0,232,122,0.2)' },
  weekTopRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  weekLabel:    { color: C.textSub, fontSize: 13, fontWeight: '600' },
  streakBadge:  { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,149,0,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  streakTxt:    { color: C.orange, fontSize: 12, fontWeight: '700' },
  weekStatsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 },
  weekKm:       { color: C.accent, fontSize: 46, fontWeight: '800', letterSpacing: -1.5, lineHeight: 50 },
  weekKmUnit:   { fontSize: 18, fontWeight: '600', color: C.textSub },
  weekKmSub:    { color: C.textSub, fontSize: 12, marginTop: 2 },
  weekMiniStats:{ alignItems: 'flex-end', flexDirection: 'row' },
  weekMiniItem: { alignItems: 'flex-end' },
  weekMiniVal:  { color: C.text, fontSize: 16, fontWeight: '800' },
  weekMiniLbl:  { color: C.textSub, fontSize: 10, marginTop: 1 },
  progressBg:   { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, backgroundColor: C.accent, borderRadius: 3 },
  progressPct:  { color: C.textSub, fontSize: 11, marginTop: 5, textAlign: 'right' },

  startBtn:     { marginHorizontal: 16, marginBottom: 20, height: 60, backgroundColor: C.accent, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  startBtnTxt:  { fontSize: 17, fontWeight: '800', color: '#000' },

  section:      { marginBottom: 20, paddingHorizontal: 16 },
  sectionRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: C.text, fontSize: 15, fontWeight: '700' },
  sectionMore:  { color: C.accent, fontSize: 12, fontWeight: '600' },

  friendCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(0,232,122,0.15)', position: 'relative' },
  friendAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surfaceL2, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: C.accent },
  friendOnline: { position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: 6, backgroundColor: '#34C759', borderWidth: 2, borderColor: C.surface },
  friendName:   { color: C.text, fontSize: 14, fontWeight: '700' },
  friendSub:    { color: C.textSub, fontSize: 12, marginTop: 1 },
  friendTime:   { color: C.accent, fontSize: 11, fontWeight: '600', marginTop: 2 },
  runningBadge: { backgroundColor: 'rgba(52,199,89,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  runningBadgeTxt: { color: '#34C759', fontSize: 10, fontWeight: '700' },
  joinBtn:      { backgroundColor: C.accent, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  joinBtnTxt:   { color: '#000', fontSize: 12, fontWeight: '800' },
  cheerBtn:     { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: C.border },
  cheerBtnTxt:  { color: C.textSub, fontSize: 11, fontWeight: '600' },
  dismissBtn:   { position: 'absolute', top: 8, right: 10, padding: 4 },

  mCard:        { width: 160, backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  mCardTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  ddayBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  ddayTxt:      { fontSize: 11, fontWeight: '800' },
  mCardName:    { color: C.text, fontSize: 13, fontWeight: '700', lineHeight: 18, marginBottom: 4 },
  mCardSub:     { color: C.textSub, fontSize: 11 },

  courseGrid:   { gap: 8 },
  courseCard:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: C.border },
  courseName:   { color: C.text, fontSize: 14, fontWeight: '700' },
  courseMeta:   { color: C.textSub, fontSize: 11, marginTop: 2 },
  courseTag:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  courseTagTxt: { fontSize: 11, fontWeight: '700' },
});

// ─── 2. 러닝 트래커 ────────────────────────────────────────────────────────────
const RunScreen = () => {
  const [phase, setPhase] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [km, setKm] = useState(0);
  const [laps, setLaps] = useState([]);

  const intervalRef = useRef(null);
  const pulseAnim   = useRef(new Animated.Value(1)).current;
  const startTimeRef = useRef(null);
  const elapsedAtPauseRef = useRef(0);
  const kmRef = useRef(0);

  useEffect(() => {
    if (phase === 'running') {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const delta = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(elapsedAtPauseRef.current + delta);
        kmRef.current = +(kmRef.current + 0.01).toFixed(2);
        setKm(kmRef.current);
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
      if (phase === 'paused') elapsedAtPauseRef.current = elapsed;
    }
    return () => clearInterval(intervalRef.current);
  }, [phase]);

  useEffect(() => {
    if (phase === 'running') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.22, duration: 700, useNativeDriver: false }),
          Animated.timing(pulseAnim, { toValue: 1.0,  duration: 700, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1.0, duration: 200, useNativeDriver: false }).start();
    }
  }, [phase]);

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const paceStr = useMemo(() => {
    if (km < 0.05 || elapsed < 1) return "--'--\"";
    const sPerKm = elapsed / km;
    return `${Math.floor(sPerKm/60)}'${String(Math.round(sPerKm%60)).padStart(2,'"')}`;
  }, [elapsed, km]);

  const kcal = Math.round(km * 62);

  return (
    <View style={{ flex: 1, backgroundColor: '#0b0c10' }}>
      {/* 지도 플레이스홀더 */}
      <View style={rs.mapFull}>
        <MapPin size={32} color="rgba(0,232,122,0.3)" />
        <Text style={rs.mapHint}>GPS 지도</Text>
      </View>

      {/* 경과 시간 */}
      <View style={rs.topChip}>
        <Clock size={13} color={C.accent} />
        <Text style={rs.topChipTxt}>{fmt(elapsed)}</Text>
      </View>

      {/* 펄스 링 */}
      {phase === 'running' && (
        <Animated.View style={[rs.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
      )}

      {/* 하단 패널 */}
      <View style={rs.bottom}>
        <View style={rs.statsRow}>
          <View style={rs.statBox}>
            <Text style={[rs.statNum, { color: C.accent }]}>{km.toFixed(2)}</Text>
            <Text style={rs.statLbl}>km</Text>
          </View>
          <View style={rs.statBox}>
            <Text style={rs.statNum}>{paceStr}</Text>
            <Text style={rs.statLbl}>페이스/km</Text>
          </View>
          <View style={rs.statBox}>
            <Text style={[rs.statNum, { color: C.gold }]}>{kcal}</Text>
            <Text style={rs.statLbl}>kcal</Text>
          </View>
        </View>

        {laps.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
            {laps.slice(-5).map((l, i) => (
              <View key={i} style={rs.lapChip}>
                <Text style={rs.lapTxt}>Lap {laps.length > 5 ? laps.length-5+i+1 : i+1}  {l.lapKm}km  {l.lapTime}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {phase === 'idle' && (
          <TouchableOpacity style={rs.cta} onPress={() => setPhase('running')}>
            <Play size={18} color="#000" fill="#000" />
            <Text style={rs.ctaTxt}>러닝 시작</Text>
          </TouchableOpacity>
        )}
        {phase === 'running' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={rs.ctaSec} onPress={() => setLaps(p => [...p, { lapKm: km.toFixed(2), lapTime: fmt(elapsed) }])}>
              <Text style={rs.ctaSecTxt}>랩</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[rs.cta, { flex: 2 }]} onPress={() => setPhase('paused')}>
              <Text style={rs.ctaTxt}>일시정지</Text>
            </TouchableOpacity>
          </View>
        )}
        {phase === 'paused' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity style={[rs.cta, { flex: 2 }]} onPress={() => setPhase('running')}>
              <Text style={rs.ctaTxt}>계속하기</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[rs.ctaSec, { backgroundColor: '#3D1515', borderColor: C.danger }]}
              onPress={() => { setPhase('idle'); setElapsed(0); setKm(0); setLaps([]); kmRef.current=0; elapsedAtPauseRef.current=0; }}
            >
              <Text style={[rs.ctaSecTxt, { color: C.danger }]}>종료</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

const rs = StyleSheet.create({
  mapFull:   { ...StyleSheet.absoluteFillObject, backgroundColor: '#1a1c24', justifyContent: 'center', alignItems: 'center', gap: 8 },
  mapHint:   { color: 'rgba(255,255,255,0.15)', fontSize: 18, fontWeight: '700' },
  topChip:   { position: 'absolute', top: 56, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, borderWidth: 1, borderColor: C.border },
  topChipTxt:{ color: C.text, fontSize: 14, fontWeight: '700' },
  pulseRing: { position: 'absolute', alignSelf: 'center', top: '32%', width: 90, height: 90, borderRadius: 45, backgroundColor: 'rgba(0,232,122,0.1)', borderWidth: 2, borderColor: C.accent },
  bottom:    { position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: 32, paddingHorizontal: 16, paddingTop: 20, backgroundColor: 'rgba(11,12,16,0.92)' },
  statsRow:  { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox:   { flex: 1, backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 14, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  statNum:   { fontSize: 22, fontWeight: '800', color: C.text },
  statLbl:   { fontSize: 10, color: C.textSub, marginTop: 4, fontWeight: '600' },
  lapChip:   { backgroundColor: C.surfaceL2, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, borderWidth: 1, borderColor: C.border },
  lapTxt:    { color: C.textSub, fontSize: 11, fontWeight: '600' },
  cta:       { height: 56, borderRadius: 14, backgroundColor: C.accent, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
  ctaTxt:    { fontSize: 16, fontWeight: '800', color: '#000' },
  ctaSec:    { flex: 1, height: 56, borderRadius: 14, backgroundColor: C.surfaceL2, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  ctaSecTxt: { fontSize: 15, fontWeight: '700', color: C.text },
});

// ─── 3. 마라톤 일정 ────────────────────────────────────────────────────────────
const MARATHON_SEED = [
  { id:'1', title:'서울 국제 마라톤',  date:'2026.04.05', raceTs: new Date('2026-04-05').getTime(), type:'국내', distance:'FULL' },
  { id:'2', title:'뉴욕 시티 마라톤',  date:'2026.11.03', raceTs: new Date('2026-11-03').getTime(), type:'세계', distance:'FULL' },
  { id:'3', title:'도쿄 마라톤',       date:'2026.03.02', raceTs: new Date('2026-03-02').getTime(), type:'세계', distance:'FULL' },
  { id:'4', title:'한강 봄 하프',      date:'2026.04.20', raceTs: new Date('2026-04-20').getTime(), type:'국내', distance:'HALF' },
  { id:'5', title:'부산 10K 런',       date:'2026.05.10', raceTs: new Date('2026-05-10').getTime(), type:'국내', distance:'10K' },
  { id:'6', title:'보스턴 마라톤',     date:'2026.04.21', raceTs: new Date('2026-04-21').getTime(), type:'세계', distance:'FULL' },
  { id:'7', title:'제주 국제 마라톤',  date:'2026.05.10', raceTs: new Date('2026-05-10').getTime(), type:'국내', distance:'FULL' },
  { id:'8', title:'지난 대회 예시',    date:'2025.01.01', raceTs: new Date('2025-01-01').getTime(), type:'국내', distance:'FULL' },
];

const MarathonScreen = () => {
  const insets = useSafeAreaInsets();
  const [regionTab, setRegionTab] = useState('all');
  const [sortMode,  setSortMode]  = useState('dday');

  const dayMs = 86400000;
  const today = new Date(); today.setHours(0,0,0,0);
  const ddayKey   = ts => { const r=new Date(ts); r.setHours(0,0,0,0); const d=Math.round((r-today)/dayMs); return d>=0?d:50000-d; };
  const ddayLabel = ts => { const r=new Date(ts); r.setHours(0,0,0,0); const d=Math.round((r-today)/dayMs); if(d===0)return'D-Day'; if(d>0)return`D-${d}`; return`D+${-d}`; };
  const ddayStyle = ts => { const r=new Date(ts); r.setHours(0,0,0,0); const d=Math.round((r-today)/dayMs); if(d<0)return{bg:C.surfaceL2,text:C.textSub}; if(d<=14)return{bg:'#3D1515',text:C.danger}; if(d<=60)return{bg:'#3D3300',text:C.gold}; return{bg:'#0D2E1A',text:C.accent}; };

  const filtered = useMemo(()=>{
    let list = regionTab==='all' ? MARATHON_SEED : MARATHON_SEED.filter(m=>m.type===regionTab);
    if(sortMode==='dday') list=[...list].sort((a,b)=>ddayKey(a.raceTs)-ddayKey(b.raceTs));
    if(sortMode==='late') list=[...list].sort((a,b)=>ddayKey(b.raceTs)-ddayKey(a.raceTs));
    return list;
  },[regionTab,sortMode]);

  return (
    <View style={{ flex:1, backgroundColor:C.bg }}>
      <View style={[ms.headerBox, { paddingTop: insets.top + 10 }]}>
        <Text style={ms.headerTitle}>🏅 마라톤 일정</Text>
      </View>

      <View style={ms.regionTabRow}>
        {[['all','전체'],['국내','국내'],['세계','세계']].map(([v,l])=>(
          <TouchableOpacity key={v} style={[ms.rTab, regionTab===v&&ms.rTabOn]} onPress={()=>setRegionTab(v)}>
            <Text style={regionTab===v?ms.rTabTxtOn:ms.rTabTxt}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={ms.sortRow}>
        {[['dday','D-Day↑'],['late','D-Day↓'],['api','기본']].map(([v,l])=>(
          <TouchableOpacity key={v} style={[ms.sortChip, sortMode===v&&ms.sortChipOn]} onPress={()=>setSortMode(v)}>
            <Text style={sortMode===v?ms.sortTxtOn:ms.sortTxt}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item=>item.id}
        renderItem={({item})=>{
          const ds=ddayStyle(item.raceTs);
          const isPast=item.raceTs<Date.now();
          return (
            <View style={ms.card}>
              <View style={{flex:1}}>
                <View style={ms.distBadge}><Text style={ms.distBadgeTxt}>{item.distance}</Text></View>
                <Text style={[ms.cardTitle, isPast&&{color:C.textSub}]}>{item.title}</Text>
                <View style={{flexDirection:'row',alignItems:'center',marginTop:4}}>
                  <MapPin size={11} color={C.textSub}/>
                  <Text style={ms.cardSub}>  {item.date} · {item.type}</Text>
                </View>
              </View>
              <View style={{alignItems:'flex-end',gap:8}}>
                <View style={[ms.ddayChip,{backgroundColor:ds.bg}]}>
                  <Text style={[ms.ddayTxt,{color:ds.text}]}>{ddayLabel(item.raceTs)}</Text>
                </View>
                {isPast
                  ? <View style={ms.closedBadge}><Text style={ms.closedTxt}>마감</Text></View>
                  : <TouchableOpacity style={ms.applyBtn}><Text style={ms.applyTxt}>신청하기</Text></TouchableOpacity>
                }
              </View>
            </View>
          );
        }}
        ItemSeparatorComponent={()=><View style={{height:1,backgroundColor:C.border}}/>}
      />
    </View>
  );
};

const ms = StyleSheet.create({
  headerBox:    { paddingHorizontal: 20, paddingBottom: 12, backgroundColor: C.bg },
  headerTitle:  { color: C.text, fontSize: 22, fontWeight: '800' },
  regionTabRow: { flexDirection:'row', paddingHorizontal:16, paddingTop:4, borderBottomWidth:1, borderColor:C.border },
  rTab:         { paddingHorizontal:14, paddingVertical:12, marginRight:4 },
  rTabOn:       { borderBottomWidth:2, borderColor:C.accent },
  rTabTxt:      { fontSize:15, fontWeight:'600', color:C.textSub },
  rTabTxtOn:    { fontSize:15, fontWeight:'800', color:C.accent },
  sortRow:      { flexDirection:'row', paddingHorizontal:12, paddingVertical:10, gap:8 },
  sortChip:     { paddingHorizontal:14, paddingVertical:7, borderRadius:20, backgroundColor:C.surfaceL2, borderWidth:1, borderColor:C.border },
  sortChipOn:   { backgroundColor:C.accent, borderColor:C.accent },
  sortTxt:      { fontSize:12, fontWeight:'600', color:C.textSub },
  sortTxtOn:    { fontSize:12, fontWeight:'700', color:'#000' },
  card:         { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, alignItems:'flex-start' },
  distBadge:    { alignSelf:'flex-start', backgroundColor:C.surfaceL2, borderRadius:6, paddingHorizontal:8, paddingVertical:3, marginBottom:6, borderWidth:1, borderColor:C.border },
  distBadgeTxt: { color:C.accent, fontSize:10, fontWeight:'800', letterSpacing:0.5 },
  cardTitle:    { fontSize:15, fontWeight:'700', color:C.text },
  cardSub:      { fontSize:12, color:C.textSub },
  ddayChip:     { borderRadius:10, paddingHorizontal:10, paddingVertical:5 },
  ddayTxt:      { fontSize:12, fontWeight:'800' },
  applyBtn:     { backgroundColor:C.accent, borderRadius:10, paddingVertical:7, paddingHorizontal:12 },
  applyTxt:     { color:'#000', fontSize:12, fontWeight:'800' },
  closedBadge:  { borderRadius:10, paddingVertical:7, paddingHorizontal:12, borderWidth:1, borderColor:C.border },
  closedTxt:    { color:C.textSub, fontSize:12, fontWeight:'600' },
});

// ─── 4. 피드 (커뮤니티) ────────────────────────────────────────────────────────
const FeedScreen = () => {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState([
    { id:'1', user:'러닝매니아', avatar:'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100', km:'10.2', images:['https://images.unsplash.com/photo-1502904550040-7534597429ae?w=800','https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800'], content:'오늘 10km 완주! 날씨도 딱이고 상쾌하네요 🌿', likes:47, liked:false },
    { id:'2', user:'마라톤꿈나무', avatar:'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100', km:'5.8', images:['https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800'], content:'새 신발 사고 첫 러닝 🏃‍♂️ 발이 너무 편해요!', likes:23, liked:false },
    { id:'3', user:'시티런너', avatar:'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=100', km:'7.4', images:['https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800','https://images.unsplash.com/photo-1551632436-cbf8dd35adfa?w=800'], content:'한강 야간 러닝 코스 추천! 야경이 진짜 예뻐요 ✨', likes:88, liked:false },
  ]);
  const [saved, setSaved] = useState(new Set());
  const [page, setPage] = useState({});

  const toggleLike = id => setPosts(p => p.map(x => x.id===id ? {...x, liked:!x.liked, likes:x.liked?x.likes-1:x.likes+1} : x));
  const toggleSave = id => setSaved(p => { const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });

  return (
    <View style={{flex:1, backgroundColor:C.bg}}>
      <View style={[fs.headerBox, {paddingTop: insets.top+10}]}>
        <Text style={fs.headerTitle}>피드</Text>
      </View>
      <FlatList
        data={posts}
        keyExtractor={item=>item.id}
        renderItem={({item})=>(
          <View style={fs.postCard}>
            <View style={fs.userRow}>
              <View style={fs.avatarRing}>
                <Image source={{uri:item.avatar}} style={{width:40,height:40}} />
              </View>
              <View style={{flex:1}}>
                <Text style={fs.userName}>{item.user}</Text>
                <Text style={fs.userSub}>{item.km}km · 오늘</Text>
              </View>
              <MoreHorizontal size={20} color={C.textSub} />
            </View>
            <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}
              onScroll={e=>setPage(p=>({...p,[item.id]:Math.round(e.nativeEvent.contentOffset.x/SCREEN_W)}))}
              scrollEventThrottle={16}>
              {item.images.map((uri,i)=>(
                <Image key={i} source={{uri}} style={{width:SCREEN_W,height:SCREEN_W*0.78}} resizeMode="cover"/>
              ))}
            </ScrollView>
            {item.images.length>1&&(
              <View style={fs.dotRow}>
                {item.images.map((_,i)=><View key={i} style={[fs.dot,i===(page[item.id]||0)&&fs.dotOn]}/>)}
              </View>
            )}
            <View style={fs.actionBar}>
              <TouchableOpacity style={{marginRight:16}} onPress={()=>toggleLike(item.id)}>
                <Heart size={24} color={item.liked?C.danger:C.text} fill={item.liked?C.danger:'transparent'}/>
              </TouchableOpacity>
              <TouchableOpacity style={{marginRight:16}}><MessageCircle size={24} color={C.text}/></TouchableOpacity>
              <TouchableOpacity><Share2 size={24} color={C.text}/></TouchableOpacity>
              <View style={{flex:1}}/>
              <TouchableOpacity onPress={()=>toggleSave(item.id)}>
                <Bookmark size={24} color={saved.has(item.id)?C.accent:C.text} fill={saved.has(item.id)?C.accent:'transparent'}/>
              </TouchableOpacity>
            </View>
            <Text style={fs.likesCount}>좋아요 {item.likes}개</Text>
            <Text style={fs.caption}><Text style={{fontWeight:'700'}}>{item.user} </Text>{item.content}</Text>
            <Text style={fs.commentPreview}>댓글 3개 모두 보기</Text>
          </View>
        )}
        ItemSeparatorComponent={()=><View style={{height:1,backgroundColor:C.border}}/>}
      />
    </View>
  );
};

const fs = StyleSheet.create({
  headerBox:     { paddingHorizontal:20, paddingBottom:12, backgroundColor:C.bg },
  headerTitle:   { fontSize:22, fontWeight:'800', color:C.text },
  postCard:      { backgroundColor:C.surface, paddingBottom:12 },
  userRow:       { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:10 },
  avatarRing:    { width:44, height:44, borderRadius:22, borderWidth:2, borderColor:C.accent, overflow:'hidden', marginRight:10 },
  userName:      { fontSize:14, fontWeight:'700', color:C.text },
  userSub:       { fontSize:11, color:C.textSub, marginTop:1 },
  dotRow:        { flexDirection:'row', justifyContent:'center', marginTop:-14, marginBottom:6, gap:5 },
  dot:           { width:6, height:6, borderRadius:3, backgroundColor:'rgba(255,255,255,0.25)' },
  dotOn:         { width:8, backgroundColor:C.accent },
  actionBar:     { flexDirection:'row', alignItems:'center', paddingHorizontal:12, paddingVertical:8 },
  likesCount:    { paddingHorizontal:12, fontSize:13, fontWeight:'700', color:C.text, marginBottom:3 },
  caption:       { paddingHorizontal:12, fontSize:13, color:C.text, lineHeight:18 },
  commentPreview:{ paddingHorizontal:12, paddingTop:4, fontSize:12, color:C.textSub },
});

// ─── 5. MY ────────────────────────────────────────────────────────────────────
const MyScreen = () => {
  const insets = useSafeAreaInsets();

  const RECENT = [
    { id:'1', emoji:'🌙', name:'한강 야경코스', km:7.2,  pace:"5'38\"", dur:'40:35', kcal:412, ago:'오늘' },
    { id:'2', emoji:'⛰️', name:'북한산 둘레길',  km:5.8,  pace:"6'12\"", dur:'35:58', kcal:334, ago:'어제' },
    { id:'3', emoji:'🌿', name:'올림픽공원',    km:5.4,  pace:"5'52\"", dur:'31:42', kcal:308, ago:'3일 전' },
  ];

  const STAMPS = [
    { id:'1', emoji:'🌉', name:'한강 야경', rarity:'골드',   rarC:C.gold },
    { id:'2', emoji:'⛰️', name:'북한산',    rarity:'실버',   rarC:'#A0A0A0' },
    { id:'3', emoji:'🌸', name:'봄꽃 코스', rarity:'스페셜', rarC:C.orange },
    { id:'4', emoji:'🌊', name:'해안 런',   rarity:'브론즈', rarC:'#CD7F32' },
    { id:'5', emoji:'🏙️', name:'도심 새벽', rarity:'에픽',   rarC:C.purple },
  ];

  return (
    <ScrollView style={{flex:1, backgroundColor:C.bg}} showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom:40}}>
      {/* 프로필 헤더 */}
      <View style={[ps.heroBox, {paddingTop: insets.top+16}]}>
        <View style={{flexDirection:'row', alignItems:'flex-start'}}>
          <View style={ps.avatarWrap}>
            <Text style={{fontSize:36}}>🏃</Text>
            <View style={ps.editDot}><Text style={{fontSize:10}}>✏️</Text></View>
          </View>
          <View style={{flex:1, marginLeft:14}}>
            <Text style={ps.heroName}>러너 김민수</Text>
            <View style={{flexDirection:'row', alignItems:'center', gap:8, marginTop:4}}>
              <View style={ps.gradeBadge}>
                <Text style={{fontSize:11}}>👑</Text>
                <Text style={ps.gradeTxt}> 골드 러너</Text>
              </View>
              <Text style={{color:C.textSub, fontSize:12}}>서울 · 30대</Text>
            </View>
            <Text style={ps.streakTxt}>🔥 5일 연속 러닝 중</Text>
          </View>
          <TouchableOpacity style={ps.settingsBtn}>
            <Text style={{color:C.textSub, fontSize:20}}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* 통계 4칸 */}
        <View style={ps.statRow}>
          {[['247','러닝'],['1,284','km'],['38','팔로워'],['12','스탬프']].map(([v,l],i)=>(
            <React.Fragment key={i}>
              {i>0&&<View style={ps.statDiv}/>}
              <View style={ps.statItem}>
                <Text style={ps.statVal}>{v}</Text>
                <Text style={ps.statLbl}>{l}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* 2026년 요약 */}
      <View style={ps.section}>
        <View style={ps.yearCard}>
          <Text style={ps.yearLabel}>2026년 러닝 기록</Text>
          <View style={{flexDirection:'row', marginTop:12}}>
            {[['1,284','km','총 거리',C.accent],['247','회','총 러닝',C.purple],["5'52\"",'/km','평균 페이스',C.orange]].map(([v,u,l,color],i)=>(
              <View key={i} style={{flex:1, alignItems:'center'}}>
                <Text style={[ps.yearVal,{color}]}>{v}<Text style={[ps.yearUnit,{color}]}>{u}</Text></Text>
                <Text style={ps.yearLbl}>{l}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 최근 러닝 */}
      <View style={ps.section}>
        <View style={ps.sectionRow}>
          <Text style={ps.sectionTitle}>최근 러닝</Text>
          <TouchableOpacity><Text style={ps.sectionMore}>전체보기</Text></TouchableOpacity>
        </View>
        {RECENT.map(r=>(
          <View key={r.id} style={ps.runCard}>
            <View style={ps.runEmoji}><Text style={{fontSize:22}}>{r.emoji}</Text></View>
            <View style={{flex:1, marginLeft:12}}>
              <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                <Text style={ps.runName}>{r.name}</Text>
                <Text style={{color:C.textSub, fontSize:11}}>{r.ago}</Text>
              </View>
              <View style={{flexDirection:'row', gap:12, marginTop:4}}>
                <Text style={{color:C.accent, fontSize:12, fontWeight:'700'}}>{r.km}km</Text>
                <Text style={{color:C.text, fontSize:12, fontWeight:'600'}}>{r.pace}</Text>
                <Text style={{color:C.textSub, fontSize:12}}>{r.dur}</Text>
                <Text style={{color:C.orange, fontSize:12, fontWeight:'600'}}>{r.kcal}kcal</Text>
              </View>
            </View>
            <ChevronRight size={16} color={C.textSub}/>
          </View>
        ))}
      </View>

      {/* 스탬프 */}
      <View style={ps.section}>
        <View style={ps.sectionRow}>
          <Text style={ps.sectionTitle}>획득한 스탬프</Text>
          <TouchableOpacity><Text style={ps.sectionMore}>전체보기</Text></TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginHorizontal:-16}} contentContainerStyle={{paddingHorizontal:16, gap:10}}>
          {STAMPS.map(s=>(
            <View key={s.id} style={[ps.stampChip, {borderColor: s.rarC+'66'}]}>
              <Text style={{fontSize:24}}>{s.emoji}</Text>
              <Text style={ps.stampName}>{s.name}</Text>
              <Text style={[ps.stampRarity,{color:s.rarC}]}>{s.rarity}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 메뉴 */}
      <View style={ps.section}>
        {[
          [{icon:'👥', label:'친구 찾기', color:C.accentB},{icon:'🏆', label:'러닝 챌린지', color:C.gold},{icon:'📤', label:'앱 공유', color:C.accent}],
          [{icon:'🔔', label:'알림 설정', color:C.orange},{icon:'🎯', label:'주간 목표', color:'#34C759'},{icon:'🌐', label:'언어 설정', color:C.purple}],
          [{icon:'❓', label:'도움말', color:C.textSub},{icon:'🚪', label:'로그아웃', color:C.danger}],
        ].map((group, gi)=>(
          <View key={gi} style={[ps.menuGroup, gi>0&&{marginTop:10}]}>
            {group.map((item,i)=>(
              <React.Fragment key={i}>
                {i>0&&<View style={{height:1, backgroundColor:C.border, marginLeft:50}}/>}
                <TouchableOpacity style={ps.menuRow}>
                  <View style={[ps.menuIcon,{backgroundColor:item.color+'22'}]}>
                    <Text style={{fontSize:16}}>{item.icon}</Text>
                  </View>
                  <Text style={ps.menuLabel}>{item.label}</Text>
                  <ChevronRight size={16} color={C.textSub}/>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const ps = StyleSheet.create({
  heroBox:    { backgroundColor:C.surface, paddingHorizontal:20, paddingBottom:20, borderBottomWidth:1, borderColor:C.border, marginBottom:16 },
  avatarWrap: { width:72, height:72, borderRadius:36, backgroundColor:C.accentB+'33', justifyContent:'center', alignItems:'center', borderWidth:2, borderColor:C.accent },
  editDot:    { position:'absolute', bottom:2, right:2, width:20, height:20, borderRadius:10, backgroundColor:C.surface, justifyContent:'center', alignItems:'center' },
  heroName:   { color:C.text, fontSize:20, fontWeight:'800' },
  gradeBadge: { flexDirection:'row', alignItems:'center', backgroundColor:C.gold+'22', paddingHorizontal:8, paddingVertical:3, borderRadius:8 },
  gradeTxt:   { color:C.gold, fontSize:11, fontWeight:'700' },
  streakTxt:  { color:C.accent, fontSize:12, fontWeight:'600', marginTop:5 },
  settingsBtn:{ padding:4 },
  statRow:    { flexDirection:'row', backgroundColor:C.surfaceL2, borderRadius:12, marginTop:16, paddingVertical:12 },
  statDiv:    { width:1, backgroundColor:C.border },
  statItem:   { flex:1, alignItems:'center' },
  statVal:    { color:C.text, fontSize:17, fontWeight:'800' },
  statLbl:    { color:C.textSub, fontSize:11, marginTop:2 },
  section:    { paddingHorizontal:16, marginBottom:8 },
  sectionRow: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10, paddingTop:8 },
  sectionTitle:{ color:C.text, fontSize:15, fontWeight:'700' },
  sectionMore: { color:C.accent, fontSize:12, fontWeight:'600' },
  yearCard:   { backgroundColor:C.surface, borderRadius:14, padding:16, borderWidth:1, borderColor:C.border },
  yearLabel:  { color:C.textSub, fontSize:13, fontWeight:'600' },
  yearVal:    { fontSize:20, fontWeight:'800', letterSpacing:-0.5 },
  yearUnit:   { fontSize:11, fontWeight:'600' },
  yearLbl:    { color:C.textSub, fontSize:11, marginTop:3, textAlign:'center' },
  runCard:    { flexDirection:'row', alignItems:'center', backgroundColor:C.surface, borderRadius:12, padding:12, marginBottom:8, borderWidth:1, borderColor:C.border },
  runEmoji:   { width:44, height:44, borderRadius:12, backgroundColor:C.surfaceL2, justifyContent:'center', alignItems:'center' },
  runName:    { color:C.text, fontSize:14, fontWeight:'700' },
  stampChip:  { width:76, alignItems:'center', backgroundColor:C.surface, borderRadius:12, paddingVertical:10, paddingHorizontal:4, borderWidth:1.5 },
  stampName:  { color:C.text, fontSize:10, fontWeight:'600', marginTop:4, textAlign:'center' },
  stampRarity:{ fontSize:9, fontWeight:'700', marginTop:2 },
  menuGroup:  { backgroundColor:C.surface, borderRadius:14, overflow:'hidden', borderWidth:1, borderColor:C.border },
  menuRow:    { flexDirection:'row', alignItems:'center', paddingHorizontal:14, paddingVertical:13 },
  menuIcon:   { width:32, height:32, borderRadius:8, justifyContent:'center', alignItems:'center', marginRight:12 },
  menuLabel:  { flex:1, color:C.text, fontSize:14, fontWeight:'500' },
});

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={C.bg} />
        <Tab.Navigator
          screenOptions={{
            tabBarActiveTintColor:   C.accent,
            tabBarInactiveTintColor: C.textSub,
            tabBarStyle:             { backgroundColor: C.bg, borderTopColor: C.border, borderTopWidth: 1, height: 64, paddingBottom: 8 },
            tabBarLabelStyle:        { fontSize: 10, fontWeight: '700' },
            headerShown:             false,
          }}
        >
          <Tab.Screen name="홈"     component={HomeScreen}     options={{ tabBarIcon: ({ color }) => <Home     color={color} size={24}/> }} />
          <Tab.Screen name="러닝"   component={RunScreen}      options={{ tabBarIcon: ({ color }) => <Play     color={color} size={24}/> }} />
          <Tab.Screen name="마라톤" component={MarathonScreen} options={{ tabBarIcon: ({ color }) => <Calendar color={color} size={24}/> }} />
          <Tab.Screen name="피드"   component={FeedScreen}     options={{ tabBarIcon: ({ color }) => <Users    color={color} size={24}/> }} />
          <Tab.Screen name="MY"     component={MyScreen}       options={{ tabBarIcon: ({ color }) => <User     color={color} size={24}/> }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
