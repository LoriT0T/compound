import { LIB, buildSplit, SCHEDULE, FUEL, PRINCIPLES, BLOCK_WEEKS, CYCLE_LENGTH } from './data.js';
import * as S from './store.js';
import * as H from './health.js';

const $ = sel => document.querySelector(sel);
const app = $('#app');
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

let split, plan, restTimer = null, sessionTick = null;
/* Today view is split vertically by day; this is the column in focus. */
let selDate = null;

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

/* ================= health components ================= */
const BASKET = '<svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M2 5.5h12l-1.2 7.2a1 1 0 01-1 .8H4.2a1 1 0 01-1-.8L2 5.5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M5.4 5.5L7.2 2m3.4 3.5L8.8 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
const HTICK = '<svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.2l3 3 6-6.4" stroke="#0b0c0e" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function hFields(date, i) {
  if (!i.fields) return '';
  const e = S.getHEntry(date, i.id), v = (e && e.v) || {};
  return `<div class="hfields">${i.fields.map(f => `<div class="hf">
    <label>${esc(f.l)}${f.u ? `<span class="u">${esc(f.u)}</span>` : ''}</label>
    <input type="${f.t}" value="${v[f.k] != null ? esc(v[f.k]) : ''}" placeholder="—"
      inputmode="${f.t === 'number' ? 'decimal' : 'text'}"
      data-hf="${i.id}" data-hk="${f.k}"></div>`).join('')}</div>`;
}

/* One component row: minimal collapsed, full detail + fields on expand. */
function hRow(date, i) {
  const e = S.getHEntry(date, i.id), on = !!(e && e.done), c = H.DOMAINS[i.dom].c;
  const right = i.cad.t === 'w'
    ? `<span class="pips">${[...Array(i.cad.n)].map((_, x) =>
        `<i class="${x < S.weekCount(date, i.id) ? 'pf' : ''}"></i>`).join('')}</span>`
    : `<span class="htag">${esc(i.tag)}</span>`;
  return `<div class="hrow ${on ? 'on' : ''}" data-hr="${i.id}" style="--k:${c}">
    <div class="hrow-h">
      <button class="htick" data-ht="${i.id}" aria-label="Log ${esc(i.name)}">${HTICK}</button>
      <button class="hrow-b" data-hx="${i.id}"><b>${i.ico ? i.ico + ' ' : ''}${esc(i.name)}</b><span>${esc(i.brief)}</span></button>
      ${right}
      <button class="hexp" data-hx="${i.id}" aria-label="Details">›</button>
    </div>
    <div class="hrow-d">
      ${i.how ? `<div class="lab">How</div><p>${i.how}</p>` : ''}
      ${i.why ? `<div class="lab">Why it earns a place</div><p>${i.why}</p>` : ''}
      ${i.trap ? `<div class="lab w">Watch out</div><p class="w">${i.trap}</p>` : ''}
      ${hFields(date, i)}
    </div></div>`;
}

/* A horizontal band for one domain. */
function domSection(date, dom, inner, countOverride) {
  const m = H.DOMAINS[dom];
  const sc = countOverride || H.domainScore(date, dom);
  return `<div class="dom">
    <div class="dom-h"><span class="sw" style="background:${m.c}"></span>
      <h2 style="color:${m.c}">${m.label}</h2>
      <span class="cnt ${sc.n === sc.t && sc.t ? 'full' : ''}" data-domcount="${dom}">${sc.n}/${sc.t}</span></div>
    <div class="card">${inner}</div></div>`;
}

/* The vertical split: one column per day of the current week. */
function dayStrip(date) {
  const ws = S.weekStart(S.todayKey()), today = S.todayKey();
  const doms = ['sleep','move','workout','fuel','test'];
  return `<div class="dstrip">${[...Array(7)].map((_, i) => {
    const dk = S.shiftDay(ws, i);
    const dt = new Date(dk + 'T00:00:00');
    const dots = doms.map(d => {
      let hit;
      if (d === 'workout') {
        const sl = SCHEDULE[dt.getDay()];
        hit = sl.workout && S.getSessions()[S.sessionKey(sl.workout, dk)]?.finishedAt;
      } else hit = H.inDomain(d).some(it => S.getHEntry(dk, it.id)?.done);
      return `<i style="${hit ? `background:${H.DOMAINS[d].c}` : ''}"></i>`;
    }).join('');
    return `<button class="dcol ${dk === date ? 'sel' : ''} ${dk > today ? 'fut' : ''}" data-day-sel="${dk}">
      <div class="dl">${dt.toLocaleDateString(undefined,{weekday:'short'}).slice(0,3)}</div>
      <div class="dn">${dt.getDate()}</div>
      <div class="dots">${dots}</div></button>`;
  }).join('')}</div>`;
}

/* PP fuel rows keep their own store; health detail is attached on expand. */
const FUEL_DETAIL = {
  preworkout:{ how:'Carbs and caffeine one hour before the session.',
    why:'Gives the session something to run on and puts caffeine at peak effect during the working sets rather than at bedtime.' },
  gatorade:{ how:'In hand from the first warm-up set to the last.',
    why:'Fluid and sodium across a long session. Sipping beats drinking it all at once.' },
  creatine:{ how:'5 g, any time of day, training or not.',
    why:'The only drug-like compound in this app with vitamin-tier evidence. Loads muscle as phosphocreatine to regenerate ATP, and crosses into brain — verified by MRS. Cognitive benefit concentrates in the <b>sleep-deprived</b>, so it is worth more in exam season than on a good week.',
    trap:'Micronised monohydrate only. Timing genuinely does not matter — it is a saturation model. Consistency is the whole game.' },
  protein:{ how:'130 g target, logged across the day.',
    why:'Roughly 1.6 g per kg is where meta-analyses converge for training adaptation. Below it, adaptation is limited no matter how well you train.',
    trap:'More is not better — above ~2.2 g/kg there is no further benefit, just expensive food.' }
};

