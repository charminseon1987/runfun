import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Utensils } from 'lucide-react-native';

import { C, ax } from '../theme/season';

const API_TOKEN_KEY = '@runfun/api_token';

function getApiBaseUrl() {
  return (Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:8000/v1').replace(/\/$/, '');
}

async function getAuthToken() {
  try {
    return await AsyncStorage.getItem(API_TOKEN_KEY);
  } catch {
    return null;
  }
}

function GoalButton({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.goalBtn, active && { backgroundColor: C.accent, borderColor: C.accent }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.goalBtnTxt, active && { color: C.onAccent }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function FridgeScreen() {
  const [goal, setGoal] = useState('유지'); // 감량|유지|증량
  const [distanceKm, setDistanceKm] = useState('0');
  const [calories, setCalories] = useState('600');

  const [imageAsset, setImageAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const apiBaseUrl = useMemo(() => getApiBaseUrl(), []);

  const pickFromGallery = async () => {
    setResult(null);
    setErrorMsg('');
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    setImageAsset(asset || null);
  };

  const pickFromCamera = async () => {
    setResult(null);
    setErrorMsg('');
    const res = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
    });
    if (res.canceled) return;
    const asset = res.assets?.[0];
    setImageAsset(asset || null);
  };

  const scan = async () => {
    if (!imageAsset?.uri) {
      setErrorMsg('이미지를 먼저 선택해 주세요.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      const token = await getAuthToken();
      if (!token) throw new Error('로그인 토큰이 없습니다.');

      const form = new FormData();
      const uri = imageAsset.uri;
      const name = imageAsset.fileName || `fridge-${Date.now()}.jpg`;
      const type = imageAsset.mimeType || 'image/jpeg';

      form.append('file', { uri, name, type });
      form.append('diet_goal', goal);

      const dist = Number(distanceKm);
      const cal = Number(calories);
      if (Number.isFinite(dist) && dist > 0) form.append('distance_km', String(dist));
      if (Number.isFinite(cal) && cal > 0) form.append('calories', String(cal));

      const res = await fetch(`${apiBaseUrl}/agent/fridge/scan`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // multipart/form-data는 브라우저/런타임이 boundary 처리
        },
        body: form,
      });

      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.detail || '스캔에 실패했어요.');
      }
      setResult(data);
    } catch (e) {
      setErrorMsg(e?.message || '스캔 실패');
    } finally {
      setLoading(false);
    }
  };

  const ingredients = result?.ingredients || [];
  const recipes = result?.recipes || [];
  const nutritionPlan = result?.nutrition_plan || {};

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Utensils size={24} color={C.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>냉장고 레시피</Text>
          <Text style={styles.headerSub}>사진 업로드 → 재료 인식 → 레시피/식단 생성</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1) 이미지 선택</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <TouchableOpacity style={styles.pickBtn} onPress={pickFromCamera} activeOpacity={0.85}>
            <Text style={styles.pickBtnTxt}>카메라</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickBtn} onPress={pickFromGallery} activeOpacity={0.85}>
            <Text style={styles.pickBtnTxt}>갤러리</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.smallText} numberOfLines={2}>
          선택됨: {imageAsset ? '예' : '아니오'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2) 목표/회복 입력</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <GoalButton label="감량" active={goal === '감량'} onPress={() => setGoal('감량')} />
          <GoalButton label="유지" active={goal === '유지'} onPress={() => setGoal('유지')} />
          <GoalButton label="증량" active={goal === '증량'} onPress={() => setGoal('증량')} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>거리(km)</Text>
            <TextInput
              style={styles.input}
              value={distanceKm}
              onChangeText={setDistanceKm}
              keyboardType="numeric"
              placeholder="예: 10"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>칼로리(kcal)</Text>
            <TextInput
              style={styles.input}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
              placeholder="예: 600"
            />
          </View>
        </View>
      </View>

      <View style={styles.section}>
        {loading ? (
          <ActivityIndicator size="small" color={C.accent} />
        ) : (
          <TouchableOpacity style={styles.scanBtn} onPress={scan} activeOpacity={0.9}>
            <Text style={styles.scanBtnTxt}>냉장고 스캔</Text>
          </TouchableOpacity>
        )}
        {!!errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
      </View>

      {!!result && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3) 결과</Text>
          {!!result?.fridgy_comment && <Text style={styles.commentText}>FRIDGY: {result.fridgy_comment}</Text>}

          <Text style={styles.subSectionTitle}>재료</Text>
          {ingredients.length === 0 ? (
            <Text style={styles.smallText}>재료를 찾지 못했어요.</Text>
          ) : (
            ingredients.slice(0, 12).map((it, idx) => (
              <Text key={`${it.name}-${idx}`} style={styles.rowText}>
                {it.name} · {it.quantity} {it.unit} (conf {Number(it.confidence || 0).toFixed(2)})
              </Text>
            ))
          )}

          <Text style={[styles.subSectionTitle, { marginTop: 14 }]}>레시피(3개)</Text>
          {recipes.map((r, idx) => (
            <View key={idx} style={[styles.card, { borderColor: ax(0.15) }]}>
              <Text style={styles.cardTitle}>{r.title || '레시피'}</Text>
              <Text style={styles.cardMeta}>
                {r.calories ? `${r.calories}kcal` : ''} · P {r.protein_g ?? '-'}g · C {r.carb_g ?? '-'}g · F {r.fat_g ?? '-'}g
              </Text>
              {!!r.description && <Text style={styles.cardDesc}>{r.description}</Text>}
              {!!r.steps?.length && (
                <Text style={styles.stepsText}>
                  {r.steps.slice(0, 5).map((s, i) => `${i + 1}. ${s}`).join('\n')}
                </Text>
              )}
              {!!r.missing_ingredients?.length && (
                <Text style={styles.missingText}>추가 필요: {r.missing_ingredients.join(', ')}</Text>
              )}
            </View>
          ))}

          <Text style={[styles.subSectionTitle, { marginTop: 14 }]}>식단 계획</Text>
          <Text style={styles.smallText}>
            {nutritionPlan?.goal ? `목표: ${nutritionPlan.goal}` : '식단 계획이 생성됐어요.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: C.border },
  headerIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.surfaceL2, borderWidth: 1, borderColor: ax(0.15), justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: C.text, fontSize: 18, fontWeight: '800' },
  headerSub: { color: C.textSub, fontSize: 12, fontWeight: '600', marginTop: 4 },
  section: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  sectionTitle: { color: C.text, fontSize: 14, fontWeight: '800' },
  subSectionTitle: { color: C.accent, fontSize: 13, fontWeight: '800', marginTop: 10 },
  smallText: { color: C.textSub, fontSize: 12, marginTop: 8 },
  pickBtn: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingVertical: 12, alignItems: 'center' },
  pickBtnTxt: { color: C.text, fontSize: 13, fontWeight: '800' },
  inputLabel: { color: C.textSub, fontSize: 11, fontWeight: '700', marginBottom: 6 },
  input: { borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingVertical: 10, paddingHorizontal: 12, color: C.text },
  scanBtn: { backgroundColor: C.accent, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  scanBtnTxt: { color: C.onAccent, fontSize: 15, fontWeight: '900' },
  errorText: { marginTop: 10, color: C.danger, fontWeight: '700' },
  goalBtn: { flex: 1, borderRadius: 12, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface, paddingVertical: 10, alignItems: 'center' },
  goalBtnTxt: { color: C.text, fontWeight: '800', fontSize: 13 },
  card: { marginTop: 10, borderRadius: 14, borderWidth: 1, backgroundColor: C.surface, padding: 12 },
  cardTitle: { color: C.text, fontSize: 14, fontWeight: '900' },
  cardMeta: { color: C.textSub, fontSize: 11, fontWeight: '700', marginTop: 6 },
  cardDesc: { color: C.textSub, fontSize: 12, fontWeight: '600', marginTop: 8 },
  stepsText: { color: C.text, fontSize: 12, fontWeight: '600', marginTop: 8 },
  missingText: { color: C.orange, fontSize: 12, fontWeight: '800', marginTop: 8 },
  commentText: { color: C.accentDeep, fontSize: 12, fontWeight: '800', marginTop: 6 },
  rowText: { color: C.text, fontSize: 12, fontWeight: '700', marginTop: 6 },
});

