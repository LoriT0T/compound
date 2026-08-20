import { LIB, buildSplit, SCHEDULE, FUEL, PRINCIPLES, BLOCK_WEEKS, CYCLE_LENGTH } from './data.js';
import * as S from './store.js';

const $ = sel => document.querySelector(sel);
const app = $('#app');
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

let split, plan, restTimer = null, sessionTick = null;

function loadSplit() {
  split = S.getSplit();
  plan = buildSplit(split.cycle);
}
const dayById = id => plan.find(d => d.id === id);

/* ---------------- helpers ---------------- */
const photoFor = exId => {
  const custom = S.getPhotos()[exId];
  if (custom) return custom;
  const f = LIB[exId]?.img;
  return f ? 'img/' + f : null;
};
const fmtDate = k => new Date(k + 'T00:00:00').toLocaleDateString(undefined, { day:'numeric', month:'short' });
const mmss = s => `${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const restLabel = r => r === 0 ? 'superset' : r >= 60 ? `${r/60 % 1 === 0 ? r/60 : (r/60).toFixed(1)} min rest` : `${r}s rest`;
const prescription = e => {
  const reps = [...new Set(e.sets.map(s => s.target))].join(' / ');
  const rir = [...new Set(e.sets.map(s => s.rir))].join('–');
  return `${e.sets.length} × ${reps} @ ${rir} RIR`;
};
const unit = () => S.getPrefs().unit;

function toast(msg) {
  let el = $('#toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('show'), 1900);
}

/* block timer maths */
function blockStats() {
  const days = Math.max(0, S.daysBetween(split.startedAt, S.todayKey()));
  const weeks = Math.floor(days / 7);
  const pct = Math.min(100, (days / (BLOCK_WEEKS * 7)) * 100);
  return { days, weeks, pct, due: days >= BLOCK_WEEKS * 7, remaining: BLOCK_WEEKS * 7 - days };
}
function blockPhrase() {
  const { days, weeks, due, remaining } = blockStats();
  if (days === 0) return 'Live since today. Week 1 of 8.';
  if (due) return `${days} days in — the 8-week block is done. Time to rotate.`;
  if (days < 7) return `${days} day${days>1?'s':''} in. Week 1 of ${BLOCK_WEEKS}.`;
  const wk = weeks + 1;
  return `${days} days in. Week ${wk} of ${BLOCK_WEEKS} · ${remaining} days to rotation.`;
}

/* ---------------- rest timer ---------------- */
const Rest = {
  endsAt: 0, total: 0, next: '', raf: null,
  start(seconds, nextLabel) {
    if (!seconds) return;
    this.endsAt = Date.now() + seconds * 1000;
    this.total = seconds; this.next = nextLabel || '';
    $('#restbar').classList.add('show');
    this.loop();
  },
  add(s) { if (this.endsAt) { this.endsAt += s * 1000; this.total += s; } },
  stop() { this.endsAt = 0; cancelAnimationFrame(this.raf); $('#restbar').classList.remove('show'); },
  loop() {
    cancelAnimationFrame(this.raf);
    const tick = () => {
      const left = (this.endsAt - Date.now()) / 1000;
      if (left <= 0) { this.fire(); return; }
      $('#restCd').textContent = mmss(left);
      $('#restNext').textContent = this.next || 'Next set';
      $('#restProg').style.width = (100 - (left / this.total) * 100) + '%';
      this.raf = requestAnimationFrame(tick);
    };
    tick();
  },
  fire() {
    $('#restCd').textContent = '0:00';
    const p = S.getPrefs();
    if (p.vibrate && navigator.vibrate) navigator.vibrate([120, 70, 120, 70, 220]);
    if (p.sound) beep();
    toast('Rest done — go');
    setTimeout(() => this.stop(), 1400);
  }
};
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, .18, .36].forEach((t, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = i === 2 ? 1320 : 880;
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.35, ctx.currentTime + t + .02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t + .15);
      o.connect(g); g.connect(ctx.destination);
      o.start(ctx.currentTime + t); o.stop(ctx.currentTime + t + .18);
    });
  } catch {}
}

/* keep the screen awake during a session */
let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if (wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch {}
}

/* ---------------- views ---------------- */
function viewHome() {
  const todayIdx = new Date().getDay();
  const slot = SCHEDULE[todayIdx];
  const day = slot.workout ? dayById(slot.workout) : null;
  const b = blockStats();
  const sessions = S.getSessions();

  const strip = SCHEDULE.map((sl, i) => {
    const d = sl.workout ? dayById(sl.workout) : null;
    /* find that weekday's date in the current week (week starts Monday) */
    const now = new Date();
    const diff = i - now.getDay();
    const dt = new Date(now); dt.setDate(now.getDate() + diff);
    const done = d && sessions[S.sessionKey(d.id, S.todayKey(dt))]?.finishedAt;
    return `<div class="wd ${d ? d.kind : 'off'} ${i === todayIdx ? 'today' : ''}">
      <div class="d">${sl.label}</div>
      <div class="t">${d ? d.name.replace(' ', '') : 'Rest'}</div>
      ${d ? `<i class="dot ${done ? '' : 'pending'}"></i>` : ''}
    </div>`;
  }).join('');

  const key = day ? S.sessionKey(day.id) : null;
  const sess = key ? sessions[key] : null;
  const doneCount = sess ? Object.values(sess.sets).flat().filter(s => s.done).length : 0;
  const totalSets = day ? day.exercises.reduce((n, e) => n + e.sets.length, 0) : 0;

  const weekdayName = new Date().toLocaleDateString(undefined, { weekday:'long' });
  const hero = day ? `
    <div class="hero ${day.kind}">
      <div class="hero-in">
        <div class="kicker">Today · ${weekdayName}</div>
        <h2>${day.name}</h2>
        <p class="focus">${esc(day.focus)}</p>
        <div class="meta-row">
          <div class="meta"><b>${day.exercises.length}</b><span>exercises</span></div>
          <div class="meta"><b>${totalSets}</b><span>sets</span></div>
          <div class="meta"><b>~${day.mins}</b><span>minutes</span></div>
          ${doneCount ? `<div class="meta"><b style="color:var(--ok)">${doneCount}/${totalSets}</b><span>logged</span></div>` : ''}
        </div>
        <div style="margin-top:16px">
          <a class="btn" href="#/day/${day.id}">${sess?.finishedAt ? 'Review session' : doneCount ? 'Continue session' : 'Start session'}</a>
        </div>
      </div>
    </div>` : `
    <div class="hero rest">
      <div class="hero-in">
        <div class="kicker">Today · ${weekdayName}</div>
        <h2>Rest</h2>
        <p class="focus">Growth happens now, not in the gym. Creatine, protein, sleep.</p>
        <div style="margin-top:16px">
          <a class="btn ghost" href="#/split">See the split</a>
        </div>
      </div>
    </div>`;

  const nextUp = (() => {
    for (let i = 1; i <= 7; i++) {
      const s = SCHEDULE[(todayIdx + i) % 7];
      if (s.workout) return { label: s.label, day: dayById(s.workout), inDays: i };
    }
  })();

  const fuel = S.getFuel();
  const fuelDone = ['creatine','preworkout','gatorade'].filter(k => fuel[k]).length + (fuel.protein >= 130 ? 1 : 0);

  app.innerHTML = `<div class="view">
    <div class="top">
      <div>
        <h1>${greeting()}</h1>
        <div class="sub">${new Date().toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'})}</div>
      </div>
    </div>
    ${hero}

    <div class="sect">
      <div class="sect-h"><h2>This week</h2><a class="link" href="#/split">Full split →</a></div>
      <div class="week">${strip}</div>
      ${!day ? `<p style="font-size:12.5px;color:var(--tx-3);margin-top:10px;text-align:center">
        Next: <b style="color:var(--tx-2)">${nextUp.day.name}</b> in ${nextUp.inDays} day${nextUp.inDays>1?'s':''}</p>` : ''}
    </div>

    <div class="sect">
      <div class="sect-h"><h2>Fuel today</h2><a class="link" href="#/fuel">Track →</a></div>
      <div class="card pad" style="display:flex;align-items:center;gap:14px">
        <div style="flex:1">
          <b style="font-size:15px">${fuelDone}/4 daily targets</b>
          <div class="bar"><i class="${fuel.protein>=130?'full':''}" style="width:${Math.min(100,(fuel.protein/130)*100)}%"></i></div>
          <div style="font-size:12px;color:var(--tx-3);margin-top:6px">${fuel.protein} g of 130 g protein</div>
        </div>
        <a class="btn sm ghost" style="width:auto;padding:11px 15px" href="#/fuel">Log</a>
      </div>
    </div>

    <div class="sect">
      <div class="sect-h"><h2>Current block</h2></div>
      ${blockCard(b)}
    </div>
  </div>`;
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5)  return 'Still up';
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

function blockCard(b) {
  const R = 32, C = 2 * Math.PI * R;
  return `<div class="card timer-card">
    <div class="ring">
      <svg width="74" height="74" viewBox="0 0 74 74">
        <circle cx="37" cy="37" r="${R}" fill="none" stroke="var(--line)" stroke-width="6"/>
        <circle cx="37" cy="37" r="${R}" fill="none" stroke="${b.due ? 'var(--warn)' : 'var(--acc)'}"
          stroke-width="6" stroke-linecap="round"
          stroke-dasharray="${C}" stroke-dashoffset="${C - (b.pct/100)*C}"/>
      </svg>
      <div class="txt"><b>${b.days}</b><span>days</span></div>
    </div>
    <div class="timer-info">
      <b>Block ${split.cycle + 1}${split.cycle === 0 ? ' · original' : ''}</b>
      <p>${blockPhrase()}</p>
    </div>
  </div>`;
}

/* ---------------- day / session view ---------------- */
function viewDay(dayId) {
  const day = dayById(dayId);
  if (!day) return location.hash = '#/';
  const key = S.sessionKey(day.id);
  const sess = S.ensureSession(day.id, day);
  const totalSets = day.exercises.reduce((n, e) => n + e.sets.length, 0);
  const doneSets = Object.values(sess.sets).flat().filter(s => s.done).length;

  const rows = day.exercises.map((e, i) => {
    const ex = LIB[e.ex];
    const img = photoFor(e.ex);
    const rowSets = sess.sets[e.ex] || [];
    const allDone = rowSets.length && rowSets.every(s => s.done);
    const last = S.lastPerformance(e.ex, key);
    return `<div class="ex" data-ex="${e.ex}" data-i="${i}">
      <button class="ex-head" data-toggle="${i}">
        <span class="ex-num ${allDone ? 'done' : ''}">${allDone ? '✓' : i + 1}</span>
        <span class="ex-thumb ${img ? '' : 'none'}">${img ? `<img src="${img}" alt="" loading="lazy">` : '＋'}</span>
        <span class="ex-body">
          <b>${esc(ex.name)}</b>
          <span class="pres">${prescription(e)} · ${restLabel(e.rest)}</span>
        </span>
        <span class="ex-dots">${rowSets.map(s => `<i class="${s.done ? 'on' : ''}"></i>`).join('')}</span>
        <span class="chev">›</span>
      </button>
      <div class="ex-panel">
        ${img
          ? `<div class="shot" data-zoom="${img}"><img src="${img}" alt="${esc(ex.name)}" loading="lazy"></div>`
          : `<div class="shot none"><p>No illustration yet for this one.<br><b style="color:var(--acc)">Tap to add a photo</b> from your camera roll.</p>
             <button class="btn sm ghost" style="margin-top:12px" data-addphoto="${e.ex}">Add photo</button></div>`}
        <div class="tags">${ex.tags.map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="cue">${esc(ex.cue)}</div>
        ${last ? `<div class="lastline">Last time (${fmtDate(last.date)}): <b>${last.sets.map(s => `${s.w}×${s.reps}`).join(', ')}</b></div>` : ''}
        <div class="setgrid">
          <div class="lbl"></div><div class="lbl">${unit()}</div><div class="lbl">reps</div><div class="lbl">RIR</div><div class="lbl"></div>
          ${e.sets.map((t, si) => {
            const v = rowSets[si] || {};
            const ph = last?.sets?.[si];
            return `<div class="rowgap"></div>
              <div class="setrow ${v.done ? 'done' : ''}" data-set="${si}">
                <div class="sn">${si + 1}<small>${t.target}</small></div>
                <input type="number" inputmode="decimal" step="0.5" data-f="w"    value="${v.w ?? ''}"    placeholder="${ph?.w ?? '–'}">
                <input type="number" inputmode="numeric" data-f="reps" value="${v.reps ?? ''}" placeholder="${t.target}">
                <input type="number" inputmode="numeric" data-f="rir"  value="${v.rir ?? ''}"  placeholder="${t.rir}">
                <button class="tick ${v.done ? 'on' : ''}" data-done="${si}">✓</button>
              </div>`;
          }).join('')}
        </div>
        ${e.supersetInto
          ? `<div class="ss-note">⚡ No rest — straight into ${esc(LIB[e.supersetInto].name)}</div>`
          : `<div class="rest-note">${e.rest}s rest between sets${e.perSide ? ' · reps are per side' : ''}</div>`}
      </div>
    </div>`;
  }).join('');

  app.innerHTML = `<div class="view">
    <div class="top">
      <div>
        <h1>${day.name}</h1>
        <div class="sub">${esc(day.focus)}</div>
      </div>
      <a href="#/" style="color:var(--tx-3);font-size:13px;font-weight:650;padding:6px">Close</a>
    </div>

    <div class="card pad" style="display:flex;align-items:center;gap:14px">
      <div style="flex:1">
        <b style="font-size:15px">${doneSets} of ${totalSets} sets logged</b>
        <div class="bar"><i class="${doneSets===totalSets?'full':''}" style="width:${(doneSets/totalSets)*100}%"></i></div>
      </div>
      <div id="sessClock" style="font-variant-numeric:tabular-nums;font-size:15px;font-weight:700;color:var(--tx-2)">
        ${sess.startedAt && !sess.finishedAt ? mmss((Date.now() - sess.startedAt) / 1000) : '–:––'}
      </div>
    </div>

    <div class="card" style="margin-top:12px">${rows}</div>

    <div style="margin-top:16px;display:flex;gap:10px">
      ${sess.finishedAt
        ? `<button class="btn line" id="reopen">Reopen session</button>`
        : `<button class="btn ${doneSets ? 'ok' : 'ghost'}" id="finish">${doneSets ? 'Finish session' : 'Mark as done'}</button>`}
    </div>
    <div style="height:20px"></div>
  </div>`;

  if (!sess.startedAt && !sess.finishedAt) { sess.startedAt = Date.now(); S.saveSession(key, sess); keepAwake(true); }
  startSessionClock(key);
  wireDay(day, key);
}

function startSessionClock(key) {
  clearInterval(sessionTick);
  sessionTick = setInterval(() => {
    const el = $('#sessClock'); if (!el) return clearInterval(sessionTick);
    const s = S.getSession(key);
    if (!s?.startedAt || s.finishedAt) return;
    el.textContent = mmss((Date.now() - s.startedAt) / 1000);
  }, 1000);
}

function wireDay(day, key) {
  /* expand / collapse */
  app.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const ex = btn.closest('.ex');
    const wasOpen = ex.classList.contains('open');
    app.querySelectorAll('.ex.open').forEach(o => o.classList.remove('open'));
    if (!wasOpen) { ex.classList.add('open'); ex.scrollIntoView({ behavior:'smooth', block:'start' }); }
  }));

  /* first unfinished exercise opens by default */
  const sess = S.getSession(key);
  const firstOpen = day.exercises.findIndex(e => !(sess.sets[e.ex] || []).every(s => s.done));
  if (firstOpen >= 0) app.querySelector(`.ex[data-i="${firstOpen}"]`)?.classList.add('open');

  /* inputs */
  app.querySelectorAll('.setrow input').forEach(inp => {
    inp.addEventListener('change', () => {
      const exId = inp.closest('.ex').dataset.ex;
      const si = +inp.closest('.setrow').dataset.set;
      const s = S.getSession(key);
      const val = inp.value === '' ? null : Number(inp.value);
      s.sets[exId][si][inp.dataset.f] = val;
      S.saveSession(key, s);
    });
    /* typing a weight prefills the sets below it that are still empty */
    inp.addEventListener('blur', () => {
      if (inp.dataset.f !== 'w' || inp.value === '') return;
      const exEl = inp.closest('.ex');
      const si = +inp.closest('.setrow').dataset.set;
      const s = S.getSession(key);
      exEl.querySelectorAll('.setrow').forEach(row => {
        const j = +row.dataset.set;
        if (j <= si) return;
        const w = row.querySelector('[data-f="w"]');
        if (w.value === '' && !s.sets[exEl.dataset.ex][j].done) w.value = inp.value;
      });
    });
  });

  /* tick a set */
  app.querySelectorAll('[data-done]').forEach(btn => btn.addEventListener('click', () => {
    const exEl = btn.closest('.ex');
    const exId = exEl.dataset.ex;
    const i = +exEl.dataset.i;
    const si = +btn.dataset.done;
    const plannedEx = day.exercises[i];
    const row = btn.closest('.setrow');
    const s = S.getSession(key);
    const cell = s.sets[exId][si];
    cell.done = !cell.done;

    if (cell.done) {
      /* capture whatever is typed; fall back to the prescription */
      const get = f => { const el = row.querySelector(`[data-f="${f}"]`); return el.value === '' ? null : Number(el.value); };
      cell.w = get('w'); cell.reps = get('reps'); cell.rir = get('rir');
      if (cell.reps == null) {
        const t = plannedEx.sets[si].target;
        cell.reps = Number(String(t).split('-').pop());
        row.querySelector('[data-f="reps"]').value = cell.reps;
      }
      if (cell.rir == null) { cell.rir = plannedEx.sets[si].rir; row.querySelector('[data-f="rir"]').value = cell.rir; }
      cell.ts = Date.now();
    }
    S.saveSession(key, s);

    btn.classList.toggle('on', cell.done);
    row.classList.toggle('done', cell.done);
    refreshDots(exEl, s.sets[exId]);
    updateProgress(day, key);

    if (cell.done) {
      if (navigator.vibrate) navigator.vibrate(18);
      const isLastSet = si === plannedEx.sets.length - 1;
      if (plannedEx.supersetInto) {
        const nextName = LIB[plannedEx.supersetInto].name;
        toast(`Straight into ${nextName}`);
        const nextEl = app.querySelector(`.ex[data-i="${i + 1}"]`);
        if (nextEl) {
          app.querySelectorAll('.ex.open').forEach(o => o.classList.remove('open'));
          nextEl.classList.add('open');
          nextEl.scrollIntoView({ behavior:'smooth', block:'start' });
        }
      } else if (plannedEx.rest > 0) {
        const nextLabel = isLastSet
          ? (day.exercises[i + 1] ? 'Next: ' + LIB[day.exercises[i + 1].ex].name : 'Last set — you are done')
          : `${LIB[exId].name} · set ${si + 2}`;
        Rest.start(plannedEx.rest, nextLabel);
      }
    }
  }));

  /* image zoom */
  app.querySelectorAll('[data-zoom]').forEach(el => el.addEventListener('click', () => lightbox(el.dataset.zoom)));
  app.querySelectorAll('[data-addphoto]').forEach(el => el.addEventListener('click', e => { e.stopPropagation(); pickPhoto(el.dataset.addphoto); }));

  $('#finish')?.addEventListener('click', () => {
    const s = S.getSession(key);
    s.finishedAt = Date.now();
    S.saveSession(key, s);
    keepAwake(false); Rest.stop();
    const n = Object.values(s.sets).flat().filter(x => x.done).length;
    const vol = Object.values(s.sets).flat().filter(x => x.done && x.w && x.reps).reduce((a, x) => a + x.w * x.reps, 0);
    toast(`${day.name} done · ${n} sets · ${Math.round(vol).toLocaleString()} ${unit()} moved`);
    setTimeout(() => location.hash = '#/', 700);
  });
  $('#reopen')?.addEventListener('click', () => {
    const s = S.getSession(key); s.finishedAt = null; S.saveSession(key, s); render();
  });
}

function refreshDots(exEl, rows) {
  const dots = exEl.querySelector('.ex-dots');
  dots.innerHTML = rows.map(s => `<i class="${s.done ? 'on' : ''}"></i>`).join('');
  const num = exEl.querySelector('.ex-num');
  const all = rows.every(s => s.done);
  num.classList.toggle('done', all);
  num.textContent = all ? '✓' : (+exEl.dataset.i + 1);
}
function updateProgress(day, key) {
  const s = S.getSession(key);
  const total = day.exercises.reduce((n, e) => n + e.sets.length, 0);
  const done = Object.values(s.sets).flat().filter(x => x.done).length;
  const bar = app.querySelector('.bar i'); if (!bar) return;
  bar.style.width = (done / total) * 100 + '%';
  bar.classList.toggle('full', done === total);
  app.querySelector('.card.pad b').textContent = `${done} of ${total} sets logged`;
  const fin = $('#finish');
  if (fin) { fin.className = `btn ${done ? 'ok' : 'ghost'}`; fin.textContent = done ? 'Finish session' : 'Mark as done'; }
}

/* ---------------- split view ---------------- */
function viewSplit() {
  const b = blockStats();
  const days = plan.map(day => `
    <div class="card day-card">
      <button class="day-head" data-day="${day.id}">
        <span class="day-tag ${day.kind}">${day.kind.toUpperCase()}</span>
        <b>${day.name}</b>
        <span class="mins">~${day.mins} min</span>
        <span class="chev">›</span>
      </button>
      <div class="ex-panel" style="padding:0 0 10px">
        <div style="padding:0 14px 8px;font-size:12.5px;color:var(--tx-3)">${esc(day.focus)}</div>
        ${day.exercises.map(e => {
          const img = photoFor(e.ex);
          return `<div class="plan-row">
            <span class="t ${img ? '' : 'none'}">${img ? `<img src="${img}" alt="" loading="lazy">` : '＋'}</span>
            <span class="n">${esc(LIB[e.ex].name)}<small>${LIB[e.ex].tags.slice(0,2).join(' · ')}</small></span>
            <span class="r">${prescription(e)}<br>${restLabel(e.rest)}</span>
          </div>`;
        }).join('')}
        <div style="padding:10px 14px 0"><a class="btn sm ghost" href="#/day/${day.id}">Open ${day.name}</a></div>
      </div>
    </div>`).join('');

  app.innerHTML = `<div class="view">
    <div class="top"><div><h1>The split</h1><div class="sub">4 days · push / pull · every muscle twice a week</div></div></div>

    <div class="card"><ul class="princ">${PRINCIPLES.map(p => `<li>${esc(p)}</li>`).join('')}</ul></div>

    <div class="sect">
      <div class="sect-h"><h2>Schedule</h2></div>
      <div class="week">${SCHEDULE.map(sl => {
        const d = sl.workout ? dayById(sl.workout) : null;
        return `<div class="wd ${d ? d.kind : 'off'}"><div class="d">${sl.label}</div><div class="t">${d ? d.name.replace(' ','') : 'Rest'}</div></div>`;
      }).join('')}</div>
    </div>

    <div class="sect">
      <div class="sect-h"><h2>Sessions</h2></div>
      ${days}
    </div>

    <div class="sect">
      <div class="sect-h"><h2>Block timer</h2></div>
      ${blockCard(b)}
      <div style="margin-top:12px">
        <button class="btn ${b.due ? '' : 'ghost'}" id="gen">🔄 Generate new split</button>
        <p style="font-size:12px;color:var(--tx-3);text-align:center;margin-top:10px;line-height:1.5">
          ${b.due
            ? 'You have run this block for 8 weeks. Rotating now gives every muscle a new angle.'
            : `Rotate every ${BLOCK_WEEKS} weeks. ${b.remaining} days left on this one — you can rotate early if you want.`}
        </p>
      </div>
    </div>
    <div style="height:20px"></div>
  </div>`;

  app.querySelectorAll('[data-day]').forEach(btn => btn.addEventListener('click', () => {
    const c = btn.closest('.day-card');
    const open = c.classList.contains('open');
    app.querySelectorAll('.day-card.open').forEach(o => o.classList.remove('open'));
    if (!open) c.classList.add('open');
  }));
  app.querySelector('.day-card')?.classList.add('open');
  $('#gen').addEventListener('click', confirmRotate);
}

/* ---------------- rotation ---------------- */
function confirmRotate() {
  const nextPlan = buildSplit(split.cycle + 1);
  const diffs = [];
  plan.forEach((d, di) => d.exercises.forEach((e, ei) => {
    const to = nextPlan[di].exercises[ei].ex;
    if (to !== e.ex) diffs.push({ day: d.name, from: LIB[e.ex].name, to: LIB[to].name });
  }));
  const b = blockStats();

  sheet(`
    <h3>Rotate to block ${split.cycle + 2}?</h3>
    <p>Same structure, same sets, reps, RIR and rest — every movement pattern swaps to a different exercise so the muscle gets hit from a new angle. Your logged history stays exactly where it is.</p>
    <div style="background:var(--bg-2);border-radius:12px;padding:12px 14px;margin-bottom:14px">
      <div style="font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--tx-3);font-weight:700;margin-bottom:8px">
        ${diffs.length} exercises change</div>
      ${diffs.slice(0, 9).map(d => `<div class="diffline">
        <span class="from">${esc(d.from)}</span><span class="ar">→</span><span class="to">${esc(d.to)}</span></div>`).join('')}
      ${diffs.length > 9 ? `<div style="font-size:12px;color:var(--tx-3);padding-top:8px">+ ${diffs.length - 9} more</div>` : ''}
    </div>
    ${!b.due ? `<p style="color:var(--warn);font-size:13px">You are only ${b.days} days into this block. The plan is 8 weeks — rotating now resets the timer to day 0.</p>` : ''}
    <div class="row">
      <button class="btn ghost" data-close>Not yet</button>
      <button class="btn" id="doRotate">Rotate now</button>
    </div>`);

  $('#doRotate').addEventListener('click', () => {
    split = S.rotateSplit();
    loadSplit();
    closeSheet();
    toast(`Block ${split.cycle + 1} is live — timer reset to day 0`);
    location.hash = '#/split'; render();
  });
}

/* ---------------- log / history ---------------- */
function viewLog() {
  const sessions = S.getSessions();
  const keys = Object.keys(sessions).filter(k => sessions[k].finishedAt).sort().reverse();

  const thisWeek = keys.filter(k => S.daysBetween(sessions[k].date, S.todayKey()) < 7).length;
  const allSets = keys.flatMap(k => Object.values(sessions[k].sets).flat()).filter(s => s.done);
  const totalVol = allSets.filter(s => s.w && s.reps).reduce((a, s) => a + s.w * s.reps, 0);

  const trained = [...new Set(keys.flatMap(k => Object.keys(sessions[k].sets)))]
    .filter(id => LIB[id]).sort((a, b) => LIB[a].name.localeCompare(LIB[b].name));

  const list = keys.slice(0, 40).map(k => {
    const s = sessions[k];
    const d = plan.find(x => x.id === s.dayId) || { name: s.dayId, kind: 'push' };
    const n = Object.values(s.sets).flat().filter(x => x.done).length;
    const vol = Object.values(s.sets).flat().filter(x => x.done && x.w && x.reps).reduce((a, x) => a + x.w * x.reps, 0);
    const mins = s.startedAt && s.finishedAt ? Math.round((s.finishedAt - s.startedAt) / 60000) : null;
    return `<button class="hist" data-open="${s.dayId}" data-date="${s.date}">
      <span class="badge ${d.kind}">${d.name.split(' ')[1] || ''}<small>${d.kind.toUpperCase()}</small></span>
      <span class="hist-b"><b>${d.name}</b><p>${fmtDate(s.date)} · ${n} sets${mins ? ` · ${mins} min` : ''} · ${Math.round(vol).toLocaleString()} ${unit()}</p></span>
      <span class="chev">›</span>
    </button>`;
  }).join('');

  app.innerHTML = `<div class="view">
    <div class="top"><div><h1>Log</h1><div class="sub">${keys.length} session${keys.length===1?'':'s'} recorded</div></div></div>

    <div class="stat3">
      <div class="card"><b>${thisWeek}</b><span>this week</span></div>
      <div class="card"><b>${allSets.length}</b><span>sets total</span></div>
      <div class="card"><b>${totalVol >= 1000 ? (totalVol/1000).toFixed(1) + 'k' : Math.round(totalVol)}</b><span>${unit()} moved</span></div>
    </div>

    ${trained.length ? `<div class="sect">
      <div class="sect-h"><h2>Progression</h2></div>
      <select class="picker" id="exPick">
        ${trained.map(id => `<option value="${id}">${esc(LIB[id].name)}</option>`).join('')}
      </select>
      <div class="card" style="margin-top:10px"><div class="chartbox" id="chart"></div></div>
    </div>` : ''}

    <div class="sect">
      <div class="sect-h"><h2>Sessions</h2></div>
      ${keys.length
        ? `<div class="card">${list}</div>`
        : `<div class="card empty"><div class="big">📓</div><p>No finished sessions yet.<br>Log your first workout and it lands here.</p></div>`}
    </div>

    <div class="sect">
      <div class="sect-h"><h2>Data</h2></div>
      <div class="card pad" style="display:flex;gap:10px">
        <button class="btn sm ghost" id="exp">Export backup</button>
        <button class="btn sm ghost" id="imp">Import</button>
      </div>
      <p style="font-size:11.5px;color:var(--tx-3);text-align:center;margin-top:9px;line-height:1.5">
        Everything is stored on this device only. Export before clearing your browser data.</p>
    </div>
    <div style="height:20px"></div>
  </div>`;

  const pick = $('#exPick');
  if (pick) {
    drawChart(pick.value);
    pick.addEventListener('change', () => drawChart(pick.value));
    clearTimeout(window._chartRz);
    window.onresize = () => {
      clearTimeout(window._chartRz);
      window._chartRz = setTimeout(() => { if ($('#chart') && $('#exPick')) drawChart($('#exPick').value); }, 150);
    };
  }
  app.querySelectorAll('[data-open]').forEach(b => b.addEventListener('click', () => {
    location.hash = `#/day/${b.dataset.open}`;
  }));
  $('#exp').addEventListener('click', () => {
    const blob = new Blob([S.exportAll()], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `pushpull-backup-${S.todayKey()}.json`;
    a.click(); URL.revokeObjectURL(a.href);
    toast('Backup downloaded');
  });
  $('#imp').addEventListener('click', () => {
    const f = document.createElement('input'); f.type = 'file'; f.accept = 'application/json';
    f.onchange = () => {
      const file = f.files[0]; if (!file) return;
      const r = new FileReader();
      r.onload = () => { try { S.importAll(r.result); loadSplit(); render(); toast('Backup restored'); } catch { toast('That file did not parse'); } };
      r.readAsText(file);
    };
    f.click();
  });
}