function fuelRows(date) {
  const f = S.getFuel(date);
  return FUEL.map(item => {
    const d = FUEL_DETAIL[item.id] || {};
    const detail = `<div class="hrow-d">
      ${d.how ? `<div class="lab">How</div><p>${d.how}</p>` : ''}
      ${d.why ? `<div class="lab">Why it earns a place</div><p>${d.why}</p>` : ''}
      ${d.trap ? `<div class="lab w">Watch out</div><p class="w">${d.trap}</p>` : ''}
      ${item.counter ? `<div class="ptype">
        <label>Protein today<span class="u">g</span></label>
        <input type="number" inputmode="decimal" data-pval value="${f.protein || ''}" placeholder="0">
        <div class="pbar"><i data-pbar style="width:${Math.min(100,(f.protein/item.goal)*100)}%"></i></div>
      </div>
      <div class="pcount" style="margin-top:9px">
        <button data-p="-25">−</button><button data-p="25">+25</button>
        <button data-p="10" style="width:auto;padding:0 11px;font-size:12.5px;font-weight:700">+10</button>
        <button data-p="reset" style="width:auto;padding:0 11px;font-size:12.5px;font-weight:700;margin-left:auto">Reset</button>
      </div>` : ''}</div>`;
    const on = item.counter ? f.protein >= item.goal : !!f[item.id];
    const SHORT = { preworkout:'1 h before', gatorade:'During', creatine:'5 g' };
    const right = item.counter
      ? `<span class="htag">${f.protein}/${item.goal} g</span>`
      : `<span class="htag">${esc(SHORT[item.id] || item.detail)}</span>`;
    return `<div class="hrow ${on ? 'on' : ''}" data-hr="fuel-${item.id}" style="--k:var(--fuel)">
      <div class="hrow-h">
        ${item.counter
          ? `<span class="htick" style="border-color:${on ? 'var(--fuel)' : ''};background:${on ? 'var(--fuel)' : ''}">${HTICK}</span>`
          : `<button class="htick" data-fuel="${item.id}" aria-label="Log ${esc(item.label)}">${HTICK}</button>`}
        <button class="hrow-b" data-hx="fuel-${item.id}"><b>${item.icon} ${esc(item.label)}</b>
          <span>${esc(item.detail)}</span></button>
        ${right}
        <button class="hexp" data-hx="fuel-${item.id}">›</button>
      </div>${detail}</div>`;
  }).join('');
}

/* Workout band — reads real sessions, so lifting has one source of truth. */
function workoutSection(date) {
  const dt = new Date(date + 'T00:00:00');
  const slot = SCHEDULE[dt.getDay()];
  const day = slot.workout ? dayById(slot.workout) : null;
  const isToday = date === S.todayKey();
  if (!day) {
    return domSection(date, 'workout', `<div class="pad" style="display:flex;align-items:center;gap:13px">
      <div class="fuel-ico">😴</div>
      <div class="fuel-b"><b>Rest day</b><span>Growth happens now. Creatine, protein, sleep.</span></div>
      <a class="btn sm ghost" style="width:auto;padding:9px 14px" href="#/split">Split</a></div>
    ${fuelRows(date)}`, workoutScore(date));
  }
  const key = S.sessionKey(day.id, date);
  const sess = S.getSessions()[key];
  const total = day.exercises.reduce((n, e) => n + e.sets.length, 0);
  const done = sess ? Object.values(sess.sets).flat().filter(x => x.done).length : 0;
  const label = sess?.finishedAt ? 'Review session' : done ? 'Continue session' : 'Start session';
  return domSection(date, 'workout', `<div class="pad">
    <div style="display:flex;align-items:flex-start;gap:12px">
      <div style="flex:1;min-width:0">
        <b style="font-size:16px">${esc(day.name)}</b>
        <p style="font-size:12.5px;color:var(--tx-2);margin-top:3px;line-height:1.45">${esc(day.focus)}</p>
      </div>
      <span class="badge ${day.kind}" style="flex:none">${day.kind.toUpperCase()}</span>
    </div>
    <div class="meta-row" style="margin-top:12px">
      <div class="meta"><b>${day.exercises.length}</b><span>exercises</span></div>
      <div class="meta"><b>${total}</b><span>sets</span></div>
      <div class="meta"><b>~${day.mins}</b><span>minutes</span></div>
      ${done ? `<div class="meta"><b style="color:var(--ok)">${done}/${total}</b><span>logged</span></div>` : ''}
    </div>
    <div style="margin-top:14px"><a class="btn ${isToday ? '' : 'ghost'}" href="#/day/${day.id}">${label}</a></div>
  </div>${fuelRows(date)}`, workoutScore(date));
}

/* Workout band counts the session plus the four training-fuel items. */
function workoutScore(date) {
  const dt = new Date(date + 'T00:00:00');
  const slot = SCHEDULE[dt.getDay()];
  const f = S.getFuel(date);
  const fuelDone = ['creatine','preworkout','gatorade'].filter(k => f[k]).length + (f.protein >= 130 ? 1 : 0);
  if (!slot.workout) return { n: fuelDone, t: FUEL.length };
  const sess = S.getSessions()[S.sessionKey(slot.workout, date)];
  return { n: fuelDone + (sess?.finishedAt ? 1 : 0), t: FUEL.length + 1 };
}


