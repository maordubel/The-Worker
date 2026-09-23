# THE WORKER LIFE — GAMEPLAY FLOW PATCHSET

**Branch:** `life/gameplay-flow-pass`  
**Purpose:** implementation batches derived from `GAMEPLAY-FLOW-PASS-1983-2026.md` and the current branch code.  
**Rule:** preserve current architecture, data model, historical anchors, route system, endings and art. These are flow repairs, not a rewrite.

---

# Batch 1 — confirmed player defects

## A3 · `a3-hall`

Files:
- `lib/life/content/chapterStageA.ts`
- `lib/life/checklist.ts`
- `tests/life-gameplay-pass.test.ts`

Required edits:

1. `a3-open` must raise `knows:hall` + `life:knows:hall` in the same beat where Efi says where they are going. Do not require a second Efi conversation merely to unlock knowledge already spoken.
2. Add one outside-arrival beat at `ussishkin-outside`, once per chapter, setting `a3:arrived` and giving the short arrival cue: `זה פה.`
3. Make `objectiveA3` progressive and concrete:
   - before route reveal: Efi is the action;
   - route known: `אפי כבר הולך. לצאת איתו לכיוון מרכז תל אביב.`
   - outside, before entry: `אוסישקין. הסדרן בדלת.`
   - `entry:granted`: `הדלת פתוחה. להיכנס.`
   - inside, before parquet: `תסתכל על הפרקט.`
   - parquet seen, stand unseen: `עכשיו למעלה — היציע.`
   - `life:seen:ussishkin`: `ראית מספיק. אפי ליד המעקה.`
4. `a3-seen` must stop auto-closing the room. Replace the current `a3:done` + automatic `a3-leaving` with `a3:seen-enough` plus a short toast/nudge toward Efi.
5. `efi-a3-hall` remains the player-driven close:
   - `עוד קצת` keeps exploration open;
   - `בוא נלך` raises `a3:done` and closes the evening.
6. Keep `a3-late` as the time backstop only.
7. Expand the checklist to reveal route → outside → usher → open door → parquet → stand → Efi.

Regression tests:
- opening reveals the route immediately;
- no second Efi talk is required to make the hall reachable;
- `entry:granted` exposes entering as the next action;
- reaching the exploration milestone does not end the chapter;
- Efi still closes the chapter when the player chooses to leave.

---

## 1991 · homework / permission / refusal recovery

Files:
- `lib/life/content/era.ts`
- `lib/life/content/dialogue1991.ts`
- `lib/life/checklist.ts`
- `tests/life-gameplay-pass.test.ts`

Required edits:

1. Replace the abstract post-homework objective with state-sensitive text:
   - `hw:done` → `המחברת סגורה. רחל במטבח.`
   - `hw:half` / `hw:faked` → `רחל תשאל על השיעורים. להחליט מה אומרים לה.`
2. After `permission:yes`, immediately move the objective to the real physical next step:
   - when Ofir is the guide: `בתשע וחצי בבית. אופיר מחכה ברחוב.`
   - otherwise: a concrete Ussishkin route/door objective.
3. After `permission:no`, expose real recovery options instead of leaving the refusal as a dead theme:
   - if Kobi repair is available and not used: `אמרה לא. קובי בסלון; הפנקס במטבח.`
   - after `kobi:nudged`: `קובי לא ידבר במקומך. רחל במטבח — או הפנקס.`
   - without repair availability: `אמרה לא. הפנקס במטבח — להשאיר פתק או להישאר.`
4. The current code writes `kobi:nudged` but never consumes it. Add a Rachel branch **before** the generic `permission:no` branch:
   - condition: `permission:no && kobi:nudged && before TIP_OFF`;
   - honest admission path raises `permission:yes` + `permission:repaired` and preserves the 21:30 curfew;
   - adjust Rachel trust / responsibility / honesty in the existing model;
   - refusal-to-repair leaves `permission:no` intact.
5. Keep notebook sneak, stay-home, radio-at-home and curfew endings exactly as real branches.
6. Rewrite the checklist so homework result, Rachel, refusal recovery, route, hall, derby and home are concrete named actions.

Regression tests:
- all/half/fake homework each produces a legible next move;
- lie → refusal → Kobi nudge → Rachel honest repair works;
- lie → refusal → notebook still works;
- Ofir guide path works for a player who never learned the hall earlier;
- curfew remains a live leave/stay decision during the derby.