function drawChart(exId) {
  const box = $('#chart'); if (!box) return;
  const hist = S.exerciseHistory(exId);
  if (hist.length < 2) {
    box.innerHTML = `<div style="text-align:center;padding:26px 10px;color:var(--tx-3);font-size:13px;line-height:1.6">
      ${hist.length ? 'One session logged. Two or more draws the curve.' : 'Nothing logged for this exercise yet.'}</div>`;
    return;
  }
  const pts = hist.slice(-14);
  const vals = pts.map(p => p.e1rm);
  const min = Math.min(...vals) * 0.94, max = Math.max(...vals) * 1.04;
  /* draw in real pixel space so the dots stay round at any width */
  const W = Math.max(160, (box.clientWidth || 348) - 28), H = 130;  /* 28 = .chartbox side padding */
  const PAD = 4;
  const x = i => PAD + (i / (pts.length - 1)) * (W - PAD * 2);
  const y = v => H - PAD - ((v - min) / (max - min || 1)) * (H - PAD * 2);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(2)},${y(p.e1rm).toFixed(2)}`).join(' ');
  const area = `${line} L${W},${H} L0,${H} Z`;
  const first = vals[0], last = vals[vals.length - 1];
  const delta = last - first;

  box.innerHTML = `
    <div style="display:flex;align-items:baseline;gap:9px;margin-bottom:10px">
      <b style="font-size:23px;font-weight:800;letter-spacing:-.5px">${last} ${unit()}</b>
      <span style="font-size:12.5px;font-weight:700;color:${delta >= 0 ? 'var(--ok)' : 'var(--warn)'}">
        ${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta)} ${unit()}</span>
      <span style="font-size:11px;color:var(--tx-3);margin-left:auto">estimated 1RM</span>
    </div>
    <svg viewBox="0 0 ${W} ${H}">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--acc)" stop-opacity=".28"/>
        <stop offset="100%" stop-color="var(--acc)" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${area}" fill="url(#g)"/>
      <path d="${line}" fill="none" stroke="var(--acc)" stroke-width="2"
        stroke-linejoin="round" stroke-linecap="round"/>
      ${pts.map((p, i) => `<circle cx="${x(i).toFixed(2)}" cy="${y(p.e1rm).toFixed(2)}" r="3"
        fill="var(--bg)" stroke="var(--acc)" stroke-width="2"/>`).join('')}
    </svg>
    <div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--tx-3);margin-top:8px;font-weight:600">
      <span>${fmtDate(pts[0].date)}</span><span>${fmtDate(pts[pts.length-1].date)}</span>
    </div>
    <div style="font-size:12px;color:var(--tx-3);margin-top:10px;padding-top:10px;border-top:1px solid var(--line)">
      Best set: <b style="color:var(--tx-2)">${pts[pts.length-1].top.w} ${unit()} × ${pts[pts.length-1].top.reps}</b>
      · Volume: <b style="color:var(--tx-2)">${Math.round(pts[pts.length-1].volume).toLocaleString()} ${unit()}</b>
    </div>`;
}

/* ---------------- fuel view ---------------- */
function viewFuel() {
  const f = S.getFuel();
  const week = S.fuelRange(7);

  const rows = FUEL.map(item => {
    if (item.counter) {
      const pct = Math.min(100, (f.protein / item.goal) * 100);
      return `<div class="fuel-row">
        <div class="fuel-ico">${item.icon}</div>
        <div class="fuel-b">
          <b>${item.label}</b><span>${f.protein} g of ${item.goal} g</span>
          <div class="bar"><i class="${f.protein >= item.goal ? 'full' : ''}" style="width:${pct}%"></i></div>
        </div>
      </div>
      <div class="fuel-row" style="padding-top:0">
        <div style="flex:0 0 40px"></div>
        <div class="pcount" style="flex:1">
          <button data-p="-25">−</button><b>${f.protein} g</b><button data-p="25">+</button>
          <button data-p="10" style="width:auto;padding:0 11px;font-size:12.5px;font-weight:700">+10</button>
          <button data-p="reset" style="width:auto;padding:0 11px;font-size:12.5px;font-weight:700;margin-left:auto">Reset</button>
        </div>
      </div>`;
    }
    return `<div class="fuel-row">
      <div class="fuel-ico">${item.icon}</div>
      <div class="fuel-b"><b>${item.label}</b><span>${item.detail}</span></div>
      <button class="check ${f[item.id] ? 'on' : ''}" data-fuel="${item.id}">✓</button>
    </div>`;
  }).join('');

  const streak = `<div class="streak">${week.map(d => {
    const hits = ['creatine','preworkout','gatorade'].filter(k => d[k]).length + (d.protein >= 130 ? 1 : 0);
    const cls = hits === 4 ? 'hit' : hits > 0 ? 'part' : '';
    return `<div><div class="sq ${cls}">${hits || ''}</div>
      <div class="lb">${new Date(d.date+'T00:00:00').toLocaleDateString(undefined,{weekday:'narrow'})}</div></div>`;
  }).join('')}</div>`;

  app.innerHTML = `<div class="view">
    <div class="top"><div><h1>Fuel</h1><div class="sub">Recover. Creatine. 130 g protein.</div></div></div>
    <div class="card">${rows}</div>

    <div class="sect">
      <div class="sect-h"><h2>Last 7 days</h2></div>
      <div class="card">${streak}</div>
    </div>

    <div class="sect">
      <div class="sect-h"><h2>Pre-workout protocol</h2></div>
      <div class="card pad">
        <p style="font-size:13.5px;color:var(--tx-2);line-height:1.6">
          Carbs and caffeine <b style="color:var(--tx)">one hour before</b> the session.
          Gatorade in hand from the first warm-up set to the last.
          Creatine every day, training or not — the timing does not matter, the consistency does.</p>
      </div>
    </div>

    <div class="sect">
      <div class="sect-h"><h2>Settings</h2></div>
      <div class="card">
        <div class="fuel-row">
          <div class="fuel-ico">⚖️</div>
          <div class="fuel-b"><b>Units</b><span>Weights are logged in ${unit()}</span></div>
          <button class="btn sm ghost" style="width:auto;padding:9px 15px" id="unitToggle">${unit() === 'kg' ? 'kg' : 'lb'}</button>
        </div>
        <div class="fuel-row">
          <div class="fuel-ico">🔔</div>
          <div class="fuel-b"><b>Rest timer alert</b><span>Beep and vibrate when rest ends</span></div>
          <button class="check ${S.getPrefs().sound ? 'on' : ''}" id="soundToggle">✓</button>
        </div>
      </div>
    </div>
    <div style="height:20px"></div>
  </div>`;

  app.querySelectorAll('[data-fuel]').forEach(b => b.addEventListener('click', () => {
    const cur = S.getFuel();
    S.setFuel({ [b.dataset.fuel]: !cur[b.dataset.fuel] });
    if (navigator.vibrate) navigator.vibrate(15);
    render();
  }));
  app.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
    const cur = S.getFuel();
    const v = b.dataset.p;
    const next = v === 'reset' ? 0 : Math.max(0, cur.protein + Number(v));
    S.setFuel({ protein: next });
    if (next >= 130 && cur.protein < 130) toast('130 g hit 💪');
    render();
  }));
  $('#unitToggle').addEventListener('click', () => { S.setPrefs({ unit: unit() === 'kg' ? 'lb' : 'kg' }); render(); });
  $('#soundToggle').addEventListener('click', () => {
    const p = S.getPrefs(); S.setPrefs({ sound: !p.sound, vibrate: !p.sound }); render();
  });
}

/* ---------------- modal / lightbox / photo ---------------- */
function sheet(html) {
  const s = document.createElement('div');
  s.className = 'scrim'; s.id = 'scrim';
  s.innerHTML = `<div class="sheet">${html}</div>`;
  s.addEventListener('click', e => { if (e.target === s || e.target.hasAttribute('data-close')) closeSheet(); });
  document.body.appendChild(s);
}
const closeSheet = () => $('#scrim')?.remove();

function lightbox(src) {
  const l = document.createElement('div');
  l.className = 'lightbox';
  l.innerHTML = `<img src="${src}" alt="">`;
  l.addEventListener('click', () => l.remove());
  document.body.appendChild(l);
}

function pickPhoto(exId) {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = 'image/*';
  inp.onchange = () => {
    const file = inp.files[0]; if (!file) return;
    const img = new Image();
    const r = new FileReader();
    r.onload = () => {
      img.onload = () => {
        /* downscale so localStorage does not blow up */
        const max = 900;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        S.setPhoto(exId, c.toDataURL('image/jpeg', 0.72));
        toast('Photo saved'); render();
      };
      img.src = r.result;
    };
    r.readAsDataURL(file);
  };
  inp.click();
}

/* ---------------- router ---------------- */
const ROUTES = [
  { re: /^#\/$/,            view: viewHome,  nav: 'home' },
  { re: /^#\/day\/(\w+)$/,  view: m => viewDay(m[1]), nav: 'home' },
  { re: /^#\/split$/,       view: viewSplit, nav: 'split' },
  { re: /^#\/log$/,         view: viewLog,   nav: 'log' },
  { re: /^#\/fuel$/,        view: viewFuel,  nav: 'fuel' }
];

function render() {
  const hash = location.hash || '#/';
  const r = ROUTES.find(r => r.re.test(hash)) || ROUTES[0];
  const m = hash.match(r.re);
  clearInterval(sessionTick);
  r.view(m);
  document.querySelectorAll('.nav a').forEach(a => a.classList.toggle('on', a.dataset.nav === r.nav));
  if (!/^#\/day\//.test(hash)) { keepAwake(false); }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
document.addEventListener('visibilitychange', () => { if (!document.hidden && Rest.endsAt) Rest.loop(); });

$('#restSkip').addEventListener('click', () => Rest.stop());
$('#restAdd').addEventListener('click', () => Rest.add(30));

loadSplit();
render();

/* Offline caching in production only — a stale SW makes local dev miserable. */
const isLocal = ['localhost','127.0.0.1'].includes(location.hostname);
if ('serviceWorker' in navigator && !isLocal) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
