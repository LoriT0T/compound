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
  situ:   { label:'Situational', c:'var(--situ)' },
  test:   { label:'Tests',    c:'var(--test)'  }
};

/* cad: {t:'d'} · {t:'w',n} n×/week · {t:'f'} fortnightly · {t:'m'} · {t:'q'} */
export const ITEMS = [
/* ---------- SLEEP — the numbered levers ---------- */
{ id:'wake', dom:'sleep', cad:{t:'d'}, ico:'⏰', lever:1, name:'Same wake time', tag:'Lever 01',
  brief:'Including weekends',
  how:'Pick one wake time and hold it every day, weekends included. Log what time you actually got up.',
  why:'Consistency of <b>wake</b> time anchors circadian phase far more reliably than chasing a sleep duration, and irregularity predicts poor outcomes independently of how long you sleep. Highest-return habit in the app, and it costs nothing.',
  fields:[{k:'t', l:'Woke at', t:'time'}] },

{ id:'light', dom:'sleep', cad:{t:'d'}, ico:'🌤️', lever:2, name:'Morning light', tag:'Lever 02',
  brief:'10 min outdoors, early',
  how:'Ten minutes outdoors soon after waking. Overcast still vastly exceeds indoor lux, so weather is not an excuse — but through a window does not count, glass blocks most of it.',
  why:'The strongest zeitgeber you have. Morning light advances circadian phase and tightens melatonin timing that evening. At 52.9°N in winter you have to be deliberate about it.',
  fields:[{k:'m', l:'Minutes', u:'min', t:'number'}] },

{ id:'caff', dom:'sleep', cad:{t:'d'}, ico:'⛔', lever:3, name:'Caffeine curfew', tag:'Lever 03',
  brief:'8–10 h before bed',
  how:'Last caffeine by early afternoon. Log the time of the final cup.',
  why:'Caffeine’s half-life is roughly 5–6 hours, so a 4pm coffee leaves a meaningful fraction circulating at midnight. It shortens deep sleep <b>even when you fall asleep fine</b> — the cost you cannot feel but the ring can see.',
  fields:[{k:'t', l:'Last caffeine', t:'time'}] },

{ id:'dim', dom:'sleep', cad:{t:'d'}, ico:'🌘', lever:4, name:'Dim the last hour', tag:'Lever 04',
  brief:'Low light before bed',
  how:'Overhead lights off, screens down or dimmed, for the final hour.',
  why:'Evening light suppresses melatonin and delays phase — the mirror image of what morning light does. Pairs with Lever 02; doing one without the other wastes most of the effect.' },

/* ---------- EXERCISE — aerobic, distinct from the lifting split ---------- */
{ id:'zone2', dom:'move', cad:{t:'w',n:3}, ico:'🚶', lever:5, name:'Zone 2 base', tag:'150 min/wk',
  brief:'Conversational pace',
  how:'You can speak in full sentences but would rather not. Accumulate it however fits — brisk walking, cycling, the walk to campus if the pace is honest.',
  why:'Builds mitochondrial density and capillarisation: the aerobic foundation VO₂max sits on top of. Volume matters more than intensity here, which is why it is three sessions rather than one hard one.',
  fields:[{k:'m', l:'Minutes', u:'min', t:'number'}, {k:'hr', l:'Avg HR', u:'bpm', t:'number'}] },

{ id:'intervals', dom:'move', cad:{t:'w',n:1}, ico:'🔥', lever:6, name:'Hard intervals', tag:'4×4',
  brief:'Norwegian protocol',
  how:'Four minutes near maximum, three minutes easy, four rounds. Once a week alongside lifting is enough.',
  why:'This is what actually moves VO₂max — among the strongest predictors of all-cause mortality there is. The Zone 2 base is what makes this session productive rather than merely exhausting.',
  fields:[{k:'r', l:'Rounds', t:'number'}, {k:'hr', l:'Peak HR', u:'bpm', t:'number'}] },


{ id:'sauna', dom:'move', cad:{t:'w',n:2}, ico:'🧖', name:'Sauna', tag:'2× week',
  brief:'15–20 min, after training',
  how:'15–20 minutes at whatever your gym\u2019s sauna runs at, ideally after lifting rather than before — heat before a session blunts performance. Rehydrate after.',
  why:'One of the very few recovery habits with <b>outcome</b> data rather than biomarker data. In the Kuopio cohort of Finnish men, 4–7 sessions a week was associated with roughly <b>40% lower all-cause mortality</b> and 63% lower sudden cardiac death versus once a week, with a clear dose–response.',
  trap:'Observational — men who sauna frequently are healthier in ways that are hard to fully adjust for, so treat the size of the effect as uncertain even though the direction is well replicated. It is pleasant, cheap and low-risk, which is why it earns a place despite that.<br><br><b>Do not follow it with a cold plunge on a lifting day.</b> Post-exercise cold water immersion attenuates satellite-cell activity and anabolic signalling for up to two days and measurably reduces long-term hypertrophy and strength gains (Roberts 2015; 2024 meta-analysis). Heat is fine. Cold within several hours of lifting costs you the adaptation you just trained for — put it on a rest day or skip it.' },

{ id:'bfr', dom:'move', cad:{t:'w',n:1}, ico:'🩹', name:'BFR set', tag:'Optional',
  brief:'Light load, cuffed — deloads and niggles',
  how:'Cuff or wrap proximal to the working muscle at a moderate, <b>not painful</b> pressure — roughly 40–50% of arterial occlusion. Light load, ~20–30% of 1RM, high reps (e.g. 30/15/15/15), short rests. Arms and legs only, never the torso.',
  why:'Meta-analyses find low-load BFR produces <b>hypertrophy comparable to heavy training</b>, with <b>smaller strength gains</b>. That makes it genuinely useful for the specific cases where heavy loading is the problem: a deload week, training around a joint niggle, or adding volume to a lagging muscle without more joint stress.',
  trap:'It is not a replacement for your heavy work — strength gains are inferior, so the split stays the split. Ignore the enormous growth-hormone percentages attached to BFR online; the hypertrophy finding stands on its own and the hormone spike is not why it works.' },

/* ---------- FUEL & FOOD ---------- */
{ id:'multi', dom:'fuel', cad:{t:'d'}, ico:'💠', when:1, name:'NOW Daily Vits', tag:'1 cap', brief:'Morning, with fat',
  how:'One capsule with a meal containing fat — the A, D, E and K in it are fat-soluble and absorb poorly on an empty stomach.',
  why:'Closes several floors at once at sane doses: <b>iodine 150µg</b> (exactly the RDA, and what fixes the UK gap since Britain never adopted salt iodisation), <b>zinc 10mg</b>, <b>selenium 35µg</b>, <b>B12 18µg</b>. Replaces separate zinc and iodine bottles.',
  trap:'Its vitamin D is ergocalciferol (D2) at 400 IU — wrong form, too little, so it does <b>not</b> replace D3. It also carries 300µg biotin: stop 72h before any blood draw or your TSH reads falsely low.' },

{ id:'d3', dom:'fuel', cad:{t:'d'}, ico:'☀️', when:1, name:'Vitamin D3', tag:'1000–2000 IU', brief:'Same meal as the multi',
  how:'With the same fatty meal. Year-round, not just winter.',
  why:'The one clearly non-negotiable supplement here. Derby is 52.9°N — above 50°N there is <b>zero cutaneous synthesis from October to late March</b> for any skin type. Melanin filters UV, so darker skin needs several times the exposure for the same output.',
  trap:'Do not go to 5,000 or 10,000 IU. The upper limit is 4,000 and you are correcting a floor, not chasing a number.' },

{ id:'omega', dom:'fuel', cad:{t:'d'}, ico:'💧', when:2, name:'Omega-3', tag:'1 softgel', brief:'Skip on fish days',
  how:'One softgel with any meal. Skip it on days you tick oily fish — this is the backstop, not a parallel system.',
  why:'DHA is roughly <b>14% by weight</b> of cortical grey matter fatty acids — not fuel, but what the brain is physically built from. Your body converts plant ALA to DHA at under 1–4%, so flax, chia and walnuts do not substitute.',
  trap:'Your MAV bottle states 1,300mg EPA + 860mg DHA per <b>three-softgel</b> serving. Take one, not three — ~720mg is the right general dose, and it turns a 40-day tub into four months.' },

{ id:'mag', dom:'fuel', cad:{t:'d'}, ico:'🌙', when:4, name:'Magnesium glycinate', tag:'200–300 mg', brief:'Evening',
  how:'Elemental magnesium, evening, roughly an hour before bed.',
  why:'Under 1% of body magnesium is extracellular, so a normal serum result cannot rule deficiency out — you cannot test your way to an answer. Downside is negligible, and if it improves sleep at all it outranks everything else here for cognition.',
  trap:'Skip magnesium <b>L-threonate</b> despite the Huberman recommendation — its evidence is one n=44 trial in adults 50–70 with cognitive complaints, at roughly 3× the cost. Never oxide, which is mostly a laxative.' },

{ id:'brazil', dom:'fuel', cad:{t:'d'}, ico:'🌰', when:2, name:'Brazil nut', tag:'1 nut', brief:'Selenium — food, not a pill',
  how:'One nut, any time.',
  why:'Selenium activates the thyroid hormone this whole project started with — all three deiodinases converting T4 to T3 are selenoproteins. Iodine builds the key; selenium turns it.',
  trap:'<b>One, not three.</b> Content varies up to eight-fold between nuts in one bag, and with the multivitamin’s 35µg you land near 105–125µg against a 255µg EFSA ceiling.' },

{ id:'eggs', dom:'fuel', cad:{t:'d'}, ico:'🥚', when:1, name:'Two whole eggs', tag:'≈300 mg', brief:'Choline — yolks in',
  how:'Two whole eggs, however you like them.',
  why:'Choline scored 6/7 on the deficiency filter and over 90% of people fall below the adequate intake. The placenta actively concentrates it to four times maternal blood levels — evolution pricing its importance.',
  trap:'It is all in the <b>yolk</b>. An egg-white omelette discards the entire point of the egg.' },

{ id:'fish', dom:'fuel', cad:{t:'w',n:2}, ico:'🐟', when:3, name:'Oily fish', tag:'2× week', brief:'Sardines, mackerel, salmon',
  how:'A tin or a fillet. Sardines and mackerel are cheapest and lowest in mercury — small, short-lived fish sit low on the food chain.',
  why:'The food route to EPA and DHA, better than the capsule because it brings protein, selenium, iodine and vitamin D with it. Two servings a week is where most guidelines converge.',
  trap:'Tick this and you can skip the omega-3 softgel that day. Do not double up out of enthusiasm.' },

{ id:'liver', dom:'fuel', cad:{t:'f'}, ico:'🍖', when:3, name:'Liver', tag:'1× fortnight', brief:'Lamb or beef, halal butcher',
  how:'One serving, roughly 100g. Tick it in whichever fortnight you have it.',
  why:'By a distance the most nutrient-dense food here: B12 at roughly 3,000% of the RDA per serving, plus choline, zinc, iron and vitamin A together.',
  trap:'Do <b>not</b> eat it weekly. Its preformed vitamin A is genuinely accumulative — fortnightly is the right ceiling.' },


{ id:'fibre', dom:'fuel', cad:{t:'d'}, ico:'🌾', when:3, name:'Fibre', tag:'30 g', brief:'The most under-rated lever here',
  how:'Across the day — oats, beans, lentils, whole fruit, vegetables with skins. Log grams if you are tracking.',
  why:'The Lancet series covering nearly 40 years of trials and cohorts found a <b>15–30% lower all-cause and cardiovascular mortality</b> at the highest fibre intakes versus the lowest, with benefit greatest between 25 and 30 g a day. That is a larger, better-evidenced effect than anything else you swallow — and almost nobody counts it.',
  trap:'Ramp up slowly and drink water, or the first week is unpleasant. Fibre supplements are a distant second to food.',
  fields:[{k:'g', l:'Fibre', u:'g', t:'number'}] },

/* ---------- SITUATIONAL — taken for a reason, not daily ---------- */
{ id:'caffthe', dom:'situ', cad:{t:'d'}, ico:'☕', name:'Caffeine + L-theanine', tag:'100 + 200 mg', brief:'Study block, exams',
  how:'Roughly 100 mg caffeine with 200 mg L-theanine, 30–45 minutes before the work. Trials have used ratios from 40+97 up to 160+200 mg. Green tea contains both, just not at these doses.',
  why:'The best-evidenced acute stack that exists, and the cheapest. A meta-analysis of ten acute RCTs found the combination improved alertness and attention-switching accuracy, and a 2025 crossover trial found the high-dose combination improved selective attention in <b>acutely sleep-deprived young adults</b> — which is you in exam season. Theanine blunts the jitter and blood-pressure bump caffeine gives alone.',
  trap:'It still counts against Lever 03. A 4pm study block with caffeine buys you the evening and charges the night — this is the single easiest way to accidentally sabotage your best lever.' },

{ id:'tyrosine', dom:'situ', cad:{t:'d'}, ico:'🧠', name:'L-Tyrosine', tag:'≈2 g', brief:'Only under load or short sleep',
  how:'15–60 minutes before a demanding block. Trials mostly use 150 mg/kg, which for you is around 11 g — far above what people actually take. Practically, 1–2 g is the common self-dose; be aware that is well below the studied dose.',
  why:'The precursor to dopamine and noradrenaline, which get depleted under acute stress, multitasking and sleep loss. Supplementation restores them — 150 mg/kg attenuated the cognitive decline caused by sleep deprivation.',
  trap:'<b>It does nothing at baseline.</b> This is the cleanest example of a situational compound in the app: rested and unstressed, it is inert. Save it for genuine crunch, or it is money burnt.' },

{ id:'gpc', dom:'situ', cad:{t:'d'}, ico:'🧩', name:'Alpha-GPC', tag:'300 mg', brief:'Pre-exam only — never daily',
  how:'300 mg an hour before. Occasional use only.',
  why:'A bioavailable choline donor that crosses the blood–brain barrier and feeds acetylcholine synthesis. Real target, real delivery, single defined molecule — the most defensible nootropic on your original list.',
  trap:'A South Korean cohort of 12 million+ aged 50+ found alpha-GPC associated with a dose-responsive <b>46% higher 10-year stroke risk</b>. Observational and confounded by indication — it is prescribed there for cognitive decline — but two eggs feed the same pathway with no such question attached.' },

{ id:'tongkat', dom:'situ', cad:{t:'d'}, ico:'🌿', name:'Tongkat ali', tag:'200 mg', brief:'Your call — done properly',
  how:'<b>200 mg a day of a standardised extract, in the morning.</b> Insist on <b>Physta® or LJ100®</b>, or an extract stating ~2% eurycomanone / ~22% quassinoids, third-party tested for heavy metals. Trials run 12 weeks; cycle off after.',
  why:'You asked for it directly, so here is the honest version rather than another refusal. Of the botanicals you named it has the most human RCT data: standardised 200 mg raised total testosterone, <b>lowered cortisol</b>, and increased muscle strength at 12 weeks. Effects concentrate in men who are stressed or low to begin with.',
  trap:'The 200:1 product you had is <b>not</b> standardised — an extraction ratio says nothing about eurycomanone content, and cheap unstandardised tongkat has been found contaminated with <b>mercury</b>. If you take it, this is the part that actually matters. Expect little if your testosterone is already normal.' },


{ id:'boron', dom:'situ', cad:{t:'d'}, ico:'🪨', name:'Boron', tag:'6 mg', brief:'The one honest experiment',
  how:'6 mg a day, morning, with food. If you run it, run it as a proper block — one variable, fourteen days, nothing else changed — and read the result on the Review page rather than on how you feel.',
  why:'Included because it is the only claim from the hormone video that survived scrutiny as genuinely <b>open</b> rather than true or false. A small trial found free testosterone up <b>28.3%</b> after seven days at 6 mg. Cheap, widely available, and no meaningful toxicity at this dose.',
  trap:'Read the caveat properly: the <b>SHBG mechanism usually credited for it did not reach significance</b> in that trial, and a separate 10 mg four-week study found a non-significant 11.4%. So this is one small positive result and one null. Expect nothing — that is the point of running it as an experiment rather than adding it as a belief.' },

/* ---------- TESTS ---------- */
{ id:'bp', dom:'test', cad:{t:'m'}, ico:'❤️', name:'Blood pressure', tag:'Monthly', brief:'A £25 cuff, 2 min',
  how:'Seated, feet flat, arm at heart height, after five minutes of quiet. Take two readings a minute apart and log the second.',
  why:'One of the strongest modifiable predictors of long-run outcomes there is, and almost nobody establishes a baseline in their twenties — which is exactly when a trend becomes informative. It is also the cheapest number on this page to collect.',
  fields:[{k:'sys', l:'Systolic', u:'mmHg', t:'number'}, {k:'dia', l:'Diastolic', u:'mmHg', t:'number'}] },

{ id:'cooper', dom:'test', cad:{t:'m'}, ico:'🏃', name:'Cooper test', tag:'Monthly', brief:'12 min — VO₂max proxy',
  how:'How far you cover in 12 minutes. Same route, same conditions, once a month.',
  why:'Measures the outcome directly instead of estimating it from heart rate. Free, and better evidence of aerobic progress than any wearable’s estimate.',
  fields:[{k:'d', l:'Distance', u:'m', t:'number'}] },

{ id:'bloods', dom:'test', cad:{t:'q'}, ico:'🩸', name:'Blood panel', tag:'Quarterly', brief:'25(OH)D · ferritin · TSH · B12',
  how:'25(OH)D, ferritin + full blood count, TSH + free T4, B12. Roughly £50–90 privately in the UK, cheaper in Kuwait.',
  why:'Four of the five markers have reliable tests — only iodine genuinely does not, which is exactly why iodine gets solved structurally with a capsule and the rest get solved with a number. This turns the stack from speculation into arithmetic.',
  trap:'<b>Stop the multivitamin 72h before.</b> Its biotin skews immunoassays — TSH reads falsely low, free T4 falsely high, mimicking a hyperthyroidism you do not have.',
  fields:[{k:'d',l:'25(OH)D',u:'nmol/L',t:'number'},{k:'fer',l:'Ferritin',u:'µg/L',t:'number'},
          {k:'tsh',l:'TSH',u:'mIU/L',t:'number'},{k:'b12',l:'B12',u:'pmol/L',t:'number'}] },
];