---

# Batch 2 — remove “dialogue = work” from early adult life

## 1999 basket · `1999-basket`

Observed in current code:
- `seed-open` auto-opens `seed-corner`;
- `seed-corner` offers `לעשות את התור` as a sentence choice and immediately writes `seed:worked`;
- `seed-hall` then jumps directly into the historical match;
- `seed-gate5` turns the first supporter-ownership list into another sentence choice.

Required repair:

1. Split **assignment** from **execution**.
2. `seed-corner` should assign the queue job (`seed:queue-assigned`) rather than grant `seed:worked` immediately.
3. Add a physical queue/work interaction on the Ussishkin exterior/hall approach. Completing it writes `seed:worked`, costs energy/time and produces the immediate Limor/Shachor reaction.
4. The historical hall beat begins only after the work is either completed or consciously skipped/abandoned by an authored branch.
5. At the kiosk, do not let the first ownership document appear fully formed in a choice. Add a sheet/notepad interaction:
   - first inspect blank headings / what is missing;
   - then choose list vs anger;
   - list path physically creates/keeps the paper before `seed-close`.
6. Checklist becomes: corner assignment → do the work → hall → kiosk sheet → close.

Do not change historical anchor handling or the relegation match script.

---

## 2000 bridge · `2000-bridge`

Observed in current code:
- the Red Box is already a real `box` effect (`b-box-lid`) — keep it;
- `b-kiosk` still compresses work/list/evening into one dialogue choice and immediately sets `b:commit`.

Required repair:

1. Keep B00 (who closes the night) as conversation.
2. Keep B01 (Red Box) as the object-driven beat it already is.
3. Split B02 into **choose commitment** → **perform commitment**:
   - shift: assign the shift, then perform a short crate/counter/chore action before `b:commit`;
   - roads/list: open a visible list/planning object, make at least one concrete allocation/check, then `b:commit`;
   - people/evening: keep social, but require the player to physically sit/join the relevant group point before the commitment resolves.
4. Do not set `b:commit` in the initial choice. Set a selected kind flag first; completion sets `b:commit`.
5. Preserve `workDoneFlag('2000-bridge')`, wage derivation, route flags and all three endings.

---

## 2001 terrace · `2001-terrace`

Observed in current code:
- one enter beat opens `t-first`;
- the choice itself performs the task, grants proof/reputation and immediately ends the chapter.

Convert to a true micro-quest:

1. Asaf asks what Pogi can take; choice writes only `t:task = gear | people | no`.
2. For `gear`, expose one physical equipment hotspot/task at Gate 5. Completion writes `t:task-done`.
3. For `people`, expose a short volunteer-count/contact action; at least one confirmation must be performed, not narrated.
4. Return/report to Asaf after execution. **Only here** grant the leadership proof + `heard` + ending.
5. `no` remains an intentional vignette ending and should not force a fake task.
6. Checklist: receive responsibility → do it → report back.

The route proof must describe work the player actually performed.

---

## 2002 desk · `2002-desk`

Observed in current code:
- `j-first` already contains the correct ethical problem;
- the entire verification/publication act is currently one dialogue choice and immediately grants proof/end.

Convert to a journalism micro-quest:

1. Opening conversation identifies two uncertain pieces: the photo permission and the unsafe fact.
2. After the talk, expose two concrete information objects/sources.
3. Player verifies/labels them separately:
   - fact confirmed / unconfirmed;
   - photo permission granted / unavailable.
4. Then open the publication choice:
   - verified report;
   - personal-memory framing;
   - knowingly publish rumour.
5. Proof and ending happen only after the publish/hold action, not at first conversation.
6. Preserve the existing `DESK`, `DESK_UNVERIFIED`, reputation loss and later `2006-desk` correction relationship.

---

# Batch 3 — make planning, leadership and documents physical

## 2002 Europe · `2002-europe`

Observed in current code:
- `e-beds` is currently a pure dialogue choice that immediately completes hosting;
- `e-trip` immediately resolves a 1,800₪ travel decision in conversation;
- the chapter’s own design goal says “find the bus”, but transport recovery is still mostly narrated.

Required repair:

1. `e-beds`: conversation picks strategy; a visible list/address surface completes the allocation. `e:beds` is written only after allocation is complete or consciously declined.
2. `e-trip`: use a planning surface with money / passport / route / work obligation visible before booking. Do not let “אני נוסע. סגרתי.” be the first time the player sees feasibility.
3. Post-Milan: add a short people/transport recovery action before the emotional ending choice. Count/locate/return to the agreed meeting point.
4. Preserve `TRIP_AGOROT`, attendance modes, archive anchors and endings.

---

## 2006 desk · `2006-desk`

Use the old publication as a real object.

1. Put the old clipping/publication in the scene.
2. Inspect it and mark what is wrong/incomplete.
3. Only then open correction / second-source / hold choices.
4. Existing `public_correction` and journalism proofs remain unchanged, but they move to the final action.

---

## 2007 founding sequence

### `2007-table`
Current role choice must be preceded by inspecting the actual sheet.

Add a document hotspot showing missing columns/names. The role choice should answer a problem the player has already seen, not invent it in dialogue.

### `2007-registered`
The promised deliverable must be handed to a person/object in `community-room`; do not let “deliver” be only a line.

Keep the demolition/loss beat restrained and non-gamified.

### `2007-key`
The key must be played physically:
- arrive to empty rented hall;
- unlock/open;
- switch on / place one first item;
- leave a readable list for the next person;
- then hand off the key/proof.

### `2009-up`
Treat as payoff vignette: close/clean/lock one thing, then see what grew. No new large quest.

---

## 2016 crisis · `2016-crisis`

Current beats are already separated correctly by location, but each opens directly into a conversation.

Convert the three themes into three different actions using existing systems:

1. **news / kiosk:** use the existing two-source verification grammar. Player distinguishes confirmed vs unconfirmed before `p:news` resolves.
2. **till / pitch:** make the shared-cash choice on a physical till/cash surface before `p:till`.
3. **deliver / community-room:** hand actual names/list to the community person before `p:deliver`.
4. Keep `p-table` as a documentary consequence, never a puzzle.
5. Preserve `TILL = life:till` across the next chapter.

---

## 2026 plan · `2026-plan`

Observed in current code:
- `objectivePlan` already says money first, plan second;
- both `f-money` and `f-plan` are still auto-talk beats;
- the checklist currently allows `show plan` immediately after `f:money` with no physical plan assembly step.

Required repair:

1. Split `f-money` into a budget surface:
   - available money;
   - two/three-person party if applicable;
   - responsibility/share;
   - close the budget.
2. Only after budget closes, expose a route/meeting-plan surface.
3. The plan must contain at minimum transport, meeting point and who is responsible for Kobi.
4. Only a completed plan enables `f-plan` / “show Dad”.
5. Keep the exact final party persistence through `PARTY = life:finale:party` and do not expose child options when `life:child` is absent.
6. Preserve all three plan endings and the 1983 ↔ 2026 ticket reversal.

---

# Shared implementation rules for all batches

1. **No mandatory flavour hotspot.** Required actions get two affordances once revealed: objective/checklist + visible actor/object/door.
2. **Do not auto-end exploration milestones.** A discovery should create the next intention, not yank control away.
3. **Choice is not work.** Route/career proofs are awarded after performed actions, not after choosing a sentence that claims the action happened.
4. **Immediate reaction.** Every meaningful action must change objective, world, sound, person reaction or visible object immediately.
5. **No passive wait.** Existing flow/time-pass logic remains the backstop.
6. **Do not duplicate systems.** Reuse `Beat`, `Conversation`, world hotspots, existing minigames/chore grammar, checklist, route proofs and Passage/card framework.
7. **Historical anchors remain immutable.** These patches change player flow around history, not the history.
8. **All new state needed across chapters uses `life:` only when it truly survives a chapter transition.** Do not turn ordinary chapter progress into persistent flags.

---

# Test order

Implement and green in this order:

1. A3
2. 1991
3. 2001-terrace
4. 2002-desk
5. 1999-basket
6. 2000-bridge
7. 2002-europe
8. 2007 founding sequence
9. 2016-crisis
10. 2026-plan

For each chapter run:
- golden path;
- messy/refusal/late path;
- confused path that follows only what the UI teaches.

A batch is complete only when the next player action is concrete after every major state transition.