/* ---- targeted repaint: a tick updates what changed, never the page ---- */
function repaintHealth(date, id) {
  const strip = app.querySelector('.dstrip');
  if (strip) strip.outerHTML = dayStrip(date);
  app.querySelectorAll('[data-domcount]').forEach(el => {
    const d = el.dataset.domcount;
    const sc = d === 'workout' ? workoutScore(date) : H.domainScore(date, d);
    el.textContent = `${sc.n}/${sc.t}`;
    el.classList.toggle('full', sc.t > 0 && sc.n === sc.t);
  });
  if (!id) return;
  const item = H.byId(id);
  const row = app.querySelector(`.hrow[data-hr="${id}"]`);
  if (!row || !item) return;
  row.classList.toggle('on', !!S.getHEntry(date, id)?.done);
  const pips = row.querySelector('.pips');
  if (pips && item.cad.t === 'w') {
    const n = S.weekCount(date, id);
    pips.innerHTML = [...Array(item.cad.n)].map((_, x) => `<i class="${x < n ? 'pf' : ''}"></i>`).join('');
  }
}

/* PP fuel rows sit in the Workout band; same treatment. */
function repaintFuel(date, id) {
  const f = S.getFuel(date);
  const item = FUEL.find(x => x.id === id);
  const row = app.querySelector(`.hrow[data-hr="fuel-${id}"]`);
  if (row && item) {
    const on = item.counter ? f.protein >= item.goal : !!f[id];
    row.classList.toggle('on', on);
    const tick = row.querySelector('.htick');
    if (tick) { tick.style.background = on ? 'var(--fuel)' : ''; tick.style.borderColor = on ? 'var(--fuel)' : ''; }
    const tag = row.querySelector('.htag');
    if (tag && item.counter) tag.textContent = `${f.protein}/${item.goal} g`;
  }
  const pv = app.querySelector('[data-pval]');
  if (pv && document.activeElement !== pv) pv.value = f.protein || '';
  const bar = app.querySelector('[data-pbar]');
  if (bar) bar.style.width = Math.min(100, (f.protein / 130) * 100) + '%';
  repaintHealth(date, null);
}

function viewHome() {
  const date = selDate || S.todayKey();
  const dt = new Date(date + 'T00:00:00');
  const isToday = date === S.todayKey();
  const b = blockStats();

  const sec = (dom) => domSection(date, dom,
    H.inDomain(dom).map(i => hRow(date, i)).join(''));

  app.innerHTML = `<div class="view">
    <div class="top"><div>
      <h1>${isToday ? greeting() : dt.toLocaleDateString(undefined,{weekday:'long'})}</h1>
      <div class="sub">${dt.toLocaleDateString(undefined,{weekday:'long',day:'numeric',month:'long'})}${isToday ? '' : ' · editing a past day'}</div>
    </div></div>

    ${dayStrip(date)}

    ${sec('sleep')}
    ${sec('move')}
    ${workoutSection(date)}
    ${sec('fuel')}
    ${sec('situ')}
    ${sec('test')}

    <div class="dom">
      <div class="dom-h"><span class="sw" style="background:var(--acc)"></span>
        <h2 style="color:var(--acc)">Current block</h2>
        <a class="link" href="#/split">Full split →</a></div>
      ${blockCard(b)}
    </div>

    <div class="hnote amber"><b>Before any blood test:</b> stop the multivitamin 72 hours ahead.
      Its 300µg of biotin skews immunoassays — TSH reads falsely low, free T4 falsely high.</div>
    <div style="height:14px"></div>
  </div>`;
  wireHealth(date);
}

/* Bound once on #app, so repainting a subtree never loses a handler.
   A tick saves immediately and repaints only what changed — scroll
   position, open panels and keyboard focus all survive. */
const hDate = () => selDate || S.todayKey();
const saveOk = ok => { if (ok === false || ok === null) toast('Could not save — storage may be full'); };

function wireHealth() { /* delegation is global; kept so call sites stay put */ }

app.addEventListener('click', e => {
  const day = e.target.closest('[data-day-sel]');
  if (day) { selDate = day.dataset.daySel; render(); return; }

  const x = e.target.closest('[data-hx]');
  if (x) { app.querySelector(`.hrow[data-hr="${x.dataset.hx}"]`)?.classList.toggle('open'); return; }

  const t = e.target.closest('[data-ht]');
  if (t) { const d = hDate(); saveOk(S.toggleH(d, t.dataset.ht)); repaintHealth(d, t.dataset.ht); return; }

  const bask = e.target.closest('[data-bask]');
  if (bask) {
    const id = bask.dataset.bask;
    /* Basket toggles between none and basket. Tapping it on something already bought
       walks it back a step rather than clearing it outright — the likely intent is
       "I need another", not "forget this". */
    const cur = S.buyState(id);
    saveOk(S.setBuyState(id, cur === 'basket' ? 'none' : 'basket'));
    render();
    return;
  }

  const buy = e.target.closest('[data-buy]');
  if (buy) {
    const id = buy.dataset.buy;
    const on = S.buyState(id) !== 'bought';
    saveOk(S.setBuyState(id, on ? 'bought' : 'none'));
    const row = app.querySelector(`.hrow[data-hr="${id}"]`);
    if (row) row.className = `hrow st-${S.buyState(id)}`;
    /* group and header counts — bought only. Counting a basket item as bought would
       make the list look finished while half of it is still on a van. */
    H.BUY_GROUPS.forEach(g => {
      const items = H.BUY.filter(x => x.g === g.id);
      const el = [...app.querySelectorAll('.dom')].find(d =>
        d.querySelector('h2')?.textContent === g.label)?.querySelector('.cnt');
      if (el) {
        const n = items.filter(x => S.buyState(x.id) === 'bought').length;
        el.textContent = `${n}/${items.length}`;
        el.classList.toggle('full', n === items.length);
      }
    });
    const done = H.BUY.filter(x => S.buyState(x.id) === 'bought').length, total = H.BUY.length;
    const inB = H.BUY.filter(x => S.buyState(x.id) === 'basket').length;
    const sub = app.querySelector('.top .sub');
    if (sub) sub.textContent = `${done} of ${total} bought${inB ? ` · ${inB} in the basket` : ''}`;
    const left = app.querySelector('.card.pad b'); if (left) left.textContent = `${total - done} left`;
    const bar = app.querySelector('.card.pad .bar i');
    if (bar) { bar.style.width = (done/total)*100 + '%'; bar.classList.toggle('full', done === total); }
    return;
  }

  const off = e.target.closest('[data-off]');
  if (off) { S.setHOff(off.dataset.off, !S.getHOff()[off.dataset.off]); render(); return; }

  /* only the fuel rows rendered as health rows — the standalone #/fuel page keeps its own */
  const fu = e.target.closest('[data-fuel]');
  if (fu && fu.closest('.hrow')) {
    const d = hDate(), id = fu.dataset.fuel;
    saveOk(S.setFuel({ [id]: !S.getFuel(d)[id] }, d));
    repaintFuel(d, id); return;
  }
  const p = e.target.closest('[data-p]');
  if (p && p.closest('.hrow')) {
    const d = hDate(), v = p.dataset.p, f = S.getFuel(d);
    saveOk(S.setFuel({ protein: v === 'reset' ? 0 : Math.max(0, f.protein + Number(v)) }, d));
    repaintFuel(d, 'protein'); return;
  }
});

