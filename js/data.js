/* ---------------------------------------------------------------
   PUSH/PULL — exercise library + split definition
   Cycle 0 is Musaed's original split, verbatim from the note.
   --------------------------------------------------------------- */

export const LIB = {
  /* ---- horizontal press (heavy) ---- */
  'bench-barbell':      { name:'Flat Barbell Bench Press', img:'bench-barbell.jpg', tags:['Chest','Front delts','Triceps'], cue:'Shoulder blades pinned, bar to lower chest, drive feet into floor.' },
  'bench-db':           { name:'Flat Dumbbell Bench Press', tags:['Chest','Front delts','Triceps'], cue:'Slight arch, dumbbells travel in an arc, stop just short of lockout.' },
  'machine-chest-press':{ name:'Machine Chest Press', tags:['Chest','Front delts','Triceps'], cue:'Set seat so handles sit at mid-chest. Squeeze one second at the front.' },
  'smith-bench':        { name:'Smith Machine Bench Press', tags:['Chest','Front delts','Triceps'], cue:'Bar path fixed — control the eccentric, no bouncing off the chest.' },

  /* ---- squat pattern ---- */
  'squat-barbell':      { name:'Barbell Back Squat', img:'squat-barbell.jpg', tags:['Quads','Glutes','Adductors'], cue:'Brace hard, break at hips and knees together, sit between the hips.' },
  'squat-front':        { name:'Front Squat', tags:['Quads','Glutes','Upper back'], cue:'Elbows high, stay upright, knees track over the toes.' },
  'hack-squat':         { name:'Hack Squat', tags:['Quads','Glutes'], cue:'Feet mid-platform, full depth, no knee lockout at the top.' },
  'bulgarian-split':    { name:'Bulgarian Split Squat', tags:['Quads','Glutes','Adductors'], cue:'Front shin vertical for quads, torso leaned for glutes. Same each week.' },

  /* ---- vertical press ---- */
  'shoulder-press-db':  { name:'Seated Dumbbell Shoulder Press', img:'shoulder-press-db.jpg', tags:['Front delts','Side delts','Triceps'], cue:'Back flat on the pad, press up and slightly in, no lower-back arch.' },
  'ohp-barbell':        { name:'Standing Overhead Press', tags:['Front delts','Side delts','Triceps'], cue:'Glutes and abs tight, bar past the chin, head through at the top.' },
  'press-seated-bb':    { name:'Seated Barbell Press', tags:['Front delts','Side delts','Triceps'], cue:'Bar to chin height, drive straight up, ribs down.' },
  'arnold-press':       { name:'Arnold Press', tags:['Front delts','Side delts','Triceps'], cue:'Rotate as you press, control the rotation on the way back down.' },

  /* ---- triceps: long head ---- */
  'tricep-overhead':    { name:'Overhead Tricep Press', img:'tricep-overhead.jpg', tags:['Triceps (long head)'], cue:'Elbows tight and pointed forward, full stretch at the bottom.' },
  'tricep-oh-cable':    { name:'Overhead Cable Extension', tags:['Triceps (long head)'], cue:'Lean into it, keep constant tension, elbows still.' },
  'skull-crusher':      { name:'Skull Crusher', tags:['Triceps (long head)'], cue:'Lower behind the forehead, upper arms angled back slightly.' },
  'jm-press':           { name:'JM Press', tags:['Triceps (long head)'], cue:'Half bench press, half skull crusher — bar to the throat, elbows tucked.' },

  /* ---- triceps: lateral head ---- */
  'tricep-pushdown':    { name:'Cable Tricep Pushdown', img:'tricep-pushdown.jpg', tags:['Triceps (lateral head)'], cue:'Elbows pinned to the ribs, full lockout, slow return.' },
  'rope-pushdown':      { name:'Rope Pushdown', tags:['Triceps (lateral head)'], cue:'Split the rope at the bottom, pause one second.' },
  'reverse-pushdown':   { name:'Reverse-Grip Pushdown', tags:['Triceps (lateral head)'], cue:'Underhand grip, one arm at a time if the wrist complains.' },
  'tricep-kickback':    { name:'Dumbbell Kickback', tags:['Triceps (lateral head)'], cue:'Upper arm parallel to the floor and frozen there. Light weight.' },

  /* ---- side delts ---- */
  'lateral-raise-db':   { name:'Lateral Raises', img:'lateral-raise-db.jpg', tags:['Side delts'], cue:'Lead with the elbows, stop at shoulder height, no swinging.' },
  'lateral-raise-cable':{ name:'Cable Lateral Raise', tags:['Side delts'], cue:'Cable behind the body, tension from the very bottom.' },
  'lateral-raise-mach': { name:'Machine Lateral Raise', tags:['Side delts'], cue:'Pads on the forearms not the hands. Push out, not up.' },
  'lateral-raise-lean': { name:'Leaning Lateral Raise', tags:['Side delts'], cue:'Hang off an upright, lean away — huge stretch at the bottom.' },

  /* ---- calves: standing / bent knee ---- */
  'calf-standing':      { name:'Standing Calf Raise', img:'calf-standing.jpg', tags:['Gastrocnemius'], cue:'Full stretch at the bottom, two-second squeeze at the top.' },
  'calf-smith':         { name:'Smith Machine Calf Raise', tags:['Gastrocnemius'], cue:'Balls of the feet on a plate, dead-slow eccentric.' },
  'calf-leg-press':     { name:'Leg Press Calf Raise', tags:['Gastrocnemius'], cue:'Legs almost straight, push through the big toe.' },
  'calf-single':        { name:'Single-Leg Calf Raise', tags:['Gastrocnemius'], cue:'Hold something for balance, match reps side to side.' },
  'calf-seated':        { name:'Seated Calf Raise', img:'calf-seated.jpg', tags:['Soleus'], cue:'Bent knee targets soleus. Slow, full range, no bouncing.' },
  'calf-seated-mach':   { name:'Seated Machine Calf Raise', tags:['Soleus'], cue:'Pause two seconds stretched at the bottom.' },
  'calf-donkey':        { name:'Donkey Calf Raise', tags:['Soleus','Gastrocnemius'], cue:'Hinge at the hips, load the hips, full range.' },
  'calf-tibialis':      { name:'Bent-Knee Calf Raise', tags:['Soleus'], cue:'Knee bent to ~90°, drive through the ball of the foot.' },

  /* ---- abs: hip flexion ---- */
  'hanging-leg-raise':  { name:'Hanging Leg Raises', img:'hanging-leg-raise.jpg', tags:['Lower abs','Hip flexors'], cue:'Curl the pelvis up — do not just swing the legs.' },
  'hanging-knee-raise': { name:'Hanging Knee Raise', tags:['Lower abs','Hip flexors'], cue:'Knees to chest, controlled on the way down.' },
  'captains-chair':     { name:"Captain's Chair Leg Raise", tags:['Lower abs','Hip flexors'], cue:'Back flat against the pad, no momentum.' },
  'reverse-crunch':     { name:'Reverse Crunch', tags:['Lower abs'], cue:'Lift the hips off the floor at the top.' },

  /* ---- abs: spinal flexion loaded ---- */
  'machine-crunch':     { name:'Machine Crunch', img:'machine-crunch.jpg', tags:['Rectus abdominis'], cue:'Round the spine, chest to pelvis. Not a hip hinge.' },
  'cable-crunch':       { name:'Cable Crunch', tags:['Rectus abdominis'], cue:'Hips fixed, crunch the ribs down toward the knees.' },
  'decline-crunch':     { name:'Weighted Decline Crunch', tags:['Rectus abdominis'], cue:'Plate on the chest, short controlled range.' },
  'weighted-situp':     { name:'Weighted Sit-Up', tags:['Rectus abdominis','Hip flexors'], cue:'Feet anchored, roll up one vertebra at a time.' },

  /* ---- abs: anti-extension ---- */
  'ab-wheel':           { name:'Ab Wheel Rollout', img:'ab-wheel.jpg', tags:['Rectus abdominis','Lats'], cue:'Ribs down, tuck the pelvis, never let the lower back arch.' },
  'barbell-rollout':    { name:'Barbell Rollout', tags:['Rectus abdominis','Lats'], cue:'Same as the wheel, slightly more forgiving path.' },
  'plank-weighted':     { name:'Weighted Plank', tags:['Rectus abdominis'], cue:'Plate on the upper back, squeeze glutes, hold for time.' },
  'body-saw':           { name:'Body Saw', tags:['Rectus abdominis'], cue:'Forearm plank, slide the body back and forward on sliders.' },

  /* ---- abs: anti-rotation ---- */
  'pallof-press':       { name:'Pallof Press', img:'pallof-press.svg', tags:['Obliques','Deep core'], cue:'Stand side-on, press straight out, refuse to let the cable twist you.' },
  'cable-woodchop':     { name:'Cable Woodchop', tags:['Obliques','Deep core'], cue:'Rotate from the ribcage, hips stay quiet.' },
  'pallof-kneeling':    { name:'Half-Kneeling Pallof Press', tags:['Obliques','Deep core'], cue:'Inside knee down, squeeze the glute, then press.' },
  'suitcase-carry':     { name:'Suitcase Carry', tags:['Obliques','Grip'], cue:'One heavy dumbbell, stay perfectly upright, walk for distance.' },

  /* ---- hinge: heavy ---- */
  'deadlift':           { name:'Deadlift', img:'deadlift.jpg', tags:['Hamstrings','Glutes','Erectors','Traps'], cue:'Bar over mid-foot, lats tight, push the floor away. Reset every rep.' },
  'trap-bar-dl':        { name:'Trap Bar Deadlift', tags:['Hamstrings','Glutes','Quads'], cue:'More upright, easier on the lower back. Same brace.' },
  'deficit-dl':         { name:'Deficit Deadlift', tags:['Hamstrings','Glutes','Erectors'], cue:'Stand on a 2–3 cm plate. Drop the weight, own the position.' },
  'rack-pull':          { name:'Rack Pull', tags:['Glutes','Erectors','Traps'], cue:'Just below the knee, heavy, no hitching.' },

  /* ---- hinge: RDL ---- */
  'rdl':                { name:'Romanian Deadlift', img:'rdl.jpg', tags:['Hamstrings','Glutes'], cue:'Push the hips back, soft knees, stop when the stretch runs out.' },
  'rdl-db':             { name:'Dumbbell RDL', tags:['Hamstrings','Glutes'], cue:'Dumbbells graze the legs, chest proud throughout.' },
  'stiff-leg-dl':       { name:'Stiff-Leg Deadlift', tags:['Hamstrings','Glutes'], cue:'Straighter knees than an RDL — go lighter than you think.' },
  'good-morning':       { name:'Good Morning', tags:['Hamstrings','Erectors','Glutes'], cue:'Bar high on the back, hinge to parallel, brace hard.' },

  /* ---- vertical pull: loaded ---- */
  'pullup-weighted':    { name:'Weighted Pull Ups', img:'pullup-weighted.jpg', tags:['Lats','Upper back','Biceps'], cue:'Chest to the bar, dead hang each rep, no kipping.' },
  'chinup-weighted':    { name:'Weighted Chin-Up', tags:['Lats','Biceps'], cue:'Supinated grip, more biceps. Elbows down and back.' },
  'pullup-neutral':     { name:'Neutral-Grip Weighted Pull-Up', tags:['Lats','Upper back','Biceps'], cue:'Easiest on the shoulders. Full range.' },
  'pullup-assisted':    { name:'Assisted Pull-Up', tags:['Lats','Upper back','Biceps'], cue:'Use the machine or a band — keep the reps honest.' },

  /* ---- vertical pull: pulldown ---- */
  'lat-pulldown-close': { name:'Close Grip Lat Pulldown', img:'lat-pulldown-close.jpg', tags:['Lats','Biceps'], cue:'Chest up, drive the elbows down to the ribs.' },
  'lat-pulldown-wide':  { name:'Wide-Grip Lat Pulldown', tags:['Lats','Upper back'], cue:'Wider grip, bar to the collarbone, no leaning back.' },
  'pulldown-neutral':   { name:'Neutral-Grip Pulldown', tags:['Lats','Biceps'], cue:'V-handle, pull to the sternum, big stretch at the top.' },
  'straight-arm-pd':    { name:'Straight-Arm Pulldown', tags:['Lats'], cue:'Arms locked, hinge slightly, pure lat isolation.' },

  /* ---- horizontal pull: chest supported ---- */
  'row-chest-supported-db':{ name:'Chest-Supported Dumbbell Row', img:'row-chest-supported-db.jpg', tags:['Mid back','Lats','Rear delts'], cue:'Chest glued to the pad, row to the hips, squeeze the blades.' },
  'row-pendlay':        { name:'Barbell Row (Pendlay)', tags:['Mid back','Lats'], cue:'Torso parallel, bar from the floor each rep, explosive.' },
  'row-tbar':           { name:'T-Bar Row', tags:['Mid back','Lats'], cue:'Neutral grip, elbows at 45°, controlled negative.' },
  'row-machine-chest':  { name:'Chest-Supported Machine Row', tags:['Mid back','Lats','Rear delts'], cue:'Set the chest pad so arms extend fully. Pause at the back.' },

  /* ---- horizontal pull: cable ---- */
  'cable-row-seated':   { name:'Seated Cable Row', img:'cable-row-seated.jpg', tags:['Mid back','Lats','Biceps'], cue:'Full stretch forward, torso still, pull to the navel.' },
  'cable-row-1arm':     { name:'Single-Arm Cable Row', tags:['Mid back','Lats'], cue:'Let the shoulder travel forward at the stretch, then pull.' },
  'row-machine':        { name:'Machine Row', tags:['Mid back','Lats'], cue:'Chest against the pad, elbows past the torso.' },
  'inverted-row':       { name:'Inverted Row', tags:['Mid back','Rear delts'], cue:'Body rigid, chest to the bar, feet elevated to make it harder.' },

  /* ---- biceps: barbell ---- */
  'curl-barbell':       { name:'Barbell Curl', img:'curl-barbell.jpg', tags:['Biceps','Brachialis'], cue:'Elbows still at the sides, no hip swing, full lockout at the bottom.' },
  'curl-ez':            { name:'EZ-Bar Curl', tags:['Biceps','Brachialis'], cue:'Kinder on the wrists. Same strict form.' },
  'curl-preacher':      { name:'Preacher Curl', tags:['Biceps (short head)'], cue:'Armpits into the pad, controlled at the stretched bottom.' },
  'curl-cable':         { name:'Cable Curl', tags:['Biceps'], cue:'Constant tension top to bottom, one-second squeeze.' },

  /* ---- biceps: dumbbell ---- */
  'curl-db':            { name:'Dumbbell Curl', img:'curl-db.jpg', tags:['Biceps','Brachialis'], cue:'Supinate as you curl, squeeze at the top, slow negative.' },
  'curl-incline-db':    { name:'Incline Dumbbell Curl', tags:['Biceps (long head)'], cue:'Bench at 45–60°, arms hang behind the body for the stretch.' },
  'curl-hammer':        { name:'Hammer Curl', tags:['Brachialis','Brachioradialis'], cue:'Neutral grip throughout, builds arm thickness.' },
  'curl-concentration': { name:'Concentration Curl', tags:['Biceps (short head)'], cue:'Elbow braced on the inner thigh, peak contraction focus.' },

  /* ---- rear delts ---- */
  'face-pull':          { name:'Face Pull', img:'face-pull.jpg', tags:['Rear delts','Traps','Rotator cuff'], cue:'Rope to the forehead, elbows high, externally rotate at the end.' },
  'reverse-pec-deck':   { name:'Reverse Pec Deck', tags:['Rear delts'], cue:'Slight elbow bend, drive the pinkies back.' },
  'rear-delt-fly':      { name:'Bent-Over Rear Delt Fly', tags:['Rear delts'], cue:'Chest down, thumbs down, small controlled range.' },
  'cable-rear-row':     { name:'Cable Rear Delt Row', tags:['Rear delts','Traps'], cue:'High cable, elbows flared wide, pull to the face.' },

  /* ---- hamstring curl ---- */
  'ham-curl-lying':     { name:'Hamstring Curls', img:'ham-curl-lying.jpg', tags:['Hamstrings'], cue:'Hips down on the pad, curl all the way, slow release.' },
  'ham-curl-seated':    { name:'Seated Hamstring Curl', tags:['Hamstrings'], cue:'Seated hits the hamstrings stretched — usually the better version.' },
  'nordic-curl':        { name:'Nordic Curl', tags:['Hamstrings'], cue:'Fall as slowly as you can, push back up with the hands.' },
  'ham-curl-single':    { name:'Single-Leg Hamstring Curl', tags:['Hamstrings'], cue:'Fixes side-to-side imbalance. Match the weaker side.' },

  /* ---- incline press ---- */
  'incline-db-press':   { name:'Incline Dumbbell Bench Press', img:'incline-db-press.jpg', tags:['Upper chest','Front delts','Triceps'], cue:'Bench at 30°, dumbbells to the collarbone line, stretch at the bottom.' },
  'incline-bb-press':   { name:'Incline Barbell Bench Press', tags:['Upper chest','Front delts','Triceps'], cue:'Bar to the upper chest, elbows at 45°.' },
  'low-incline-db':     { name:'Low-Incline Dumbbell Press', tags:['Upper chest','Chest'], cue:'15–20° only. Splits the difference with flat.' },
  'incline-machine':    { name:'Incline Machine Press', tags:['Upper chest','Front delts'], cue:'Fixed path — chase the stretch and a hard squeeze.' },

  /* ---- dip / triceps compound ---- */
  'dips-weighted':      { name:'Weighted Dips', img:'dips-weighted.jpg', tags:['Lower chest','Triceps','Front delts'], cue:'Lean forward for chest, upright for triceps. Shoulders below elbows.' },
  'close-grip-bench':   { name:'Close-Grip Bench Press', tags:['Triceps','Chest'], cue:'Shoulder-width grip, elbows tucked, bar to the lower sternum.' },
  'pushup-weighted':    { name:'Weighted Push-Up', tags:['Chest','Triceps'], cue:'Plate on the back, body in one line, full lockout.' },
  'machine-dip':        { name:'Machine Dip', tags:['Triceps','Lower chest'], cue:'Lets you load the last few reps safely.' },

  /* ---- quad accessory ---- */
  'leg-press':          { name:'Leg Press', img:'leg-press.jpg', tags:['Quads','Glutes'], cue:'Feet shoulder-width and low for quads. Deep, no lower-back rounding.' },
  'leg-extension':      { name:'Leg Extension', tags:['Quads'], cue:'Pause at full extension, slow on the way down.' },
  'pendulum-squat':     { name:'Pendulum Squat', tags:['Quads','Glutes'], cue:'Brutal quad stretch — go deep and control it.' },
  'leg-press-single':   { name:'Single-Leg Press', tags:['Quads','Glutes'], cue:'One leg at a time, foot centred, full depth.' }
};

