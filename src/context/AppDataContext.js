import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  loadRuns,
  saveRuns,
  loadFeedPosts,
  loadWeeklyGoalKm,
} from '../storage/appStorage';
import { aggregateWeek, aggregateYear, computeRunStreak, weekStartMondayMs } from '../utils/stats';
import { api } from '../api/client';

const AppDataContext = createContext(null);

export function AppDataProvider({ children }) {
  const [runs, setRuns] = useState([]);
  const [ready, setReady] = useState(false);
  const [weeklyGoalKm, setWeeklyGoalKmState] = useState(30);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [r, goal] = await Promise.all([loadRuns(), loadWeeklyGoalKm()]);
      if (!alive) return;
      setRuns(r.sort((a, b) => b.endedAt - a.endedAt));
      setWeeklyGoalKmState(goal);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const addRun = useCallback(async (record) => {
    const id = record.id || `run-${Date.now()}`;
    const row = { ...record, id };
    const prev = await loadRuns();
    const next = [row, ...prev].sort((a, b) => b.endedAt - a.endedAt);
    // 로컬 우선 저장
    await saveRuns(next);
    setRuns(next);
    // 백그라운드 백엔드 동기화 (실패해도 UX 차단 안 함)
    if (record._sessionId) {
      api.post(`/running/end/${record._sessionId}`, {
        ended_at: new Date(record.endedAt).toISOString(),
        distance_km: record.distanceKm,
        duration_sec: record.durationSec,
        avg_pace: record.paceNum || null,
        calories: record.kcal || null,
        route: (record.routeSample || []).map((p) => ({ lat: p.latitude, lng: p.longitude })),
      }).catch(() => {});
    }
  }, []);

  const weekStats = useMemo(() => aggregateWeek(runs, weekStartMondayMs()), [runs]);
  const streak = useMemo(() => computeRunStreak(runs), [runs]);
  const yearStats = useMemo(() => aggregateYear(runs), [runs]);
  const totalKmAll = useMemo(() => runs.reduce((s, r) => s + (r.distanceKm || 0), 0), [runs]);

  const value = useMemo(
    () => ({
      ready,
      runs,
      addRun,
      weeklyGoalKm,
      weekStats,
      streak,
      yearStats,
      totalKmAll,
      totalRuns: runs.length,
    }),
    [ready, runs, addRun, weeklyGoalKm, weekStats, streak, yearStats, totalKmAll]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData는 AppDataProvider 안에서만 사용하세요.');
  return ctx;
}

/** 피드 전용: 초기 로드 + 저장은 FeedScreen에서 처리 */
export async function hydrateFeedPosts(seedPosts) {
  const loaded = await loadFeedPosts();
  return loaded.length ? loaded : seedPosts;
}