app.addEventListener('change', e => {
  const f = e.target.closest('[data-hf]');
  if (f) { saveOk(S.setHField(hDate(), f.dataset.hf, f.dataset.hk, f.value)); return; }

  const pv = e.target.closest('[data-pval]');
  if (pv) {
    const d = hDate();
    saveOk(S.setFuel({ protein: pv.value === '' ? 0 : Math.max(0, Number(pv.value)) }, d));
    repaintFuel(d, 'protein'); return;
  }
  const o = e.target.closest('[data-oura]');
  if (o) saveOk(S.setOura(S.weekStart(S.todayKey()), o.dataset.oura, o.value));
});


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

/* ---------------- progression ----------------
   Double progression, read straight off the prescription already in data.js:
   a target of '5-6' means climb to 6 reps at the target RIR, then add weight.
   ---------------------------------------------- */
const repRange = t => {
  const m = String(t).match(/(\d+)\s*-\s*(\d+)/);
  if (m) return { lo: +m[1], hi: +m[2] };
  const n = parseInt(t, 10);
  return { lo: n, hi: n };
};

/* Smallest jump most gyms can actually make. */
const STEP = () => unit() === 'kg' ? 2.5 : 5;
const round2 = n => Math.round(n * 10) / 10;
const volumeOf = rows => rows.filter(r => r.done && r.w && r.reps)
  .reduce((a, r) => a + r.w * r.reps, 0);

/* What to aim for this session, given how the last one went. */
function progressionCue(e, last) {
  if (!last || !last.sets.length)
    return { kind: 'new', text: 'First time logged — pick a weight you could stop 2–3 reps short on, and write it down.' };

  const top = Math.max(...e.sets.map(x => repRange(x.target).hi));
  const rirTarget = Math.min(...e.sets.map(x => x.rir));
  const w = Math.max(...last.sets.map(s => s.w));
  const clearedReps = last.sets.every(s => s.reps >= top);
  const clearedRir  = last.sets.every(s => s.rir == null || s.rir <= rirTarget);

  if (clearedReps && clearedRir) {
    const next = round2(w + STEP());
    return { kind: 'up', next,
      text: `You cleared ${top} reps on every set at ${w} ${unit()}. <b>Go to ${next} ${unit()}</b> and expect reps to drop back to the bottom of the range.` };
  }
  if (clearedReps)
    return { kind: 'hold', next: w,
      text: `Reps are there at ${w} ${unit()}, but not at ${rirTarget} RIR. <b>Hold ${w}</b> until the last set feels like ${rirTarget} in reserve.` };
  const worst = Math.min(...last.sets.map(s => s.reps));
  return { kind: 'hold', next: w,
    text: `<b>Hold ${w} ${unit()}</b> and chase reps — lowest set was ${worst}, you want ${top} on all of them before the weight moves.` };
}