/* Rotation pools. Index = cycle number, wrapping every 4 cycles (32 weeks). */
export const POOLS = {
  pressHeavy:  ['bench-barbell','bench-db','machine-chest-press','smith-bench'],
  squat:       ['squat-barbell','squat-front','hack-squat','bulgarian-split'],
  pressVert:   ['shoulder-press-db','ohp-barbell','press-seated-bb','arnold-press'],
  tricepLong:  ['tricep-overhead','tricep-oh-cable','skull-crusher','jm-press'],
  tricepLat:   ['tricep-pushdown','rope-pushdown','reverse-pushdown','tricep-kickback'],
  sideDelt:    ['lateral-raise-db','lateral-raise-cable','lateral-raise-mach','lateral-raise-lean'],
  calfStand:   ['calf-standing','calf-smith','calf-leg-press','calf-single'],
  calfSeat:    ['calf-seated','calf-seated-mach','calf-donkey','calf-tibialis'],
  absHip:      ['hanging-leg-raise','hanging-knee-raise','captains-chair','reverse-crunch'],
  absFlex:     ['machine-crunch','cable-crunch','decline-crunch','weighted-situp'],
  absExt:      ['ab-wheel','barbell-rollout','plank-weighted','body-saw'],
  absRot:      ['pallof-press','cable-woodchop','pallof-kneeling','suitcase-carry'],
  hingeHeavy:  ['deadlift','trap-bar-dl','deficit-dl','rack-pull'],
  hingeRdl:    ['rdl','rdl-db','stiff-leg-dl','good-morning'],
  pullVertLoad:['pullup-weighted','chinup-weighted','pullup-neutral','pullup-assisted'],
  pullVertMach:['lat-pulldown-close','lat-pulldown-wide','pulldown-neutral','straight-arm-pd'],
  rowSupported:['row-chest-supported-db','row-pendlay','row-tbar','row-machine-chest'],
  rowCable:    ['cable-row-seated','cable-row-1arm','row-machine','inverted-row'],
  curlBar:     ['curl-barbell','curl-ez','curl-preacher','curl-cable'],
  curlDb:      ['curl-db','curl-incline-db','curl-hammer','curl-concentration'],
  rearDelt:    ['face-pull','reverse-pec-deck','rear-delt-fly','cable-rear-row'],
  hamCurl:     ['ham-curl-lying','ham-curl-seated','nordic-curl','ham-curl-single'],
  pressIncline:['incline-db-press','incline-bb-press','low-incline-db','incline-machine'],
  dip:         ['dips-weighted','close-grip-bench','pushup-weighted','machine-dip'],
  quadAcc:     ['leg-press','leg-extension','pendulum-squat','leg-press-single']
};

