import AsyncStorage from '@react-native-async-storage/async-storage';

const K = {
  RUNS: '@runfun/runs_v1',
  FEED: '@runfun/feed_posts_v1',
  WEEKLY_GOAL: '@runfun/weekly_goal_km',
};

export async function loadRuns() {
  try {
    const s = await AsyncStorage.getItem(K.RUNS);
    if (!s) return [];
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function saveRuns(runs) {
  await AsyncStorage.setItem(K.RUNS, JSON.stringify(runs));
}

export async function loadFeedPosts() {
  try {
    const s = await AsyncStorage.getItem(K.FEED);
    if (!s) return [];
    const arr = JSON.parse(s);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export async function saveFeedPosts(posts) {
  await AsyncStorage.setItem(K.FEED, JSON.stringify(posts));
}

export async function loadWeeklyGoalKm() {
  try {
    const s = await AsyncStorage.getItem(K.WEEKLY_GOAL);
    if (s == null) return 30;
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? n : 30;
  } catch {
    return 30;
  }
}

export async function saveWeeklyGoalKm(km) {
  await AsyncStorage.setItem(K.WEEKLY_GOAL, String(km));
}