export const byId = id => ITEMS.find(i => i.id === id);
export const live = () => { const off = S.getHOff(); return ITEMS.filter(i => !off[i.id]); };
export const inDomain = d => {
  const g = live().filter(i => i.dom === d);
  /* Fuel & food reads in the order you actually take it through the day. */
  return d === 'fuel' ? g.sort((a, b) => (a.when || 9) - (b.when || 9)) : g;
};

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

/* Considered and deliberately not in the stack. Kept visible: a stack is
   defined as much by what you keep out, and the reasoning has to survive. */
export const OUT = [
{ n:'Anything sold on a hormone percentage', ico:'📈', v:'The category, not one compound',
  s:`<p>Keep this one as a filter rather than a verdict on a single product. A claim shaped like <b>"X raises hormone Y by Z%"</b> is a statement about a measurement, not about you.</p>
  <p>The assumption underneath it — spike an anabolic hormone, grow more muscle — has been tested directly. Train under conditions producing a large post-exercise testosterone, growth hormone and IGF-1 response versus almost none, then measure actual hypertrophy: <b>the spikes are unrelated to muscle protein synthesis or to growth.</b> A 2024 review in <i>Exercise and Sport Sciences Reviews</i> is titled "Hormones, Hypertrophy, and Hype".</p>
  <p>The reason is arithmetic. Those spikes last around <b>thirty minutes</b>. Muscle protein synthesis stays elevated for a day or more. A half-hour blip does not drive a two-day process — mechanical tension and local signalling do.</p>
  <p><b>The distinction that matters:</b> a 30-minute spike and a chronically low baseline are not the same currency. Being genuinely deficient in iodine, vitamin D or sleep is a real problem worth fixing. Nudging an already-adequate signal for half an hour is not. Ask what happened to the <i>person</i> — muscle, strength, cognition, mortality — and most of the supplement industry goes quiet.</p>` },

{ n:'Cold plunge after lifting', ico:'🧊', v:'Actively costs you the session',
  s:`<p>Not a timing quibble — a real penalty. Post-exercise cold water immersion <b>attenuates satellite-cell activity and anabolic signalling for up to two days</b>, and reduces long-term gains in both muscle mass and strength (Roberts 2015, <i>J Physiol</i>). A 2024 meta-analysis, "Throwing cold water on muscle growth", confirms the hypertrophy penalty.</p>
  <p>Cold exposure is not forbidden — put it on a rest day, or several hours clear of lifting. <b>Heat after training is fine; cold is not.</b> This is the single item from the hormone video that would have cost you something real had you followed it as written.</p>` },

{ n:'Fenugreek', ico:'🌾', v:'Fails on meta-analysis',
  s:`<p>Sold hard as a natural aromatase blocker that "doubles free testosterone". A 2026 systematic review and meta-analysis of randomised placebo-controlled trials concludes the evidence <b>does not support</b> reliable or clinically meaningful increases in testosterone, and free testosterone shows no stable benefit.</p>
  <p>Individual trials do report positives, which is exactly why the meta-analysis is the thing to read rather than the trial someone quotes at you.</p>` },

{ n:'Melatonin, nightly', ico:'🌗', v:'A hormone, for a goal that does not exist',
  s:`<p>Recommended by both the hormone video and the popular sleep stacks, usually to amplify the overnight growth hormone pulse. That endpoint is already disposed of above — the GH pulse is not what builds muscle.</p>
  <p>What remains is that melatonin is <b>a hormone, not a supplement in the casual sense</b>, and taking one nightly at 25 with a working circadian system is an uncontrolled intervention on the thing you are trying to stabilise. Its genuine use is narrow: jet lag and shifted sleep phase, short-term, at low doses.</p>
  <p>If sleep onset is the actual problem, Levers 01–04 come first and cost nothing, and L-theanine sits in Situational with better evidence for that specific job.</p>` },

{ n:'Nicotine', ico:'🚬', v:'It works. That is not the argument.',
  s:`<p><b>Your experience is real, not placebo.</b> A meta-analysis of 41 double-blind placebo-controlled trials found effect sizes of <b>0.16–0.44</b> for attention and memory — the authors called this "not as subtle as previously thought". A separate transdermal meta-analysis found attention improved significantly (SMD 0.231). Nicotine is genuinely one of the best-evidenced acute cognitive enhancers that exists, via α4β2 and α7 nicotinic receptors. I am not going to pretend otherwise.</p>
  <p><b>The problem is the price, and it is charged in the one currency you cannot afford.</b> Nicotine reduces slow-wave sleep, lengthens sleep latency, fragments sleep and lowers sleep efficiency. Lever 01 sits at the top of this app because sleep is your highest-return input — and nicotine buys you a medium attention effect during the day by degrading exactly that at night. It borrows from tomorrow.</p>
  <p><b>And it is engineered to keep you.</b> Half-life of 1–2 hours with rapid CNS onset, which the pharmacology literature describes as "an optimal environment for the development of nicotine dependence". Addiction liability is rated <b>very high</b> psychologically. That is not a moral point, it is a design fact: short half-life plus fast onset is the shape of a compound you end up needing rather than choosing.</p>
  <p><b>Cigars are the worst available delivery.</b> Combustion, and cigar-specific oral, pharyngeal, laryngeal and oesophageal cancer risk that applies <i>even without inhaling</i>. Whatever the verdict on the molecule, burning it is a separate and larger harm.</p>
  <p>One factual note rather than a lecture, because you have told me the frame matters to you: contemporary mainstream scholarship, including in Saudi, generally rules smoking impermissible on harm grounds. That is your call to weigh, not mine.</p>
  <p><b>If you decide to use it regardless:</b> never combusted, never within eight hours of sleep, and never daily — because daily is where the choosing stops. Caffeine + L-theanine in the Situational section gets you a comparable acute attention effect with no dependence liability worth the name.</p>` },

{ n:'Ashwagandha', ico:'🌱', v:'Scores well and is still out',
  s:`<p>It scores <b>4.0/6</b> — better than lion's mane. Real target, real standardisation, real RCTs for anxiety. So this is not about weak evidence.</p><p>Denmark banned it in food supplements in 2023, German and Swedish regulators concurred, and the Dutch RIVM cited liver injury, thyrotoxicosis and adrenal suppression. Three EU regulators acting on one botanical is not normal.</p><p>And its main effect is lowering cortisol — but <b>cortisol is a signal, not a toxin</b>. Blunting the gauge is not reducing the load. It is also thyroid-active, which fights any attempt to get a clean baseline TSH.</p>` },

{ n:'Rhodiola rosea', ico:'🌺', v:'Fails at the shelf, not the mechanism',
  s:`<p>In a European analysis of 40 commercial products, <b>23% contained no rosavin at all</b>, seven were adulterated with other species, and two contained no Rhodiola whatsoever. No RCT was adequately reported against CONSORT, and one nursing-student trial found results <b>favouring placebo</b>.</p>` },

{ n:'Apigenin', ico:'🌼', v:'The dose was never tested',
  s:`<p>The GABA-A mechanism is real. But <b>no human trial has tested isolated apigenin at 50 mg for sleep</b> — the human evidence is entirely chamomile extract. The popular number is extrapolated, not measured.</p>` },

{ n:"Lion's mane", ico:'🍄', v:'Cannot verify the active',
  s:`<p>Hericenones sit in the fruiting body, erinacines in the mycelium, and essentially no commercial product quantifies either. Most are mycelium grown on grain — largely starch. Even granting the mechanism, you cannot know your capsule contains any active at all.</p>` },

{ n:'NAD+ / NMN', ico:'🧬', v:'Cannot be absorbed intact',
  s:`<p>NAD+ is ~663 daltons and doubly charged — it does not cross the intestinal wall, and hydrolyses to nicotinamide. You are buying expensive B3, and the TMG on the label is the tell. Even absorbed NR and NMN raise the biomarker while meta-analysis finds clinical outcomes unchanged.</p>` },

{ n:'Bacopa monnieri', ico:'🪴', v:'Genuinely mixed — not a no, not a yes',
  s:`<p>Included for completeness because it nearly made the list. 300 mg standardised to ~90 mg bacosides for 12 weeks improved memory measures in several RCTs — but a 101-person trial found <b>no</b> greater cognitive improvement than placebo, with only stress and fatigue effects surviving. The consistent finding across studies is stress reduction, not memory.</p><p>It is slow (12 weeks minimum), so it is the opposite of situational. If you want one chronic botanical to test properly, this is the one I would pick — one variable, one fortnightly block, and be honest about the readout.</p>` },

{ n:'Iron, unprompted', ico:'🩹', v:'The one active harm risk',
  s:`<p>Adult men have no route to excrete iron and accumulate it across life; free iron is a potent oxidant. Unlike iodine it is properly testable — so measure ferritin, never guess.</p>` },
];
