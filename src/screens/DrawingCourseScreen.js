import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

const TEMPLATES = [
  {
    key: 'dog_gyeongbok',
    name: '경복궁 강아지런',
    shape: '강아지',
    emoji: '🐕',
    totalKm: 7.8,
    description: '달리면 지도에 강아지가!',
    area: '경복궁·광화문',
  },
  {
    key: 'heart_hanriver',
    name: '한강 하트런',
    shape: '하트',
    emoji: '❤️',
    totalKm: 9.2,
    description: '한강에서 그리는 로맨틱 코스',
    area: '한강공원',
  },
  {
    key: 'star_namsan',
    name: '남산 별런',
    shape: '별',
    emoji: '⭐',
    totalKm: 8.5,
    description: '남산 주변 반짝반짝 별 코스',
    area: '남산·명동',
  },
];

export default function DrawingCourseScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customShape, setCustomShape] = useState('');
  const [customArea, setCustomArea] = useState('');

  const handleCustomRequest = () => {
    if (!customShape.trim() || !customArea.trim()) {
      Alert.alert('알림', '모양과 지역을 모두 입력해주세요');
      return;
    }
    Alert.alert(
      '요청 전송됨',
      `지도 요정 COSHI가 ${customArea}에서 ${customShape} 코스를 만들고 있어요!`
    );
  };

  const handleStart = () => {
    if (!selected) return;
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      // '러닝' 화면으로 전환 및 코스 데이터 전달 시뮬레이션
      navigation.navigate('러닝', { course: selected, type: 'drawing' });
    }, 1000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#FFF" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>🗺️ GPS 드로잉 코스</Text>
          <Text style={styles.headerSub}>달리면서 지도에 그림 그리기</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* COSHI 메시지 */}
        <View style={styles.coshiBox}>
          <View style={styles.coshiAvatar}>
            <Text style={{ fontSize: 20 }}>🗺️</Text>
          </View>
          <View style={styles.coshiTextWrap}>
            <Text style={styles.coshiName}>COSHI</Text>
            <Text style={styles.coshiMessage}>
              원하는 모양을 선택하면 실제 달릴 수 있는 GPS 코스로 만들어드릴게요! 🎨
            </Text>
          </View>
        </View>

        {/* 템플릿 그리드 */}
        <Text style={styles.sectionTitle}>인기 드로잉 코스</Text>
        <View style={styles.grid}>
          {TEMPLATES.map((t) => {
            const isSelected = selected?.key === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.templateCard, isSelected && styles.templateCardSelected]}
                onPress={() => setSelected(t)}
                activeOpacity={0.8}
              >
                <Text style={{ fontSize: 32, marginBottom: 6 }}>{t.emoji}</Text>
                <Text style={styles.tShape}>{t.shape}</Text>
                <Text style={[styles.tKm, isSelected && { color: '#00E87A' }]}>
                  {t.totalKm}km
                </Text>
                <Text style={styles.tArea} numberOfLines={1}>
                  {t.area}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 커스텀 요청 */}
        <Text style={styles.sectionTitle}>직접 요청하기</Text>
        <View style={styles.customRow}>
          <TextInput
            style={styles.input}
            placeholder="모양 (예: 고양이, 별)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={customShape}
            onChangeText={setCustomShape}
          />
          <TextInput
            style={styles.input}
            placeholder="지역 (예: 한강, 홍대)"
            placeholderTextColor="rgba(255,255,255,0.3)"
            value={customArea}
            onChangeText={setCustomArea}
          />
        </View>
        <TouchableOpacity style={styles.customBtn} onPress={handleCustomRequest}>
          <Text style={styles.customBtnTxt}>🤖 COSHI에게 코스 만들어달라고 하기</Text>
        </TouchableOpacity>

        {/* 선택된 코스 프리뷰 */}
        {selected && (
          <View style={styles.previewBox}>
            <View style={styles.previewTop}>
              <Text style={{ fontSize: 24, marginRight: 10 }}>{selected.emoji}</Text>
              <View>
                <Text style={styles.previewName}>{selected.name}</Text>
                <Text style={styles.previewArea}>{selected.area}</Text>
              </View>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>📏 총 거리</Text>
              <Text style={styles.statVal}>{selected.totalKm}km</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>📍 지역</Text>
              <Text style={styles.statVal}>{selected.area}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>🎨 모양</Text>
              <Text style={styles.statVal}>{selected.shape}</Text>
            </View>
            <View style={styles.coshiQuote}>
              <Text style={styles.coshiQuoteTxt}>
                💬 COSHI: "{selected.description} 이 코스 완주하면 지도에 {selected.shape} 완성이에요!"
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 하단 버튼 */}
      {selected && (
        <View style={[styles.bottomBtnWrap, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={handleStart}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <ActivityIndicator color="#003820" />
            ) : (
              <Text style={styles.startBtnTxt}>🏃 이 코스로 달리기</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D14' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 100 },

  coshiBox: {
    flexDirection: 'row',
    backgroundColor: '#1E1E2E',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,232,122,0.3)',
    padding: 14,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  coshiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,232,122,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coshiTextWrap: { flex: 1, marginLeft: 12 },
  coshiName: { color: '#00E87A', fontSize: 12, fontWeight: '700', marginBottom: 2 },
  coshiMessage: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 18 },

  sectionTitle: { color: '#FFF', fontSize: 14, fontWeight: '700', marginBottom: 12, marginTop: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  templateCard: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  templateCardSelected: { borderColor: '#00E87A', borderWidth: 2 },
  tShape: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  tKm: { color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 2 },
  tArea: { color: 'rgba(255,255,255,0.4)', fontSize: 10, marginTop: 4 },

  customRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  input: {
    flex: 1,
    backgroundColor: '#1E1E2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 13,
  },
  customBtn: {
    backgroundColor: '#1E1E2E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  customBtnTxt: { color: '#00E87A', fontSize: 13, fontWeight: '700' },

  previewBox: {
    backgroundColor: '#1E1E2E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,232,122,0.25)',
    padding: 16,
    marginBottom: 24,
  },
  previewTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  previewName: { color: '#FFF', fontSize: 16, fontWeight: '900' },
  previewArea: { color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 2 },
  statRow: { flexDirection: 'row', marginVertical: 3, alignItems: 'center' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 12, width: 60 },
  statVal: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  coshiQuote: {
    backgroundColor: 'rgba(0,232,122,0.08)',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  coshiQuoteTxt: { color: '#00E87A', fontSize: 12, lineHeight: 17 },

  bottomBtnWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0D0D14',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  startBtn: {
    backgroundColor: '#00E87A',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startBtnTxt: { color: '#003820', fontSize: 15, fontWeight: '900' },
});
