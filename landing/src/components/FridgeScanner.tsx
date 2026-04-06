import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';

type Ingredient = {
  name: string;
  category?: string;
  quantity?: number;
  unit?: string;
  confidence?: number;
};

type Recipe = {
  title?: string;
  description?: string;
  calories?: number;
  protein_g?: number;
  carb_g?: number;
  fat_g?: number;
  steps?: string[];
  missing_ingredients?: string[];
};

type NutritionPlan = Record<string, any>;

function getScanUrl() {
  const env = (import.meta as any).env;
  const v = (env?.VITE_API_BASE_URL as string | undefined)?.trim();
  if (v && v.length > 0) {
    return `${v.replace(/\/$/, '')}/agent/fridge/scan`;
  }
  // 개발: Vite 프록시로 /api → 백엔드 /v1
  if (import.meta.env.DEV) {
    return '/api/agent/fridge/scan';
  }
  return 'http://localhost:8000/v1/agent/fridge/scan';
}

export function FridgeScanner() {
  const scanUrl = useMemo(() => getScanUrl(), []);
  const [dietGoal, setDietGoal] = useState<'감량' | '유지' | '증량'>('유지');
  const [distanceKm, setDistanceKm] = useState('0');
  const [calories, setCalories] = useState('600');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [err, setErr] = useState<string>('');

  const scan = async () => {
    setErr('');
    setResult(null);
    if (!file) {
      setErr('이미지를 선택해 주세요.');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('diet_goal', dietGoal);

      const dist = Number(distanceKm);
      const cal = Number(calories);
      if (Number.isFinite(dist) && dist > 0) form.append('distance_km', String(dist));
      if (Number.isFinite(cal) && cal > 0) form.append('calories', String(cal));

      const res = await fetch(scanUrl, {
        method: 'POST',
        body: form,
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        throw new Error(data?.detail || '스캔 실패');
      }
      setResult(data);
    } catch (e: any) {
      setErr(e?.message || '스캔 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="liquid-glass-strong rounded-2xl p-6 max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-teal-200 font-heading italic text-2xl">냉장고 레시피 스캐너</div>
          <div className="text-landing-muted mt-2 text-sm">
            이미지 업로드 → 재료 인식 → 회복 레시피 3개 + 식단 계획 생성
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-slate-50">1) 이미지 선택</div>
          <input
            className="mt-3 w-full text-sm"
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <div className="mt-2 text-xs text-slate-300">{file ? `선택됨: ${file.name}` : '선택 전'}</div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-slate-50">2) 목표/회복 입력</div>

          <div className="mt-3 flex gap-2">
            {(['감량', '유지', '증량'] as const).map((g) => (
              <button
                key={g}
                onClick={() => setDietGoal(g)}
                className={`px-3 py-2 rounded-lg text-xs font-bold border ${
                  dietGoal === g ? 'bg-teal-400 text-slate-900 border-teal-400' : 'bg-white/10 text-slate-50 border-white/10'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 grid-cols-2">
            <div>
              <div className="text-xs text-slate-300">거리(km)</div>
              <input
                className="mt-1 w-full rounded-lg bg-transparent border border-white/10 px-3 py-2 text-sm text-slate-50"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs text-slate-300">칼로리(kcal)</div>
              <input
                className="mt-1 w-full rounded-lg bg-transparent border border-white/10 px-3 py-2 text-sm text-slate-50"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {err ? <div className="mt-4 text-sm font-bold text-red-300">{err}</div> : null}

      <div className="mt-5 flex justify-center">
        <button
          onClick={scan}
          disabled={loading}
          className="liquid-glass-strong px-6 py-3 rounded-2xl text-sm font-extrabold text-slate-900 bg-teal-300 disabled:opacity-60"
        >
          {loading ? '처리 중...' : '냉장고 스캔'}
        </button>
      </div>

      {!!result && (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-50">FRIDGY 코멘트</div>
            <div className="mt-2 text-sm text-slate-100">{result.fridgy_comment || '-'}</div>

            <div className="mt-4 text-sm font-semibold text-slate-50">재료</div>
            <div className="mt-2 text-sm text-slate-100">
              {(result.ingredients as Ingredient[])?.length ? (
                (result.ingredients as Ingredient[]).slice(0, 12).map((it, idx) => (
                  <div key={idx} className="mt-1">
                    {it.name} · {it.quantity ?? 1} {it.unit ?? '개'}
                  </div>
                ))
              ) : (
                <div>재료 없음</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="text-sm font-semibold text-slate-50">레시피</div>
            <div className="mt-2 grid gap-3">
              {(result.recipes as Recipe[])?.map((r, idx) => (
                <div key={idx} className="rounded-lg bg-white/5 border border-white/10 p-3">
                  <div className="font-bold text-slate-50">{r.title || '레시피'}</div>
                  <div className="text-xs text-slate-300 mt-1">
                    {typeof r.calories === 'number' ? `${r.calories}kcal` : ''}
                    {r.protein_g ? ` · P ${r.protein_g}g` : ''}
                  </div>
                  {r.description ? <div className="text-sm text-slate-100 mt-2">{r.description}</div> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

