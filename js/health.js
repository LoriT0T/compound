/* --------------------------------------------------------------
   Health domains — sleep, aerobic, fuel/food, tests.
   Workout lives in app.js and is read from real sessions, so it is
   deliberately absent here: one source of truth per component.
   -------------------------------------------------------------- */
import * as S from './store.js';

export const DOMAINS = {
  sleep:  { label:'Sleep',    c:'var(--sleep)' },
  move:   { label:'Exercise', c:'var(--move)'  },
  workout:{ label:'Workout',  c:'var(--acc)'   },
  fuel:   { label:'Fuel & food', c:'var(--fuel)' },
  test:   { label:'Tests',    c:'var(--test)'  }
};

/* cad: {t:'d'} · {t:'w',n} n×/week · {t:'f'} fortnightly · {t:'m'} · {t:'q'} */
export const ITEMS = [
/* ---------- SLEEP — the numbered levers ---------- */
{ id:'wake', dom:'sleep', cad:{t:'d'}, lever:1, name:'Same wake time', tag:'Lever 01',
  brief:'Including weekends',
  how:'Pick one wake time and hold it every day, weekends included. Log what time you actually got up.',
  why:'Consistency of <b>wake</b> time anchors circadian phase far more reliably than chasing a sleep duration, and irregularity predicts poor outcomes independently of how long you sleep. Highest-return habit in the app, and it costs nothing.',
  fields:[{k:'t', l:'Woke at', t:'time'}] },

{ id:'light', dom:'sleep', cad:{t:'d'}, lever:2, name:'Morning light', tag:'Lever 02',
  brief:'10 min outdoors, early',
  how:'Ten minutes outdoors soon after waking. Overcast still vastly exceeds indoor lux, so weather is not an excuse — but through a window does not count, glass blocks most of it.',
  why:'The strongest zeitgeber you have. Morning light advances circadian phase and tightens melatonin timing that evening. At 52.9°N in winter you have to be deliberate about it.',
  fields:[{k:'m', l:'Minutes', u:'min', t:'number'}] },

{ id:'caff', dom:'sleep', cad:{t:'d'}, lever:3, name:'Caffeine curfew', tag:'Lever 03',
  brief:'8–10 h before bed',
  how:'Last caffeine by early afternoon. Log the time of the final cup.',
  why:'Caffeine’s half-life is roughly 5–6 hours, so a 4pm coffee leaves a meaningful fraction circulating at midnight. It shortens deep sleep <b>even when you fall asleep fine</b> — the cost you cannot feel but the ring can see.',
  fields:[{k:'t', l:'Last caffeine', t:'time'}] },

{ id:'dim', dom:'sleep', cad:{t:'d'}, lever:4, name:'Dim the last hour', tag:'Lever 04',
  brief:'Low light before bed',
  how:'Overhead lights off, screens down or dimmed, for the final hour.',
  why:'Evening light suppresses melatonin and delays phase — the mirror image of what morning light does. Pairs with Lever 02; doing one without the other wastes most of the effect.' },

/* ---------- EXERCISE — aerobic, distinct from the lifting split ---------- */
{ id:'zone2', dom:'move', cad:{t:'w',n:3}, lever:5, name:'Zone 2 base', tag:'150 min/wk',
  brief:'Conversational pace',
  how:'You can speak in full sentences but would rather not. Accumulate it however fits — brisk walking, cycling, the walk to campus if the pace is honest.',
  why:'Builds mitochondrial density and capillarisation: the aerobic foundation VO₂max sits on top of. Volume matters more than intensity here, which is why it is three sessions rather than one hard one.',
  fields:[{k:'m', l:'Minutes', u:'min', t:'number'}, {k:'hr', l:'Avg HR', u:'bpm', t:'number'}] },

{ id:'intervals', dom:'move', cad:{t:'w',n:1}, lever:6, name:'Hard intervals', tag:'4×4',
  brief:'Norwegian protocol',
  how:'Four minutes near maximum, three minutes easy, four rounds. Once a week alongside lifting is enough.',
  why:'This is what actually moves VO₂max — among the strongest predictors of all-cause mortality there is. The Zone 2 base is what makes this session productive rather than merely exhausting.',
  fields:[{k:'r', l:'Rounds', t:'number'}, {k:'hr', l:'Peak HR', u:'bpm', t:'number'}] },

/* ---------- FUEL & FOOD ---------- */
{ id:'multi', dom:'fuel', cad:{t:'d'}, name:'NOW Daily Vits', tag:'1 cap', brief:'Morning, with fat',
  how:'One capsule with a meal containing fat — the A, D, E and K in it are fat-soluble and absorb poorly on an empty stomach.',
  why:'Closes several floors at once at sane doses: <b>iodine 150µg</b> (exactly the RDA, and what fixes the UK gap since Britain never adopted salt iodisation), <b>zinc 10mg</b>, <b>selenium 35µg</b>, <b>B12 18µg</b>. Replaces separate zinc and iodine bottles.',
  trap:'Its vitamin D is ergocalciferol (D2) at 400 IU — wrong form, too little, so it does <b>not</b> replace D3. It also carries 300µg biotin: stop 72h before any blood draw or your TSH reads falsely low.' },

{ id:'d3', dom:'fuel', cad:{t:'d'}, name:'Vitamin D3', tag:'1000–2000 IU', brief:'Same meal as the multi',
  how:'With the same fatty meal. Year-round, not just winter.',
  why:'The one clearly non-negotiable supplement here. Derby is 52.9°N — above 50°N there is <b>zero cutaneous synthesis from October to late March</b> for any skin type. Melanin filters UV, so darker skin needs several times the exposure for the same output.',
  trap:'Do not go to 5,000 or 10,000 IU. The upper limit is 4,000 and you are correcting a floor, not chasing a number.' },

{ id:'omega', dom:'fuel', cad:{t:'d'}, name:'Omega-3 EPA+DHA', tag:'1 softgel', brief:'Skip on fish days',
  how:'One softgel with any meal. Skip it on days you tick oily fish — this is the backstop, not a parallel system.',
  why:'DHA is roughly <b>14% by weight</b> of cortical grey matter fatty acids — not fuel, but what the brain is physically built from. Your body converts plant ALA to DHA at under 1–4%, so flax, chia and walnuts do not substitute.',
  trap:'Your MAV bottle states 1,300mg EPA + 860mg DHA per <b>three-softgel</b> serving. Take one, not three — ~720mg is the right general dose, and it turns a 40-day tub into four months.' },

{ id:'mag', dom:'fuel', cad:{t:'d'}, name:'Magnesium glycinate', tag:'200–300 mg', brief:'Evening',
  how:'Elemental magnesium, evening, roughly an hour before bed.',
  why:'Under 1% of body magnesium is extracellular, so a normal serum result cannot rule deficiency out — you cannot test your way to an answer. Downside is negligible, and if it improves sleep at all it outranks everything else here for cognition.',
  trap:'Skip magnesium <b>L-threonate</b> despite the Huberman recommendation — its evidence is one n=44 trial in adults 50–70 with cognitive complaints, at roughly 3× the cost. Never oxide, which is mostly a laxative.' },

{ id:'brazil', dom:'fuel', cad:{t:'d'}, name:'Brazil nut', tag:'1 nut', brief:'Selenium — food, not a pill',
  how:'One nut, any time.',
  why:'Selenium activates the thyroid hormone this whole project started with — all three deiodinases converting T4 to T3 are selenoproteins. Iodine builds the key; selenium turns it.',
  trap:'<b>One, not three.</b> Content varies up to eight-fold between nuts in one bag, and with the multivitamin’s 35µg you land near 105–125µg against a 255µg EFSA ceiling.' },

{ id:'eggs', dom:'fuel', cad:{t:'d'}, name:'Two whole eggs', tag:'≈300 mg', brief:'Choline — yolks in',
  how:'Two whole eggs, however you like them.',
  why:'Choline scored 6/7 on the deficiency filter and over 90% of people fall below the adequate intake. The placenta actively concentrates it to four times maternal blood levels — evolution pricing its importance.',
  trap:'It is all in the <b>yolk</b>. An egg-white omelette discards the entire point of the egg.' },

{ id:'fish', dom:'fuel', cad:{t:'w',n:2}, name:'Oily fish', tag:'2× week', brief:'Sardines, mackerel, salmon',
  how:'A tin or a fillet. Sardines and mackerel are cheapest and lowest in mercury — small, short-lived fish sit low on the food chain.',
  why:'The food route to EPA and DHA, better than the capsule because it brings protein, selenium, iodine and vitamin D with it. Two servings a week is where most guidelines converge.',
  trap:'Tick this and you can skip the omega-3 softgel that day. Do not double up out of enthusiasm.' },

{ id:'liver', dom:'fuel', cad:{t:'f'}, name:'Liver', tag:'1× fortnight', brief:'Lamb or beef, halal butcher',
  how:'One serving, roughly 100g. Tick it in whichever fortnight you have it.',
  why:'By a distance the most nutrient-dense food here: B12 at roughly 3,000% of the RDA per serving, plus choline, zinc, iron and vitamin A together.',
  trap:'Do <b>not</b> eat it weekly. Its preformed vitamin A is genuinely accumulative — fortnightly is the right ceiling.' },

/* ---------- TESTS ---------- */
{ id:'cooper', dom:'test', cad:{t:'m'}, name:'Cooper test', tag:'Monthly', brief:'12 min — VO₂max proxy',
  how:'How far you cover in 12 minutes. Same route, same conditions, once a month.',
  why:'Measures the outcome directly instead of estimating it from heart rate. Free, and better evidence of aerobic progress than any wearable’s estimate.',
  fields:[{k:'d', l:'Distance', u:'m', t:'number'}] },

{ id:'bloods', dom:'test', cad:{t:'q'}, name:'Blood panel', tag:'Quarterly', brief:'25(OH)D · ferritin · TSH · B12',
  how:'25(OH)D, ferritin + full blood count, TSH + free T4, B12. Roughly £50–90 privately in the UK, cheaper in Kuwait.',
  why:'Four of the five markers have reliable tests — only iodine genuinely does not, which is exactly why iodine gets solved structurally with a capsule and the rest get solved with a number. This turns the stack from speculation into arithmetic.',
  trap:'<b>Stop the multivitamin 72h before.</b> Its biotin skews immunoassays — TSH reads falsely low, free T4 falsely high, mimicking a hyperthyroidism you do not have.',
  fields:[{k:'d',l:'25(OH)D',u:'nmol/L',t:'number'},{k:'fer',l:'Ferritin',u:'µg/L',t:'number'},
          {k:'tsh',l:'TSH',u:'mIU/L',t:'number'},{k:'b12',l:'B12',u:'pmol/L',t:'number'}] },
];

