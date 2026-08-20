# Push / Pull

A 4-day push/pull training tracker built from one specific split — every muscle hit
twice a week, compounds first, isolation to failure.

**Live app → https://lorit0t.github.io/pushpull/**

Open it on your phone and add it to the home screen (Share → Add to Home Screen).
It runs offline, stores everything on the device, and needs no account.

---

## The split

| Day | Session | Focus | Time |
|-----|---------|-------|------|
| Mon | Push A | Heavy chest · quads · shoulders | ~45 min |
| Tue | Pull A | Heavy hinge · vertical pull · biceps | ~45 min |
| Wed | Rest | | |
| Thu | Push B | Upper chest · quad volume · triceps | ~42 min |
| Fri | Pull B | Hamstrings · horizontal pull · lats | ~42 min |
| Sat/Sun | Rest | | |

Every exercise carries its exact prescription from the original plan: 3 sets, the
target rep range per set, the RIR per set, and the rest interval. The four superset
chains (triceps→laterals, calves→abs, curls→face pulls, hamstrings→abs) are wired in —
they show a "no rest, straight into X" prompt instead of a rest timer and jump you to
the next exercise automatically.

## What it tracks

- **Sets** — weight, reps and RIR per set, one tap to log. The weight you type carries
  down to the remaining sets, and last session's numbers show as placeholders.
- **Rest** — starts automatically on the exact interval for that exercise (240s down to
  60s), beeps and vibrates when it's up, `+30s` and skip available. Skipped on supersets.
- **Progression** — estimated 1RM per exercise over time, best set, session volume.
- **Fuel** — creatine, 130 g protein counter, pre-workout carbs + caffeine, Gatorade,
  with a 7-day consistency grid.
- **Block age** — days since the current split went live, counting toward the 8-week
  rotation.

## Rotation

The split runs in 8-week blocks. The block timer starts at day 0 and counts up; at
8 weeks it flags that rotation is due. **Generate new split** swaps every movement
pattern to a different exercise — same structure, same sets, reps, RIR and rest — and
resets the timer. Logged history is never touched.

There are 4 blocks before the rotation wraps back around, so the cycle runs 32 weeks.
Block 1 is the original split, unchanged.

## Exercise images

24 of the 25 exercises in block 1 use the illustrations from the original plan. The
Pallof press uses a diagram drawn for this app. Exercises introduced by later blocks
have no image yet — tap **Add photo** on any exercise to attach one from your camera
roll; it's stored on the device and used from then on.

## Data

Everything lives in `localStorage` on the device. Nothing is uploaded anywhere.
**Log → Export backup** writes a JSON file; **Import** restores it. Do that before
clearing browser data or moving to a new phone.

## Running locally

No build step. Serve the folder over HTTP (the service worker and ES modules need a
real origin, not `file://`):

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Structure

```
index.html              app shell + bottom nav
css/app.css             all styling
js/data.js              exercise library, rotation pools, split template
js/store.js             localStorage layer
js/app.js               router, views, session logging, rest timer
img/                    exercise illustrations
sw.js                   offline cache
```

To change the plan itself, edit `TEMPLATE` in `js/data.js` — sets, reps, RIR, rest and
supersets are all declared there. To add an exercise to the rotation, add it to `LIB`
and drop its id into the relevant pool in `POOLS`.