const s = (target, rir) => ({ target, rir });

/* The 4-day template. `pool` picks the exercise, `off` shifts the pick so a
   muscle trained twice a week gets a different exercise on its second day. */
export const TEMPLATE = [
  { id:'pushA', name:'Push A', kind:'push', mins:45, day:1, focus:'Heavy chest · quads · shoulders', slots:[
    { pool:'pressHeavy', rest:180, sets:[s('6',3), s('5-6',2), s('5-6',1)] },
    { pool:'squat',      rest:180, sets:[s('6',3), s('5-6',2), s('5-6',2)] },
    { pool:'pressVert',  rest:120, sets:[s('10',2), s('8-10',1), s('8-10',1)] },
    { pool:'tricepLong', rest:0, superset:true, sets:[s('12',1), s('10-12',0), s('10-12',0)] },
    { pool:'sideDelt',   rest:90,  sets:[s('12',1), s('12',0), s('12',0)] },
    { pool:'calfStand',  rest:0, superset:true, sets:[s('12',1), s('10-12',0), s('10-12',0)] },
    { pool:'absHip',     rest:60,  sets:[s('12',1), s('10-12',0), s('10-12',0)] }
  ]},
  { id:'pullA', name:'Pull A', kind:'pull', mins:45, day:2, focus:'Heavy hinge · vertical pull · biceps', slots:[
    { pool:'hingeHeavy',   rest:240, sets:[s('5',3), s('5',3), s('5',2)] },
    { pool:'pullVertLoad', rest:150, sets:[s('8',2), s('6-8',1), s('6-8',1)] },
    { pool:'rowSupported', rest:120, sets:[s('10',2), s('8-10',1), s('8-10',1)] },
    { pool:'curlBar',      rest:0, superset:true, sets:[s('10',2), s('8-10',1), s('8-10',0)] },
    { pool:'rearDelt',     rest:90,  sets:[s('12',1), s('12',0), s('12',0)] },
    { pool:'hamCurl',      rest:0, superset:true, sets:[s('12',1), s('10-12',0), s('10-12',0)] },
    { pool:'absExt',       rest:60,  sets:[s('10',1), s('8-10',0), s('8-10',0)] }
  ]},
  { id:'pushB', name:'Push B', kind:'push', mins:42, day:4, focus:'Upper chest · quad volume · triceps', slots:[
    { pool:'pressIncline', rest:180, sets:[s('8',3), s('6-8',2), s('6-8',1)] },
    { pool:'quadAcc',      rest:150, sets:[s('12',2), s('10-12',1), s('10-12',0)] },
    { pool:'dip',          rest:150, sets:[s('10',2), s('8-10',1), s('8-10',0)] },
    { pool:'tricepLat',    rest:0, superset:true, sets:[s('12',1), s('10-12',0), s('10-12',0)] },
    { pool:'sideDelt', off:1, rest:90, sets:[s('12',1), s('12',0), s('12',0)] },
    { pool:'calfSeat',     rest:0, superset:true, sets:[s('12',1), s('10-12',0), s('10-12',0)] },
    { pool:'absFlex',      rest:60,  sets:[s('12',1), s('10-12',0), s('10-12',0)] }
  ]},
  { id:'pullB', name:'Pull B', kind:'pull', mins:42, day:5, focus:'Hamstrings · horizontal pull · lats', slots:[
    { pool:'hingeRdl',     rest:180, sets:[s('10',2), s('8-10',2), s('8-10',1)] },
    { pool:'rowCable',     rest:150, sets:[s('10',2), s('8-10',1), s('8-10',1)] },
    { pool:'pullVertMach', rest:120, sets:[s('12',2), s('10-12',1), s('10-12',0)] },
    { pool:'curlDb',       rest:0, superset:true, sets:[s('12',1), s('10-12',0), s('10-12',0)] },
    { pool:'rearDelt', off:1, rest:90, sets:[s('12',1), s('12',0), s('12',0)] },
    { pool:'hamCurl',  off:1, rest:0, superset:true, sets:[s('12',1), s('10-12',0), s('10-12',0)] },
    { pool:'absRot',       rest:60,  perSide:true, sets:[s('12',1), s('10-12',0), s('10-12',0)] }
  ]}
];