export const byId = id => ITEMS.find(i => i.id === id);
export const live = () => { const off = S.getHOff(); return ITEMS.filter(i => !off[i.id]); };
export const inDomain = d => live().filter(i => i.dom === d);

/* ---- cadence semantics ---- */
export function satisfied(date, i) {
  if (i.cad.t === 'd') { const e = S.getHEntry(date, i.id); return !!(e && e.done); }
  if (i.cad.t === 'w') return S.weekCount(date, i.id) >= i.cad.n;
  if (i.cad.t === 'f') return S.doneInLast(date, i.id, 14) > 0;
  if (i.cad.t === 'm') return S.doneInLast(date, i.id, 30) > 0;
  return S.doneInLast(date, i.id, 90) > 0;
}

/* how many of a domain's items are satisfied on a given date */
export function domainScore(date, dom) {
  const g = inDomain(dom);
  return { n: g.filter(i => satisfied(date, i)).length, t: g.length };
}

/* ---- fortnightly review engine ---- */
export function block(date, n) {
  const out = {};
  live().forEach(i => {
    let hits = 0;
    for (let d = n * 14; d < (n + 1) * 14; d++) {
      const e = S.getHEntry(S.shiftDay(date, -d), i.id);
      if (e && e.done) hits++;
    }
    out[i.id] = hits;
  });
  return out;
}

