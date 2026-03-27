/** 이번 주 월요일 00:00 (로컬) ms */
export function weekStartMondayMs(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

export function formatPace(elapsedSec, km) {
  if (!km || km < 0.01 || !elapsedSec) return "--'--\"";
  const sPerKm = elapsedSec / km;
  const m = Math.floor(sPerKm / 60);
  const s = Math.round(sPerKm % 60);
  return `${m}'${String(s).padStart(2, '0')}"`;
}

/** 연속 러닝일 (오늘 미기록이면 어제부터 역으로) */
export function computeRunStreak(runs) {
  if (!runs?.length) return 0;
  const daySet = new Set(
    runs.map((r) => {
      const d = new Date(r.endedAt);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    })
  );
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let check = today.getTime();
  if (!daySet.has(check)) check -= 86400000;
  let streak = 0;
  while (daySet.has(check)) {
    streak += 1;
    check -= 86400000;
  }
  return streak;
}

export function aggregateWeek(runs, weekStartMs) {
  const list = runs.filter((r) => r.endedAt >= weekStartMs);
  const totalKm = list.reduce((s, r) => s + (r.distanceKm || 0), 0);
  const totalSec = list.reduce((s, r) => s + (r.durationSec || 0), 0);
  const paceStr = totalKm > 0.01 ? formatPace(totalSec, totalKm) : "--'--\"";
  return {
    count: list.length,
    totalKm: Math.round(totalKm * 10) / 10,
    paceStr,
  };
}

export function aggregateYear(runs, year = new Date().getFullYear()) {
  const list = runs.filter((r) => new Date(r.endedAt).getFullYear() === year);
  const totalKm = list.reduce((s, r) => s + (r.distanceKm || 0), 0);
  const totalSec = list.reduce((s, r) => s + (r.durationSec || 0), 0);
  const paceStr = totalKm > 0.01 ? formatPace(totalSec, totalKm) : "--'--\"";
  return {
    count: list.length,
    totalKm: Math.round(totalKm * 10) / 10,
    paceStr,
  };
}

export function formatDurationSec(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export function formatAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d === 1) return '어제';
  if (d < 7) return `${d}일 전`;
  return new Date(ts).toLocaleDateString('ko-KR');
}