function viewDay(dayId) {
  const day = dayById(dayId);
  if (!day) return location.hash = '#/';
  const key = S.sessionKey(day.id);
  const sess = S.ensureSession(day.id, day);
  const totalSets = day.exercises.reduce((n, e) =>
    n + Math.max(e.sets.length, (sess.sets[e.ex] || []).length), 0);
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
          ${(() => {
            /* the number to beat, visible without opening the exercise */
            if (!last) return '<span class="lastmini new">First time — record the weight</span>';
            const cue = progressionCue(e, last);
            const w = Math.max(...last.sets.map(x => x.w));
            const vol = Math.round(last.sets.reduce((a, x) => a + x.w * x.reps, 0));
            const arrow = cue.kind === 'up'
              ? `<b class="up">→ ${cue.next} ${unit()}</b>`
              : `<b class="hold">hold ${w} ${unit()}</b>`;
            return `<span class="lastmini">Last ${last.sets.map(x => `${x.w}×${x.reps}`).join(' ')}
              · ${vol.toLocaleString()} ${unit()} ${arrow}</span>`;
          })()}
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
        ${(() => {
          const cue = progressionCue(e, last);
          const volNow = volumeOf(rowSets);
          const volLast = last ? last.sets.reduce((a, s) => a + s.w * s.reps, 0) : 0;
          const dv = volLast ? Math.round((volNow - volLast) / volLast * 100) : 0;
          return `
          ${last ? `<div class="lastline">Last time · ${fmtDate(last.date)} —
            <b>${last.sets.map(s => `${s.w}×${s.reps}`).join(', ')}</b>
            <span class="vol">${Math.round(volLast).toLocaleString()} ${unit()} volume</span></div>` : ''}
          <div class="cueline ${cue.kind}">${cue.text}</div>
          <div class="volnow" data-vol="${e.ex}" ${volNow ? '' : 'hidden'}>This session
            <b>${Math.round(volNow).toLocaleString()} ${unit()}</b>${
            volLast ? ` <span class="${volNow >= volLast ? 'up' : 'dn'}">${dv >= 0 ? '+' : ''}${dv}% vs last</span>` : ''}</div>`;
        })()}
        <div class="setgrid">
          <div class="lbl"></div><div class="lbl">${unit()}</div><div class="lbl">reps</div><div class="lbl">RIR</div><div class="lbl"></div>
          ${[...Array(Math.max(e.sets.length, rowSets.length))].map((_, si) => {
            const t = e.sets[si] || e.sets[e.sets.length - 1];
            const v = rowSets[si] || {};
            const ph = last?.sets?.[si] ?? last?.sets?.[last.sets.length - 1];
            const extra = si >= e.sets.length;
            return `<div class="rowgap"></div>
              <div class="setrow ${v.done ? 'done' : ''}" data-set="${si}">
                <div class="sn">${si + 1}<small>${extra ? 'extra' : t.target}</small></div>
                <input type="number" inputmode="decimal" step="0.5" data-f="w"    value="${v.w ?? ''}"    placeholder="${ph?.w ?? '–'}">
                <input type="number" inputmode="numeric" data-f="reps" value="${v.reps ?? ''}" placeholder="${t.target}">
                <input type="number" inputmode="numeric" data-f="rir"  value="${v.rir ?? ''}"  placeholder="${t.rir}">
                <button class="tick ${v.done ? 'on' : ''}" data-done="${si}">✓</button>
              </div>`;
          }).join('')}
        </div>
        <div class="setbtns">
          <button class="btn sm ghost" data-addset="${e.ex}">+ Add set</button>
          ${rowSets.length > e.sets.length
            ? `<button class="btn sm ghost" data-rmset="${e.ex}">− Remove last</button>` : ''}
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
  app.querySelectorAll('[data-addset]').forEach(btn => btn.addEventListener('click', () => {
    const ex = btn.dataset.addset, sess = S.getSession(key);
    sess.sets[ex] = [...(sess.sets[ex] || []), { w: null, reps: null, rir: null, done: false }];
    S.saveSession(key, sess);
    const open = [...app.querySelectorAll('.ex.open')].map(el => el.dataset.ex);
    viewDay(day.id);
    open.forEach(id => app.querySelector(`.ex[data-ex="${id}"]`)?.classList.add('open'));
  }));
  app.querySelectorAll('[data-rmset]').forEach(btn => btn.addEventListener('click', () => {
    const ex = btn.dataset.rmset, sess = S.getSession(key);
    const planned = day.exercises.find(x => x.ex === ex).sets.length;
    if ((sess.sets[ex] || []).length > planned) {
      sess.sets[ex] = sess.sets[ex].slice(0, -1);
      S.saveSession(key, sess);
      const open = [...app.querySelectorAll('.ex.open')].map(el => el.dataset.ex);
      viewDay(day.id);
      open.forEach(id => app.querySelector(`.ex[data-ex="${id}"]`)?.classList.add('open'));
    }
  }));
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
      /* extra sets beyond the plan inherit the last prescription */
      const pset = plannedEx.sets[si] || plannedEx.sets[plannedEx.sets.length - 1];
      if (cell.reps == null) {
        cell.reps = Number(String(pset.target).split('-').pop());
        row.querySelector('[data-f="reps"]').value = cell.reps;
      }
      if (cell.rir == null) { cell.rir = pset.rir; row.querySelector('[data-f="rir"]').value = cell.rir; }
      cell.ts = Date.now();
    }
    S.saveSession(key, s);

    btn.classList.toggle('on', cell.done);
    row.classList.toggle('done', cell.done);
    refreshDots(exEl, s.sets[exId]);
    refreshVolume(exId, key);
    updateProgress(day, key);

    if (cell.done) {
      if (navigator.vibrate) navigator.vibrate(18);
      advanceAfterSet(day, i, si);
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

/* Where to go after ticking set `si` of exercise `i`.
   Supersets alternate the way they do in the gym: A1 -> B1 -> rest -> A2 -> B2.
   The first lift rests 0s and hands straight over; the partner carries the real
   rest interval and sends you back for the next round. */
function isSupersetPartner(day, i) {
  return i > 0 && day.exercises[i - 1].supersetInto === day.exercises[i].ex;
}

function openExercise(i) {
  const el = app.querySelector(`.ex[data-i="${i}"]`);
  if (!el) return;
  app.querySelectorAll('.ex.open').forEach(o => o.classList.remove('open'));
  el.classList.add('open');
  el.scrollIntoView({ behavior:'smooth', block:'start' });
}

function advanceAfterSet(day, i, si) {
  const ex = day.exercises[i];
  /* Sets actually logged can exceed the plan, so count those. */
  const sess = S.getSession(S.sessionKey(day.id));
  const setCount = id => {
    const planned = day.exercises.find(x => x.ex === id)?.sets.length || 0;
    return Math.max(planned, (sess?.sets?.[id] || []).length);
  };

  /* A-half: straight into the partner, same set number, no rest. */
  if (ex.supersetInto && day.exercises[i + 1]) {
    toast(`Straight into ${LIB[ex.supersetInto].name}`);
    openExercise(i + 1);
    return;
  }

  /* B-half: take the rest, then head back to the partner for the next round. */
  if (isSupersetPartner(day, i)) {
    const partner = day.exercises[i - 1];
    const more = si + 1 < setCount(partner.ex);
    if (ex.rest > 0) {
      Rest.start(ex.rest, more
        ? `Back to ${LIB[partner.ex].name} · set ${si + 2}`
        : (day.exercises[i + 1] ? 'Next: ' + LIB[day.exercises[i + 1].ex].name : 'Last set — you are done'));
    }
    openExercise(more ? i - 1 : i + 1);
    return;
  }

  /* Ordinary lift. */
  const isLastSet = si === setCount(ex.ex) - 1;
  if (ex.rest > 0) {
    Rest.start(ex.rest, isLastSet
      ? (day.exercises[i + 1] ? 'Next: ' + LIB[day.exercises[i + 1].ex].name : 'Last set — you are done')
      : `${LIB[ex.ex].name} · set ${si + 2}`);
  }
  if (isLastSet && day.exercises[i + 1]) openExercise(i + 1);
}

/* Volume is the number he actually wants to watch, so it updates as sets land. */
function refreshVolume(exId, key) {
  const el = app.querySelector(`[data-vol="${exId}"]`);
  if (!el) return;
  const rows = S.getSession(key).sets[exId] || [];
  const now = volumeOf(rows);
  if (!now) { el.hidden = true; return; }
  const last = S.lastPerformance(exId, key);
  const prev = last ? last.sets.reduce((a, r) => a + r.w * r.reps, 0) : 0;
  const dv = prev ? Math.round((now - prev) / prev * 100) : 0;
  el.hidden = false;
  el.innerHTML = `This session <b>${Math.round(now).toLocaleString()} ${unit()}</b>` +
    (prev ? ` <span class="${now >= prev ? 'up' : 'dn'}">${dv >= 0 ? '+' : ''}${dv}% vs last</span>` : '');
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
  const total = day.exercises.reduce((n, e) =>
    n + Math.max(e.sets.length, (s.sets[e.ex] || []).length), 0);
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

/* ---- health blocks that live inside the merged Log ---- */
function healthLogBlocks() {
  const today = S.todayKey(), WK = 8;
  const doms = ['sleep','move','workout','fuel'];
  const start = S.weekStart(S.shiftDay(today, -7 * (WK - 1)));

  let grid = '<div class="hgrid"><span class="wl"></span>' +
    ['M','T','W','T','F','S','S'].map(d => `<span class="hl">${d}</span>`).join('');
  for (let w = 0; w < WK; w++) {
    const ws = S.shiftDay(start, w * 7);
    grid += `<span class="wl">${ws.slice(5).replace('-','/')}</span>`;
    for (let d = 0; d < 7; d++) {
      const dk = S.shiftDay(ws, d);
      const cells = doms.map(dm => {
        let hit;
        if (dm === 'workout') {
          const sl = SCHEDULE[new Date(dk + 'T00:00:00').getDay()];
          hit = sl.workout && S.getSessions()[S.sessionKey(sl.workout, dk)]?.finishedAt;
        } else if (dm === 'fuel') {
          const f = S.getFuel(dk);
          hit = H.inDomain('fuel').some(i => S.getHEntry(dk, i.id)?.done)
             || ['creatine','preworkout','gatorade'].some(k => f[k]) || f.protein > 0;
        } else hit = H.inDomain(dm).some(i => S.getHEntry(dk, i.id)?.done);
        return `<i class="${hit ? 'on' : ''}" style="--c:${H.DOMAINS[dm].c}"></i>`;
      }).join('');
      grid += `<span class="hcell ${dk > today ? 'fut' : ''} ${dk === today ? 'tdy' : ''}" title="${dk}">${cells}</span>`;
    }
  }
  grid += '</div>';

  const fuelAdh = FUEL.map(item => {
    const days = 28;
    let hits = 0;
    for (let i = 0; i < days; i++) {
      const f = S.getFuel(S.shiftDay(today, -i));
      if (item.counter ? f.protein >= item.goal : f[item.id]) hits++;
    }
    return { i: { name: `${item.icon} ${item.label}`, dom: 'workout', cad: { t: 'd' } },
             pc: Math.round(hits / days * 100) };
  });

  const adh = H.live().map(i => {
    const days = i.cad.t === 'd' ? 28 : 56;
    const hits = S.doneInLast(today, i.id, days);
    const target = i.cad.t === 'd' ? days
      : i.cad.t === 'w' ? Math.round(days / 7 * i.cad.n)
      : i.cad.t === 'f' ? Math.round(days / 14)
      : i.cad.t === 'm' ? Math.round(days / 30) : 1;
    return { i, pc: target ? Math.min(100, Math.round(hits / target * 100)) : 0 };
  }).concat(fuelAdh).sort((a, b) => a.pc - b.pc);

  const week = S.fuelRange(7);
  const streak = `<div class="streak">${week.map(d => {
    const hits = ['creatine','preworkout','gatorade'].filter(k => d[k]).length + (d.protein >= 130 ? 1 : 0);
    return `<div><div class="sq ${hits === 4 ? 'hit' : hits > 0 ? 'part' : ''}">${hits || ''}</div>
      <div class="lb">${new Date(d.date+'T00:00:00').toLocaleDateString(undefined,{weekday:'narrow'})}</div></div>`;
  }).join('')}</div>`;

  return `
    <div class="sect">
      <div class="sect-h"><h2>Schedule</h2><span style="font-size:11.5px;color:var(--tx-3)">8 weeks</span></div>
      <div class="card pad">
        <div class="hlegend" style="margin-bottom:12px">${doms.map(d =>
          `<span><i style="background:${H.DOMAINS[d].c}"></i>${H.DOMAINS[d].label}</span>`).join('')}</div>
        ${grid}
        <p style="font-size:11.5px;color:var(--tx-3);margin-top:11px;line-height:1.5">
          Each square is a day, quartered by domain. A dark quarter is a gap — a column of dark
          purple means sleep is where you are losing, not supplements.</p>
      </div>
    </div>

    <div class="sect">
      <div class="sect-h"><h2>Fuel · last 7 days</h2></div>
      <div class="card">${streak}</div>
    </div>

    <div class="sect">
      <div class="sect-h"><h2>Adherence — weakest first</h2></div>
      <div class="card">${adh.map(({ i, pc }) => `<div class="adh" style="--k:${H.DOMAINS[i.dom].c}">
        <span style="width:7px;height:7px;border-radius:2px;background:${H.DOMAINS[i.dom].c};flex:none"></span>
        <span class="nm">${esc(i.name)}</span>
        <span class="trk"><i style="width:${pc}%"></i></span>
        <span class="pc">${pc}%</span></div>`).join('')}</div>
    </div>`;
}


/* ---------------- buy list ---------------- */
function viewBuy() {
  const total = H.BUY.length;
  const done = H.BUY.filter(i => S.buyState(i.id) === 'bought').length;
  const inBasket = H.BUY.filter(i => S.buyState(i.id) === 'basket').length;

  const group = g => {
    const items = H.BUY.filter(i => i.g === g.id);
    if (!items.length) return '';
    const n = items.filter(i => S.buyState(i.id) === 'bought').length;
    return `<div class="dom">
      <div class="dom-h"><span class="sw" style="background:${g.c}"></span>
        <h2 style="color:${g.c}">${esc(g.label)}</h2>
        <span class="cnt ${n === items.length ? 'full' : ''}">${n}/${items.length}</span></div>
      <div class="card">${items.map(i => `
        <div class="hrow st-${S.buyState(i.id)}" data-hr="${i.id}" style="--k:${g.c}">
          <div class="hrow-h">
            <button class="bask ${S.buyState(i.id) === 'basket' ? 'on' : ''}" data-bask="${i.id}"
              aria-label="In the basket: ${esc(i.n)}" title="In the basket">${BASKET}</button>
            <button class="htick" data-buy="${i.id}" aria-label="Bought ${esc(i.n)}"
              title="Bought">${HTICK}</button>
            <button class="hrow-b" data-hx="${i.id}"><b>${esc(i.n)}</b>
              ${i.note ? `<span>${esc(i.note)}</span>` : ''}</button>
            ${i.more ? `<button class="hexp" data-hx="${i.id}">›</button>` : '<span style="width:26px"></span>'}
          </div>
          ${i.more ? `<div class="hrow-d"><p style="padding-top:11px">${i.more}</p></div>` : ''}
        </div>`).join('')}</div>
    </div>`;
  };

  app.innerHTML = `<div class="view">
    <div class="top"><div><h1>Buy list</h1>
      <div class="sub">${done} of ${total} bought${inBasket ? ` · ${inBasket} in the basket` : ''}</div></div></div>

    <div class="card pad">
      <div style="display:flex;align-items:center;gap:14px">
        <div style="flex:1">
          <b style="font-size:15px">${total - done} left</b>
          <div class="bar"><i class="${done === total ? 'full' : ''}" style="width:${(done/total)*100}%"></i></div>
        </div>
        ${done ? '<button class="btn sm ghost" style="width:auto;padding:9px 14px" id="clearBought">Reset</button>' : ''}
      </div>
    </div>

    ${H.BUY_GROUPS.map(group).join('')}

    <div class="hnote"><b>Notes carry the spec, not just the name.</b> Where we already settled
      on a form or a dose — glycinate not oxide, EPA and DHA listed separately, standardised
      tongkat — the row says so, so you do not have to remember it in the shop. Tap any row
      with a chevron for the reasoning.</div>
    <div style="height:16px"></div>
  </div>`;

  $('#clearBought')?.addEventListener('click', () => {
    if (confirm('Clear every tick on the buy list?')) {
      H.BUY.forEach(i => S.setBuy(i.id, false));
      render();
    }
  });
}

/* ---------------- review: fortnightly, wearable in → changes out ---------------- */
function viewReview() {
  const today = S.todayKey(), wk = S.weekStart(today);
  const o = S.getOura()[wk] || {};
  const cur = H.block(today, 0), prev = H.block(today, 1);
  const sum = b => Object.values(b).reduce((a, c) => a + c, 0);
  const F = [{k:'score',l:'Sleep score',u:'/100'},{k:'hrv',l:'Avg HRV',u:'ms'},
             {k:'rhr',l:'Resting HR',u:'bpm'},{k:'hrs',l:'Time asleep',u:'h'}];

  app.innerHTML = `<div class="view">
    <div class="top"><div><h1>Review</h1><div class="sub">Fortnightly — data in, changes out</div></div></div>

    <div class="card pad">
      <div style="font-size:9.5px;letter-spacing:1px;text-transform:uppercase;color:var(--tx-3);
        font-weight:700;margin-bottom:8px">Ring numbers · week of ${wk}</div>
      <div class="hfields">${F.map(f => `<div class="hf" style="--k:var(--sleep)">
        <label>${f.l}<span class="u">${f.u}</span></label>
        <input type="number" inputmode="decimal" placeholder="—"
          value="${o[f.k] != null ? esc(o[f.k]) : ''}" data-oura="${f.k}"></div>`).join('')}</div>
      <p style="font-size:11.5px;color:var(--tx-3);margin-top:10px;line-height:1.5">
        Enter these from the Oura app once a fortnight.
        <b style="color:var(--tx-2)">In the native iOS build this becomes automatic</b> — Oura writes to
        HealthKit, so the app reads sleep, HRV and resting HR without you typing anything. A web page
        cannot call the Oura API, so manual entry is the honest interim.</p>
    </div>

    <div class="sect">
      <div class="sect-h"><h2>This block vs last</h2>
        <span style="font-size:11.5px;color:var(--tx-3)">${sum(cur)} vs ${sum(prev)}</span></div>
      <div class="card">${H.live().filter(i => cur[i.id] || prev[i.id]).map(i => {
        const d = cur[i.id] - prev[i.id];
        return `<div class="adh" style="--k:${H.DOMAINS[i.dom].c}">
          <span style="width:7px;height:7px;border-radius:2px;background:${H.DOMAINS[i.dom].c};flex:none"></span>
          <span class="nm">${esc(i.name)}</span>
          <span class="pc" style="width:auto;color:${d > 0 ? 'var(--ok)' : d < 0 ? 'var(--warn)' : 'var(--tx-3)'}">${d > 0 ? '+' : ''}${d}</span>
          <span class="pc">${cur[i.id]}</span></div>`;
      }).join('') || '<div class="pad" style="color:var(--tx-3);font-size:13px">Nothing logged yet.</div>'}</div>
    </div>

    <div class="sect">
      <div class="sect-h"><h2>What to change</h2></div>
      <div class="card">${H.recommend(today).map(r => `<div class="rec" style="--k:${H.DOMAINS[r.d].c}">
        <span class="bar"></span><span><b>${esc(r.t)}</b><p>${r.p}</p></span></div>`).join('')}</div>
    </div>

    <div class="sect">
      <div class="sect-h"><h2>Settings</h2></div>
      <div class="card">
        <div class="fuel-row">
          <div class="fuel-ico">⚖️</div>
          <div class="fuel-b"><b>Units</b><span>Weights are logged in ${unit()}</span></div>
          <button class="btn sm ghost" style="width:auto;padding:9px 15px" id="unitToggle">${unit()}</button>
        </div>
        <div class="fuel-row">
          <div class="fuel-ico">🔔</div>
          <div class="fuel-b"><b>Rest timer alert</b><span>Beep and vibrate when rest ends</span></div>
          <button class="check ${S.getPrefs().sound ? 'on' : ''}" id="soundToggle">✓</button>
        </div>
        <a class="fuel-row" href="#/fuel" style="text-decoration:none">
          <div class="fuel-ico">🥩</div>
          <div class="fuel-b"><b>Fuel page</b><span>Original protocol, streak and counters</span></div>
          <span class="chev">›</span>
        </a>
      </div>
    </div>

    <div class="sect">
      <div class="sect-h"><h2>Considered and out</h2>
        <span style="font-size:11.5px;color:var(--tx-3)">${H.OUT.length}</span></div>
      <div class="card">${H.OUT.map((o, x) => `<div class="hrow" data-hr="out-${x}" style="--k:var(--warn)">
        <div class="hrow-h">
          <span class="htick" style="border:0;font-size:17px">${o.ico}</span>
          <button class="hrow-b" data-hx="out-${x}"><b>${esc(o.n)}</b><span>${esc(o.v)}</span></button>
          <button class="hexp" data-hx="out-${x}">›</button>
        </div><div class="hrow-d" style="padding-top:12px">${o.s}</div></div>`).join('')}</div>
    </div>

    <div class="hnote"><b>How this works, so you can trust or distrust it.</b> These are transparent rules
      over your own adherence and ring numbers — not a model. Each one names the counts it fired on.
      Change <b>one</b> variable per fortnight or the next block cannot attribute anything.</div>
    <div style="height:20px"></div>
  </div>`;

  wireHealth(today);
  $('#unitToggle').addEventListener('click', () => {
    S.setPrefs({ unit: unit() === 'kg' ? 'lb' : 'kg' }); render();
  });
  $('#soundToggle').addEventListener('click', () => {
    S.setPrefs({ sound: !S.getPrefs().sound }); render();
  });
}

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

    ${healthLogBlocks()}

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
  { re: /^#\/(?:\?.*)?$/,   view: viewHome,  nav: 'home' },
  { re: /^#\/day\/(\w+)$/,  view: m => viewDay(m[1]), nav: 'home' },
  { re: /^#\/split$/,       view: viewSplit, nav: 'split' },
  { re: /^#\/log$/,         view: viewLog,   nav: 'log' },
  { re: /^#\/fuel$/,        view: viewFuel,  nav: 'review' },
  { re: /^#\/review$/,      view: viewReview, nav: 'review' },
  { re: /^#\/buy$/,         view: viewBuy,    nav: 'buy' }
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
  /* Deep link to one row: #/?hx=wake expands and scrolls to that habit. Dīwān links
     here so a task on the hub lands on the exact row it names, not on the page top. */
  const q = hash.split('?')[1];
  const hx = q && new URLSearchParams(q).get('hx');
  if (hx) {
    const b = app.querySelector(`[data-hx="${CSS.escape(hx)}"]`);
    const row = b && b.closest('.hrow');
    if (row) {
      row.classList.add('open', 'lit');
      setTimeout(() => { row.scrollIntoView({ block: 'center' }); }, 60);
      setTimeout(() => row.classList.remove('lit'), 2600);
    }
  }
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