export function recommend(date) {
  const cur = block(date, 0), prev = block(date, 1);
  const o = S.getOura(), wk = S.weekStart(date);
  const cw = o[wk] || {}, keys = Object.keys(o).sort();
  const pw = keys.length > 1 ? (o[keys[keys.length - 2]] || {}) : {};
  const num = v => (v == null || v === '') ? null : Number(v);
  const recs = [];
  const adh = (id, days) => { const i = byId(id); if (!i) return 0;
    const t = i.cad.t === 'd' ? days : Math.round(days / 7 * (i.cad.n || 1));
    return t ? cur[id] / t : 0; };

  if (adh('wake', 14) < 0.7)
    recs.push({ d:'sleep', t:'Fix Lever 01 before anything else',
      p:`Same wake time logged on ${cur.wake || 0} of the last 14 days. This is the highest-leverage item in the app and the cheapest — nothing else compensates for it.` });
  else {
    const a = num(cw.hrv), b = num(pw.hrv);
    if (a != null && b != null && a < b * 0.92)
      recs.push({ d:'sleep', t:'HRV is falling despite good sleep adherence',
        p:`${b} → ${a} ms. Wake time is consistent, so look at training load instead: consider dropping one interval session this fortnight and holding Zone 2.` });
  }

  const score = num(cw.score);
  if (score != null && score < 75 && adh('caff', 14) < 0.6)
    recs.push({ d:'sleep', t:'Sleep score is low and the caffeine curfew is slipping',
      p:`Score ${score} with the curfew held ${cur.caff || 0}/14 days. Caffeine shortens deep sleep even when you fall asleep fine — this is the cost you cannot feel but the ring can see.` });

  if (cur.fish < 4 && cur.omega < 7)
    recs.push({ d:'fuel', t:'Both omega-3 routes are being missed',
      p:`Fish ${cur.fish}/4 and softgels ${cur.omega}/14. Pick one and make it the default — the capsule exists precisely for the weeks the fish does not happen.` });
  else if (cur.fish >= 4 && cur.omega >= 10)
    recs.push({ d:'fuel', t:'You can drop the softgel on fish days',
      p:`Fish hit ${cur.fish}/4 while softgels ran ${cur.omega}/14. Food first — this saves money with no loss.` });

  if (score != null && num(pw.score) != null) {
    const dd = score - num(pw.score);
    if (Math.abs(dd) >= 5)
      recs.push({ d:'sleep', t:`Sleep score moved ${dd > 0 ? '+' : ''}${dd} this block`,
        p:'Only trust this if you altered one variable. If two things moved, the block tells you nothing and the next one should change only one.' });
  }

  if (adh('zone2', 14) < 0.6)
    recs.push({ d:'move', t:'Zone 2 volume is short',
      p:`${cur.zone2 || 0} sessions in 14 days against a target of 6. Volume, not intensity, is the lever here — a brisk walk counts if the pace is honest.` });

  if (S.doneInLast(date, 'bloods', 90) === 0)
    recs.push({ d:'test', t:'No blood panel in 90 days',
      p:'Everything here is a hypothesis until the panel lands. Stop the multivitamin 72h before the draw.' });

  const up = Object.keys(cur).filter(id => cur[id] > prev[id] + 2).map(id => byId(id)?.name).filter(Boolean);
  if (up.length) recs.push({ d:'fuel', t:'Improved this block', p:up.join(', ') + ' — up meaningfully on the previous fortnight.' });

  if (!recs.length) recs.push({ d:'fuel', t:'Not enough data yet',
    p:'Log for a fortnight and add one set of ring numbers. The engine needs two blocks before it can compare anything.' });
  return recs;
}
