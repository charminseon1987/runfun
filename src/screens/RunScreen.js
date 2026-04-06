import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Modal,
  Pressable,
  Share,
  Platform,
  Alert,
} from 'react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Play, Clock } from 'lucide-react-native';
import RunMapView from '../components/RunMapView';
import { useAppData } from '../context/AppDataContext';
import { useAgent } from '../context/AgentContext';
import { downsampleCoords, pathDistanceKm } from '../utils/geo';
import { formatPace } from '../utils/stats';
import { C, ax } from '../theme/season';
import { api } from '../api/client';
import { closeRunningSocket, createRunningSocket, sendRunningSocket } from '../realtime/runningSocket';

const DEFAULT_REGION = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

const IS_WEB = Platform.OS === 'web';

export default function RunScreen({ route }) {
  const joinMode = !!route?.params?.joinMode;
  const hostName = route?.params?.hostName || '친구';
  const hostSessionId = route?.params?.hostSessionId || null;
  useEffect(() => {
    if (IS_WEB) return;
    if (Platform.OS === 'android' && Constants.appOwnership === 'expo') {
      console.warn(
        '[RunFun] Expo Go(Android)에는 프로젝트 .env의 GOOGLE_MAPS_API_KEY가 넣어지지 않습니다. 지도가 비면: (1) `npx expo run:android`로 개발 빌드 실행 (2) 또는 Google Cloud에서 키 제한을 일시 해제·Expo Go용 패키지(host.exp.exponent) 허용'
      );
    }
  }, []);

  const [phase, setPhase] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [km, setKm] = useState(0);
  const [laps, setLaps] = useState([]);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const [routeCoords, setRouteCoords] = useState([]);
  const [friendRouteCoords, setFriendRouteCoords] = useState([]);
  const [friendCurrentPoint, setFriendCurrentPoint] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  const intervalRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const startTimeRef = useRef(null);
  const elapsedAtPauseRef = useRef(0);
  const kmRef = useRef(0);
  const mapRef = useRef(null);
  const watchRef = useRef(null);
  const runStartedAtRef = useRef(null);
  const sessionIdRef = useRef(null); // 백엔드 RunningSession ID
  const elapsedRef = useRef(0);
  const publishWsRef = useRef(null);
  const subscribeWsRef = useRef(null);

  const { addRun } = useAppData();
  const { updateLocation } = useAgent();
  useEffect(() => {
    elapsedRef.current = elapsed;
  }, [elapsed]);

  useEffect(() => {
    return () => {
      closeRunningSocket(publishWsRef.current);
      closeRunningSocket(subscribeWsRef.current);
      publishWsRef.current = null;
      subscribeWsRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (IS_WEB || !sessionId) return;
    if (phase === 'running') {
      if (!publishWsRef.current) {
        createRunningSocket(sessionId).then((ws) => {
          publishWsRef.current = ws;
        });
      }
      return;
    }
    closeRunningSocket(publishWsRef.current);
    publishWsRef.current = null;
  }, [phase, sessionId]);

  useEffect(() => {
    if (phase === 'running') {
      startTimeRef.current = Date.now();
      intervalRef.current = setInterval(() => {
        const delta = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setElapsed(elapsedAtPauseRef.current + delta);
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
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: false }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, { toValue: 1.0, duration: 200, useNativeDriver: false }).start();
    }
  }, [phase, pulseAnim]);

  /** 앱 진입 시 위치 권한·현재 위치로 지도 초기화 (웹은 플레이스홀더만) */
  useEffect(() => {
    if (IS_WEB) return;
    let cancelled = false;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          if (!cancelled) {
            Alert.alert(
              '위치 권한',
              '지도에 현재 위치를 표시하려면 설정에서 위치 권한을 허용해 주세요. (미허용 시 서울 시내가 기본으로 보여요.)'
            );
          }
          return;
        }
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cancelled) return;
        const next = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012,
        };
        setMapRegion(next);
        requestAnimationFrame(() => {
          mapRef.current?.animateToRegion(next, 500);
        });
      } catch {
        if (!cancelled) {
          Alert.alert('위치 오류', '현재 위치를 가져오지 못했어요. 네트워크·GPS를 확인해 주세요.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** 러닝 중 이동 경로 수집·지도 따라가기 */
  useEffect(() => {
    if (IS_WEB || phase !== 'running') {
      watchRef.current?.remove();
      watchRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (cancelled || status !== 'granted') return;
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 4,
        },
        (loc) => {
          const pt = {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          };
          // AI 코치가 위치 기반 추천에 사용
          updateLocation(loc.coords.latitude, loc.coords.longitude);
          setRouteCoords((prev) => {
            const last = prev[prev.length - 1];
            if (
              last &&
              Math.abs(last.latitude - pt.latitude) < 0.00001 &&
              Math.abs(last.longitude - pt.longitude) < 0.00001
            ) {
              return prev;
            }
            const next = [...prev, pt];
            const kmNow = pathDistanceKm(next);
            kmRef.current = kmNow;
            setKm(kmNow);
            sendRunningSocket(publishWsRef.current, {
              latitude: pt.latitude,
              longitude: pt.longitude,
              distance_km: kmNow,
              duration_sec: elapsedRef.current,
              at: Date.now(),
            });
            return next;
          });
          mapRef.current?.animateToRegion(
            {
              ...pt,
              latitudeDelta: 0.006,
              longitudeDelta: 0.006,
            },
            400
          );
        }
      );
      if (cancelled) {
        subscription.remove();
        return;
      }
      watchRef.current = subscription;
    })();
    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [phase]);

  useEffect(() => {
    if (IS_WEB || !joinMode || !hostSessionId) {
      closeRunningSocket(subscribeWsRef.current);
      subscribeWsRef.current = null;
      setFriendCurrentPoint(null);
      setFriendRouteCoords([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const ws = await createRunningSocket(hostSessionId, {
        onMessage: (msg) => {
          if (!msg || typeof msg !== 'object') return;
          const lat = Number(msg.latitude);
          const lng = Number(msg.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          const pt = { latitude: lat, longitude: lng };
          setFriendCurrentPoint(pt);
          setFriendRouteCoords((prev) => {
            const last = prev[prev.length - 1];
            if (
              last &&
              Math.abs(last.latitude - pt.latitude) < 0.00001 &&
              Math.abs(last.longitude - pt.longitude) < 0.00001
            ) {
              return prev;
            }
            return [...prev, pt];
          });
        },
      });
      if (cancelled) {
        closeRunningSocket(ws);
        return;
      }
      subscribeWsRef.current = ws;
    })();
    return () => {
      cancelled = true;
      closeRunningSocket(subscribeWsRef.current);
      subscribeWsRef.current = null;
    };
  }, [joinMode, hostSessionId]);

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const paceStr = useMemo(() => formatPace(elapsed, km), [elapsed, km]);

  const kcal = Math.round(km * 62);

  const buildRunRecord = () => {
    const dist = kmRef.current;
    const dur = elapsedRef.current;
    const endedAt = Date.now();
    const startedAt = runStartedAtRef.current || endedAt - dur * 1000;
    const paces = dur > 0 && dist > 0 ? dur / 60 / dist : null;
    return {
      startedAt,
      endedAt,
      distanceKm: Math.round(dist * 100) / 100,
      durationSec: dur,
      paceStr: formatPace(dur, dist),
      paceNum: paces ? Math.round(paces * 100) / 100 : null,
      kcal: Math.round(dist * 62),
      laps,
      routeSample: downsampleCoords(routeCoords, 180),
      emoji: '🏃',
      label: 'GPS 러닝',
      _sessionId: sessionIdRef.current, // 백엔드 동기화용 (저장 후 제거됨)
    };
  };

  const saveRunAndReset = async () => {
    try {
      await addRun(buildRunRecord());
    } catch {
      Alert.alert('저장 실패', '러닝 기록을 저장하지 못했어요. 저장 공간을 확인해 주세요.');
    }
    setPhase('idle');
    setElapsed(0);
    setKm(0);
    setLaps([]);
    kmRef.current = 0;
    elapsedAtPauseRef.current = 0;
    runStartedAtRef.current = null;
    sessionIdRef.current = null;
    setSessionId(null);
    setShowFinishModal(false);
    setRouteCoords([]);
    setFriendRouteCoords([]);
    setFriendCurrentPoint(null);
    closeRunningSocket(publishWsRef.current);
    publishWsRef.current = null;
  };

  const resetRun = () => {
    setPhase('idle');
    setElapsed(0);
    setKm(0);
    setLaps([]);
    kmRef.current = 0;
    elapsedAtPauseRef.current = 0;
    runStartedAtRef.current = null;
    sessionIdRef.current = null;
    setSessionId(null);
    setShowFinishModal(false);
    setRouteCoords([]);
    setFriendRouteCoords([]);
    setFriendCurrentPoint(null);
    closeRunningSocket(publishWsRef.current);
    publishWsRef.current = null;
  };

  const onFinishWithShare = async () => {
    try {
      const msg = `오늘 러닝 기록\n- 거리: ${kmRef.current.toFixed(2)}km\n- 시간: ${fmt(elapsedRef.current)}\n- 페이스: ${formatPace(elapsedRef.current, kmRef.current)}\n- 칼로리: ${Math.round(kmRef.current * 62)}kcal`;
      await Share.share({ message: msg });
    } catch (e) {
      // 공유가 취소되거나 실패해도 종료는 진행
    } finally {
      await saveRunAndReset();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={StyleSheet.absoluteFillObject} collapsable={false}>
        <RunMapView
          ref={mapRef}
          mapRegion={mapRegion}
          routeCoords={routeCoords}
          friendRouteCoords={friendRouteCoords}
          friendCurrentPoint={friendCurrentPoint}
          showFriendLayer={joinMode}
        />
      </View>

      <View style={rs.topChip}>
        <Clock size={13} color={C.accent} />
        <Text style={rs.topChipTxt}>{fmt(elapsed)}</Text>
      </View>
      {joinMode && (
        <View style={rs.joinChip}>
          <Text style={rs.joinChipTxt}>{hostName}님과 함께 달리는 중</Text>
        </View>
      )}

      {phase === 'running' && (
        <Animated.View style={[rs.pulseRing, { transform: [{ scale: pulseAnim }] }]} />
      )}

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
                <Text style={rs.lapTxt}>
                  Lap {laps.length > 5 ? laps.length - 5 + i + 1 : i + 1} {l.lapKm}km {l.lapTime}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        {phase === 'idle' && (
          <TouchableOpacity
            style={rs.cta}
            onPress={async () => {
              elapsedAtPauseRef.current = 0;
              kmRef.current = 0;
              setKm(0);
              setElapsed(0);
              setRouteCoords([]);
              setLaps([]);
              const startedAt = Date.now();
              runStartedAtRef.current = startedAt;
              setPhase('running');
              // 백엔드 세션 시작 (실패해도 앱 동작에 영향 없음)
              try {
                const res = await api.post('/running/start', {
                  started_at: new Date(startedAt).toISOString(),
                });
                sessionIdRef.current = res.id;
                setSessionId(res.id);
              } catch {
                sessionIdRef.current = null;
                setSessionId(null);
              }
            }}
          >
            <Play size={18} color={C.onAccent} fill={C.onAccent} />
            <Text style={rs.ctaTxt}>러닝 시작</Text>
          </TouchableOpacity>
        )}
        {phase === 'running' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={rs.ctaSec}
              onPress={() =>
                setLaps((p) => [...p, { lapKm: kmRef.current.toFixed(2), lapTime: fmt(elapsed) }])
              }
            >
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
              style={[rs.ctaSec, { backgroundColor: 'rgba(224,84,84,0.12)', borderColor: C.danger }]}
              onPress={() => setShowFinishModal(true)}
            >
              <Text style={[rs.ctaSecTxt, { color: C.danger }]}>종료</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Modal
        visible={showFinishModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowFinishModal(false)}
      >
        <View style={rs.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowFinishModal(false)} />
          <View style={rs.modalCard}>
            <Text style={rs.modalTitle}>러닝을 종료할까요?</Text>
            <Text style={rs.modalBody}>기록을 공유할지 선택해 주세요.</Text>

            <View style={rs.summaryBox}>
              <Text style={rs.summaryText}>거리 {km.toFixed(2)}km</Text>
              <Text style={rs.summaryText}>시간 {fmt(elapsed)}</Text>
              <Text style={rs.summaryText}>페이스 {paceStr}</Text>
              <Text style={rs.summaryText}>칼로리 {kcal}kcal</Text>
            </View>

            <TouchableOpacity style={rs.modalPrimaryBtn} onPress={onFinishWithShare}>
              <Text style={rs.modalPrimaryTxt}>공유하고 종료</Text>
            </TouchableOpacity>
            <TouchableOpacity style={rs.modalSecondaryBtn} onPress={() => void saveRunAndReset()}>
              <Text style={rs.modalSecondaryTxt}>공유 안 하고 종료</Text>
            </TouchableOpacity>
            <TouchableOpacity style={rs.modalGhostBtn} onPress={() => setShowFinishModal(false)}>
              <Text style={rs.modalGhostTxt}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const rs = StyleSheet.create({
  topChip: {
    position: 'absolute',
    top: 56,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: C.border,
  },
  topChipTxt: { color: C.text, fontSize: 14, fontWeight: '700' },
  joinChip: {
    position: 'absolute',
    top: 92,
    alignSelf: 'center',
    backgroundColor: 'rgba(125,211,168,0.2)',
    borderColor: C.accent,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  joinChipTxt: { color: C.accentDeep, fontSize: 12, fontWeight: '700' },
  pulseRing: {
    position: 'absolute',
    alignSelf: 'center',
    top: '32%',
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: ax(0.1),
    borderWidth: 2,
    borderColor: C.accent,
  },
  bottom: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 32,
    paddingHorizontal: 16,
    paddingTop: 20,
    backgroundColor: 'rgba(255,255,255,0.97)',
  },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  statNum: { fontSize: 22, fontWeight: '800', color: C.text },
  statLbl: { fontSize: 10, color: C.textSub, marginTop: 4, fontWeight: '600' },
  lapChip: {
    backgroundColor: C.surfaceL2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: C.border,
  },
  lapTxt: { color: C.textSub, fontSize: 11, fontWeight: '600' },
  cta: {
    height: 56,
    borderRadius: 14,
    backgroundColor: C.accent,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  ctaTxt: { fontSize: 16, fontWeight: '800', color: C.onAccent },
  ctaSec: {
    flex: 1,
    height: 56,
    borderRadius: 14,
    backgroundColor: C.surfaceL2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  ctaSecTxt: { fontSize: 15, fontWeight: '700', color: C.text },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  modalCard: {
    backgroundColor: C.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
  },
  modalTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  modalBody: { color: C.textSub, marginTop: 6, marginBottom: 12, fontSize: 13 },
  summaryBox: {
    backgroundColor: C.surfaceL2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    gap: 4,
    marginBottom: 14,
  },
  summaryText: { color: C.text, fontSize: 13, fontWeight: '600' },
  modalPrimaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  modalPrimaryTxt: { color: C.onAccent, fontSize: 14, fontWeight: '800' },
  modalSecondaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: C.surfaceL2,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  modalSecondaryTxt: { color: C.text, fontSize: 14, fontWeight: '700' },
  modalGhostBtn: { alignItems: 'center', justifyContent: 'center', height: 38 },
  modalGhostTxt: { color: C.textSub, fontSize: 13, fontWeight: '600' },
});