/* Build the concrete 4-day plan for a given cycle number (0 = the original). */
export function buildSplit(cycle) {
  /* Cycle 0 is the original split, reproduced exactly — no angle offsets. */
  const shift = slot => (cycle === 0 ? 0 : (slot.off || 0));
  return TEMPLATE.map(day => ({
    id: day.id, name: day.name, kind: day.kind, mins: day.mins, day: day.day, focus: day.focus,
    exercises: day.slots.map((slot, i) => {
      const pool = POOLS[slot.pool];
      const ex = pool[(cycle + shift(slot)) % pool.length];
      const next = day.slots[i + 1];
      return {
        ex,
        rest: slot.rest,
        sets: slot.sets,
        perSide: !!slot.perSide,
        supersetInto: slot.superset && next
          ? POOLS[next.pool][(cycle + shift(next)) % POOLS[next.pool].length]
          : null
      };
    })
  }));
}

export const CYCLE_LENGTH = POOLS.sideDelt.length; /* 4 cycles before it wraps */
export const BLOCK_WEEKS = 8;

export const SCHEDULE = [
  { day:0, label:'Sun', workout:null },
  { day:1, label:'Mon', workout:'pushA' },
  { day:2, label:'Tue', workout:'pullA' },
  { day:3, label:'Wed', workout:null },
  { day:4, label:'Thu', workout:'pushB' },
  { day:5, label:'Fri', workout:'pullB' },
  { day:6, label:'Sat', workout:null }
];

export const FUEL = [
  { id:'preworkout', label:'Carbs + caffeine',  detail:'1 hour before training', icon:'⚡' },
  { id:'gatorade',   label:'Gatorade in hand',  detail:'Sip through the session', icon:'🥤' },
  { id:'creatine',   label:'Creatine',          detail:'5 g, any time of day',    icon:'💊' },
  { id:'protein',    label:'Protein',           detail:'130 g target',            icon:'🥩', counter:true, goal:130, step:25 }
];

export const PRINCIPLES = [
  'Every muscle gets hit twice a week — and taken to its limit each time.',
  'The second session of the week attacks the same muscle from a different angle.',
  'Compounds first, heavy and low-rep. Isolation last, close to failure.',
  'Recover hard. Creatine daily. 130 g of protein.',
  'Carbs and caffeine one hour before. Gatorade in hand during.'
];
