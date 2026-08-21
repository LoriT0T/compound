# Compound

One tracker for the four things that actually move health: **sleep, training, fuel and tests.**

The name is the thesis. Compound lifts, chemical compounds, compound interest — the
returns here come from small inputs repeated, not from any single clever intervention.

Offline-first, no account, no server, no build step. Vanilla ES modules and
`localStorage`. It works on a plane.

---

## Today

Split **vertically by day** — a week strip you can tap into to log any day — and
**horizontally by domain**:

| Band | What sits in it |
|---|---|
| 🟣 **Sleep** | Four numbered levers: wake time, morning light, caffeine curfew, dim the last hour |
| 🔵 **Exercise** | Zone 2 base (150 min/wk) and one hard interval session |
| 🔴 **Workout** | The day's split, Start/Continue session, plus the four training-fuel items |
| 🟢 **Fuel & food** | Supplements and food, ordered the way you take them through the day |
| 🩷 **Situational** | Taken for a reason, not daily — caffeine+theanine, tyrosine, alpha-GPC |
| 🟡 **Tests** | Blood pressure, Cooper test, quarterly blood panel |

Rows stay minimal until tapped. Expanded, each one gives **how**, **why it earns a
place**, **what to watch out for**, and its logging fields — the same shape as a set
expanding in the session view.

## Split

The 4-day push/pull block: every muscle twice a week, compound movements first.
Rotates through exercise pools so the stimulus changes without the structure moving.

## Log

Progression charts and session history, then an eight-week schedule grid where each
day is quartered by domain and coloured. A dark quarter is a gap — a column of dark
purple means sleep is where you are losing, not supplements.

## Review

Fortnightly. Ring numbers in, block-versus-block comparison and transparent
rule-based recommendations out. Every recommendation names the counts it fired on.
Also carries the list of compounds **considered and deliberately left out**, with the
reasoning intact — a stack is defined as much by what you keep out.

---

## Principles

- **Floors, not ladders.** Most of this corrects deficiency rather than exceeding
  sufficiency. Large downside from being short; roughly zero upside from excess.
- **One source of truth per component.** Lifting is read from real logged sessions,
  never a checkbox that can disagree with them.
- **Food first.** Every supplement here has a food that beats it. The pill is for the
  weeks the food does not happen.
- **One variable per fortnight.** Change two and the next block cannot attribute
  anything.
- **The ordering is honest.** Sleep, aerobic base, protein and consistency outrank
  everything in the bottle. The bottle is item eight of eight.

## Data

Everything is on-device in `localStorage` under the `pp:v1:*` namespace. Export a
backup from Log → Data before clearing browser data. Wearable numbers are entered
manually here; a native iOS client reads them from HealthKit instead.

## Run it

```bash
python3 -m http.server 4173
```

Then open `http://localhost:4173`.

## Credit

Grown out of [Push/Pull](https://github.com/LoriT0T/pushpull), which remains its own
live app. Compound is the superset, not a replacement.

*Not medical advice. Anything thyroid-active, and the iron question, needs a
clinician looking at your actual numbers.*
