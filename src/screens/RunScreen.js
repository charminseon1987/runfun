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
import { Play, Clock } from 'lucide-react-native';
import RunMapView from '../components/RunMapView';
import { C, ax } from '../theme/season';

const DEFAULT_REGION = {
  latitude: 37.5665,
  longitude: 126.978,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
};

const IS_WEB = Platform.OS === 'web';

export default function RunScreen() {
  const [phase, setPhase] = useState('idle');
  const [elapsed, setElapsed] = useState(0);
  const [km, setKm] = useState(0);
  const [laps, setLaps] = useState([]);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [mapRegion, setMapRegion] = useState(DEFAULT_REGION);
  const [routeCoords, setRouteCoords] = useState([]);

  const intervalRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const startTimeRef = useRef(null);
  const elapsedAtPauseRef = useRef(0);
  const kmRef = useRef(0);
  const mapRef = useRef(null);
  const watchRef = useRef(null);

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
          setRouteCoords((prev) => {
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

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const paceStr = useMemo(() => {
    if (km < 0.05 || elapsed < 1) return "--'--\"";
    const sPerKm = elapsed / km;
    return `${Math.floor(sPerKm / 60)}'${String(Math.round(sPerKm % 60)).padStart(2, '"')}`;
  }, [elapsed, km]);

  const kcal = Math.round(km * 62);

  const resetRun = () => {
    setPhase('idle');
    setElapsed(0);
    setKm(0);
    setLaps([]);
    kmRef.current = 0;
    elapsedAtPauseRef.current = 0;
    setShowFinishModal(false);
    setRouteCoords([]);
  };

  const onFinishWithShare = async () => {
    try {
      const msg = `오늘 러닝 기록\n- 거리: ${km.toFixed(2)}km\n- 시간: ${fmt(elapsed)}\n- 페이스: ${paceStr}\n- 칼로리: ${kcal}kcal`;
      await Share.share({ message: msg });
    } catch (e) {
      // 공유가 취소되거나 실패해도 종료는 진행
    } finally {
      resetRun();
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <RunMapView ref={mapRef} mapRegion={mapRegion} routeCoords={routeCoords} />

      <View style={rs.topChip}>
        <Clock size={13} color={C.accent} />
        <Text style={rs.topChipTxt}>{fmt(elapsed)}</Text>
      </View>

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
          <TouchableOpacity style={rs.cta} onPress={() => setPhase('running')}>
            <Play size={18} color={C.onAccent} fill={C.onAccent} />
            <Text style={rs.ctaTxt}>러닝 시작</Text>
          </TouchableOpacity>
        )}
        {phase === 'running' && (
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={rs.ctaSec}
              onPress={() =>
                setLaps((p) => [...p, { lapKm: km.toFixed(2), lapTime: fmt(elapsed) }])
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
            <TouchableOpacity style={rs.modalSecondaryBtn} onPress={resetRun}>
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
