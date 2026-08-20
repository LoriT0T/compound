/* --------------------------------------------------------------
   Local persistence. Everything lives in localStorage — no server,
   no account, works on a plane.
   -------------------------------------------------------------- */
const K = {
  split:    'pp:v1:split',
  sessions: 'pp:v1:sessions',
  fuel:     'pp:v1:fuel',
  photos:   'pp:v1:photos',
  prefs:    'pp:v1:prefs',
  history:  'pp:v1:blocks'
};

const read  = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : structuredClone(fallback); }
  catch { return structuredClone(fallback); }
};
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.warn('storage full', e); } };

export const todayKey = (d = new Date()) => {
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().slice(0, 10);
};

export const daysBetween = (a, b) =>
  Math.floor((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 86400000);

/* ---- current split block ---- */
export const getSplit = () => {
  let s = read(K.split, null);
  if (!s) { s = { cycle: 0, startedAt: todayKey() }; write(K.split, s); }
  return s;
};
export const setSplit = s => write(K.split, s);

export const getBlocks = () => read(K.history, []);
export const rotateSplit = () => {
  const cur = getSplit();
  const blocks = getBlocks();
  blocks.push({ ...cur, endedAt: todayKey() });
  write(K.history, blocks);
  const next = { cycle: cur.cycle + 1, startedAt: todayKey() };
  write(K.split, next);
  return next;
};
export const resetSplitTo = cycle => { const s = { cycle, startedAt: todayKey() }; write(K.split, s); return s; };

/* ---- sessions ---- */
export const getSessions = () => read(K.sessions, {});
export const getSession  = key => getSessions()[key] || null;
export const saveSession = (key, session) => {
  const all = getSessions();
  all[key] = session;
  write(K.sessions, all);
  return session;
};
export const deleteSession = key => { const all = getSessions(); delete all[key]; write(K.sessions, all); };

/* A session key is date + dayId, so two workouts on one day never collide. */
export const sessionKey = (dayId, date = todayKey()) => `${date}|${dayId}`;

export const ensureSession = (dayId, plan, date = todayKey()) => {
  const key = sessionKey(dayId, date);
  let s = getSession(key);
  if (!s) {
    s = {
      dayId, date, cycle: getSplit().cycle, startedAt: null, finishedAt: null,
      sets: Object.fromEntries(plan.exercises.map(e => [e.ex, e.sets.map(() => ({ w: null, reps: null, rir: null, done: false }))]))
    };
    /* keep the shape in sync if the plan changed under an in-progress session */
    saveSession(key, s);
  } else {
    let dirty = false;
    for (const e of plan.exercises) {
      if (!s.sets[e.ex]) { s.sets[e.ex] = e.sets.map(() => ({ w: null, reps: null, rir: null, done: false })); dirty = true; }
    }
    if (dirty) saveSession(key, s);
  }
  return s;
};

/* Most recent completed entry for an exercise, excluding a given session key. */
export const lastPerformance = (exId, excludeKey = null) => {
  const all = getSessions();
  const keys = Object.keys(all).sort().reverse();
  for (const k of keys) {
    if (k === excludeKey) continue;
    const rows = all[k].sets?.[exId];
    if (!rows) continue;
    const done = rows.filter(r => r.done && r.w != null && r.reps != null);
    if (done.length) return { date: all[k].date, sets: done };
  }
  return null;
};

/* Full chronological history for one exercise. */
export const exerciseHistory = exId => {
  const all = getSessions();
  return Object.keys(all).sort().map(k => {
    const rows = (all[k].sets?.[exId] || []).filter(r => r.done && r.w != null && r.reps != null);
    if (!rows.length) return null;
    const top = rows.reduce((a, b) => (b.w * (1 + b.reps / 30) > a.w * (1 + a.reps / 30) ? b : a));
    const volume = rows.reduce((n, r) => n + r.w * r.reps, 0);
    return { date: all[k].date, sets: rows, top, volume, e1rm: Math.round(top.w * (1 + top.reps / 30)) };
  }).filter(Boolean);
};

/* ---- fuel / recovery ---- */
export const getFuel = (date = todayKey()) => {
  const all = read(K.fuel, {});
  return all[date] || { creatine: false, preworkout: false, gatorade: false, protein: 0 };
};
export const setFuel = (patch, date = todayKey()) => {
  const all = read(K.fuel, {});
  all[date] = { ...getFuel(date), ...patch };
  write(K.fuel, all);
  return all[date];
};
export const fuelRange = days => {
  const all = read(K.fuel, {});
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = todayKey(d);
    out.push({ date: k, ...(all[k] || { creatine: false, preworkout: false, gatorade: false, protein: 0 }) });
  }
  return out;
};

/* ---- user-supplied exercise photos ---- */
export const getPhotos = () => read(K.photos, {});
export const setPhoto  = (exId, dataUrl) => { const p = getPhotos(); p[exId] = dataUrl; write(K.photos, p); };
export const clearPhoto = exId => { const p = getPhotos(); delete p[exId]; write(K.photos, p); };

/* ---- preferences ---- */
export const getPrefs = () => ({ unit: 'kg', sound: true, vibrate: true, ...read(K.prefs, {}) });
export const setPrefs = patch => { const p = { ...getPrefs(), ...patch }; write(K.prefs, p); return p; };

/* ---- backup ---- */
export const exportAll = () => JSON.stringify(
  Object.fromEntries(Object.entries(K).map(([name, key]) => [name, read(key, null)])), null, 2);

export const importAll = json => {
  const data = JSON.parse(json);
  for (const [name, key] of Object.entries(K)) if (data[name] != null) write(key, data[name]);
};
