# THE WORKER LIFE — GAMEPLAY FLOW PASS · 1983–2026

**Status:** implementation authority for the gameplay-flow pass  
**Scope:** the entire playable life, from the first memory through the 2026 finale  
**Branch:** `life/gameplay-flow-pass`  
**Role:** Narrative Design + Game Design + Quest Design + UX Flow

---

## 0. The problem we are solving

A chapter can be technically reachable and still feel dead.

The existing code already protects many structural truths — no unreachable chapter, no passive 25-minute waiting, explicit checklist, route reachability, anti-softlock, chapter endings and worldline checks. Those are necessary, but they do not prove that a human player understands what is interesting **right now**.

The player report is the authority for this pass:

- `1991` contains a dead/unclear stretch around **"לשאול או לא לשאול"**.
- the first Ussishkin visit (`a3-hall`) contains dead/unclear movement and an insufficiently sharp event chain.
- similar moments exist elsewhere: technically legal free-roam with too little authored momentum, vague objectives, dialogue functioning as both action and reward, and time/room transitions that are correct in code but weak as experience.

This pass does **not** redesign the game. It makes the current game play like the game it is already trying to be.

---

# 1. Canonical gameplay contract

Every playable sequence must satisfy this loop:

> **HOOK → CLEAR WANT → PLAYER ACTION → WORLD REACTION → NEW INFORMATION/PRESSURE → PLAYER ACTION → PAYOFF → CLEAN HANDOFF**

A chapter may be quiet. A chapter may be sad. A chapter may be almost entirely social. It may **not** be vague, inert or dependent on the player guessing which hidden flag the author had in mind.

## 1.1 The player must always understand three things

At any moment of free control, without opening debug UI, the player should be able to answer:

1. **What am I trying to do?**
2. **What in this room can I act on?**
3. **What changed because of the last thing I did?**

If any answer is missing, the scene is not done.

## 1.2 Required beats are never hidden flavour

A flavour hotspot may be missable.

A required progression action must have at least **two affordances** once it has been narratively revealed, for example:

- objective/checklist + visible NPC;
- objective + lit/labelled door;
- companion line + navigation arrow;
- object close-up + interaction prompt;
- NPC reaction + map destination.

No mandatory progression may depend on the player deciding to inspect an otherwise decorative prop.

## 1.3 Dialogue cannot carry the entire game loop by itself

Three consecutive major beats may not all be:

> walk into room → auto dialogue → choose sentence → walk into next room → auto dialogue.

Between major conversations, the game should normally give the player at least one of:

- navigation;
- a physical object action;
- money/item management;
- a timed decision;
- a small mechanic/minigame;
- a route/planning action;
- an environmental discovery;
- a meaningful optional detour;
- a visible consequence in the world.

Dialogue is strongest when it reacts to something the player **did**.

## 1.4 No passive waiting

If the only remaining condition is time:

- offer/perform the existing time pass quickly;
- frame it as a natural transition;
- never make the player pace a room to make a clock advance.

If something meaningful is still available, the game may let the clock breathe — but it must tell the player what is available.

## 1.5 A decision receives feedback immediately

Within roughly two seconds after a meaningful choice, at least one of these should happen:

- a character reacts;
- an object changes;
- a destination becomes available;
- the objective changes;
- a sound/crowd/environment cue lands;
- a relationship/life consequence is expressed diegetically;
- a card/memory is created.

Never leave a player wondering whether the click registered or whether the game expects another hidden action.

## 1.6 Endings are not score screens

Keep the current Ending Card / Red Box philosophy.

Every mission ending should communicate:

1. **what I did / how I was there**;
2. **what remains from it** (memory, relationship, object, promise, scar, route proof);
3. **what the next life beat is emotionally about**.

Do not add XP simply to manufacture reward.

---

# 2. Documentary bridges — the missing connective tissue

The life currently has good chapter cards, but some large jumps still feel like file navigation rather than a documentary life story.

Add a lightweight **Documentary Bridge** language for meaningful time jumps.

## 2.1 Shape

A bridge is 6–15 seconds, skippable, maximum three beats:

1. **THE CLUB / CITY** — one verified contextual fact or visual change.
2. **POGI** — one personal object, relationship or life consequence that survived.
3. **THE NEXT WANT** — one sentence that hands control back with a human desire, not a historical lecture.

Example shape:

> `1991 → 1993`
> - ticket stubs accumulate in the red box;
> - the route to Ussishkin is no longer something he asks permission to understand;
> - card: **"אפריל 1993 · הפעם צריך למצוא איך מגיעים."**

## 2.2 Never invent documentary facts

The factual beat comes only from the canonical archive/anchor. If the archive does not hold a precise fact, use a personal/city image instead of asserting one.

## 2.3 Priority bridges

Strengthen or add bridges at these handoffs:

- 1983 → 1984
- 1986 → 1990
- 1991 → 1993
- 1993 → 1994/95
- 1996/97 → 1998
- 2000 Double → adult life
- 2002 → 2004/06
- 2007 demolition/founding → 2009 growth
- 2010 → 2011/12
- 2013 → 2015
- 2018/19 → 2021
- 2021 → 2023
- 2025 → 2026 finale

Use the existing Passage/bridge/card vocabulary wherever possible. This should not become a second cinematic framework.

---

# 3. Critical repair A — `a3-hall` / the first Ussishkin visit

This is a confirmed player-experience defect even though the chapter is reachable.

## 3.1 Current structural problem

The chapter contains a rich route:

> street → Efi → central Tel Aviv / Allenby → Ussishkin outside → usher → door → hall → parquet/stand/windows → Efi → leaving

but the player-facing checklist currently reduces the entire chapter to one line:

> `אפי אמר שיש משהו אחרי הקיר.`

That is not enough vocabulary for the actual quest.

There is also an awkward double beat at the beginning: the opening itself has Efi tell Pogi where they are going, but navigation knowledge is only raised by a separate Efi conversation. The player can therefore hear the destination and still have the game behave as if it was not yet revealed.

## 3.2 New flow

### Beat A3.1 — Efi arrives with a promise

Opening line stays childlike. Do not turn Efi into GPS.

After the opening line itself:

- mark the destination as known;
- immediately activate the first route affordance;
- make Efi visibly start walking / point toward the correct exit where the current runtime supports it;
- objective becomes concrete:

> **"אפי כבר הולך. לצאת איתו לכיוון מרכז תל אביב."**

No second conversation should be required merely to unlock a destination the player was just told about.

### Beat A3.2 — the route is part of the memory

Do not teleport directly to the door unless a fallback is needed.

The journey should contain one short playable observation — street/Allenby/panorama/traffic of people — and then hand off cleanly to Ussishkin.

The route is not a navigation puzzle. It is the child realising the hall is part of his city.

### Beat A3.3 — outside

Arrival should do three things in order:

1. let the player see the exterior for a beat;
2. Efi says: **"זה פה."**
3. the usher becomes the obvious next interaction.

Objective:

> **"הסדרן בדלת. אפי אומר שהוא מכיר אותו."**

After the usher grants entry, immediately change the objective to:

> **"הדלת פתוחה. להיכנס."**

The player must never have `entry:granted` while still wondering what to do with it.

### Beat A3.4 — the hall is exploration, not a lock puzzle

On first entry:

- sound first: bounce / enclosed roof / crowd room tone;
- one short establishing line;
- then control.

Progressive exploration objective:

1. **"תסתכל על הפרקט."**
2. after parquet: **"עכשיו למעלה — היציע."**
3. after enough discovery: **"ראית מספיק. אפי ליד המעקה."**

The current vague line `תמצא את אפי כשתראה מספיק` must go. It exposes a hidden threshold instead of giving a human intention.

### Beat A3.5 — do not auto-end the moment the exploration threshold fires

Reaching `life:seen:ussishkin` should mark **seen enough**, not yank the player into the leaving sequence.

The payoff should be player-driven:

- return to Efi;
- `עוד קצת` keeps the room open;
- `בוא נלך` closes the evening;
- late backstop still closes it naturally if the player stays.

This is important: discovery should create the desire to return to the person who brought you, not function as a hidden completion trigger.

## 3.3 New checklist spine

`a3-hall` should progressively reveal roughly this shape:

1. `אפי כבר הולך. לצאת איתו.`
2. `אוסישקין. הסדרן בדלת.`
3. `הדלת פתוחה. להיכנס.`
4. `הפרקט.`
5. `היציע.`
6. `אפי ליד המעקה.`

Not all six need to be simultaneously visible. Reveal them as the world teaches them.

---

# 4. Critical repair B — `1991` / "לשאול או לא לשאול"

This is also a confirmed player-experience defect.

## 4.1 Why the current wording is weak

`לשאול. או לא לשאול.` is a theme, not an actionable objective.

The actual authored situation is good:

- homework exists;
- the player may do all/half/fake it;
- Rachel can check;
- truth can rescue an incomplete attempt;
- a lie can produce a refusal;
- Kobi can nudge without solving it;
- a refused child can leave a note or stay home;
- Ofir can guide the route;
- a curfew becomes the real boss fight inside the hall.

The problem is the handoff between these systems.

## 4.2 New flow after homework

The moment the homework interaction closes, the world must immediately acknowledge it.

### If `hw:done`

Use a short diegetic call from the kitchen / Rachel moving into attention:

> **"פוגי? סיימת?"**

Objective:

> **"המחברת סגורה. רחל במטבח."**

### If `hw:half` / `hw:faked`

Objective:

> **"רחל תשאל על השיעורים. להחליט מה אומרים לה."**

This turns an abstract moral branch into a concrete upcoming encounter.

## 4.3 Permission is not a menu label

Keep the conversation choices, but treat them as the climax of the homework sequence.

After permission is granted:

- immediate reaction from Rachel with the 21:30 condition;
- write/confirm the promise;
- objective changes **in the same beat** to the next physical action:

> **"בתשע וחצי בבית. אופיר מחכה ברחוב."**

If the player does not know the route, Ofir is the guide. The destination should become physically reachable immediately.

## 4.4 Refusal must open two visible doors immediately

After `permission:no`, never leave the player in the flat with an abstract “maybe another way”.

The game should expose, by world and checklist, exactly two real possibilities:

- **Rachel/Kobi repair path** if authored conditions allow another honest conversation;
- **kitchen notebook**: leave a note and go, or stay home.

Checklist wording:

> **"אמרה לא. אפשר לחזור אליה בכנות — או לגשת לפנקס במטבח."**

If repair is not currently possible, omit that clause. Do not show a false affordance.

The kitchen notebook should receive an interaction nudge/pulse once refusal occurs.

## 4.5 The hall journey

Permission does not end the quest. It releases the quest.

Flow:

> permission → street → Ofir (if needed) → Ussishkin exterior → people at the door → enter → find/hold place → derby → curfew choice → home consequence

Every transition changes the objective immediately.

## 4.6 First 1991 Ussishkin arrival

Even if the player visited in A3, this is the first **real night** there and should have its own arrival choreography:

- exterior sound leaks through door;
- familiar face/usher or Ofir grounds the player;
- door opens;
- tunnel/threshold beat;
- inside: crowd scale immediately different from the quiet A3 visit;
- Amit's “hold my place” request is visually tied to an actual place before tip-off.

The player should feel: **"I know this building now, but I have never seen it like this."**

---

# 5. Full-life chapter pass

The following is the intended gameplay treatment. “KEEP” means do not rewrite the chapter; only apply universal flow/bridge polish. “EXPAND” means the authored story is good but needs another action/transition. “VIGNETTE” means do not leave the player wandering a large room for one conversation — make the scene deliberately short or add physical work.

## 1983–1986 · becoming a supporter

### Prologue 1983 — KEEP

Strong because the player performs tiny emotional gestures instead of being told what the memory meant.

Add only a clean documentary handoff into 1984: red scrap / father / neighbourhood.

### `a2-alley` — KEEP + transition polish

Excellent quest grammar: mother request → bread → competing desire → time cost → alley outcome.

Make the post-action handoffs immediate, especially after buying bread and after the football minigame. No idle return trip required solely to fire an ending.

### `a3-hall` — CRITICAL EXPAND

Implement section 3.

### `a4-shirt` — KEEP

Strong adventure economy: count money, earn, empty savings, deadline, item payoff.

Ensure every new source of money produces visible remaining-price feedback without turning it into a modern progress bar.

### `a5-first` — KEEP

Dress → key/route → father/gate. Keep simple. This is a confidence chapter after the more exploratory A4.

### `a6-radio` — KEEP

Broken radio → Liron → repair → hear the world. Good object-driven quest.

Do not insert extra dialogue between broken radio and Liron; the object is the story.

### `a7-week` — KEEP

Discover what everyone talks about → ask father → refusal. Good pre-finale pressure.

Bridge into 24.5.1986 should carry the refusal forward emotionally.

### `1986` — KEEP / benchmark

This remains one of the main flow benchmarks: desire, locked access, alternate ways in, live historical payoff, finding father.

---

## 1990–2000 · independence, group, rupture

### `1990` — KEEP / benchmark

Kitchen arithmetic → leave → route/gate → information game → find father → walk home.

This is the model for “history as gameplay”.

### `1991` — CRITICAL EXPAND

Implement section 4.

### `1993-cup` — KEEP

Money + route choice + bus + final + after. Strong.

Make the chosen travel route visibly persist into arrival so the choice is felt beyond dialogue.

### `1993-galil` — KEEP

Multi-game structure works because each day changes what the player does. Preserve.

Use a documentary micro-card between games instead of raw calendar jumps where necessary.

### `1995-sinai` — KEEP, but protect action/dialogue ratio

The subject is argument and memory, so dialogue is appropriate. The radio, kiosk facts and poster make it physical.

Do not add a generic minigame. Ensure each conversation is preceded or followed by a visible world object/reaction.

### `1996-army` — KEEP

Packing, choosing where to stand, bus, road. Strong life/action blend.

### `1997-basket` — KEEP

The conflict between hall/football and the repeated hall later gives the chapter shape.

### `1998-laces` — KEEP

This is a historical-pressure chapter; protect the parallel-result information flow and the personal aftermath.

### `1999-basket` — EXPAND LIGHTLY

Current spine is good but compact: corner → hall work → kiosk list.

Make at least one of “work in hall” and “list” a tactile object interaction rather than only a conversation choice.

### `1999-cup` — KEEP

Route → Ramat Gan → final. Let the event carry the chapter.

### `2000-title` / `2000-double` — KEEP

They work as paired culmination chapters. Preserve four-day structure and personal exit after the cup.

---

## 2000–2010 · adult life, Europe, home, founding, double

### `2000-bridge` — EXPAND LIGHTLY

The conceptual writing is strong, but each beat should have a physical anchor:

- night: person/seat/kitchen;
- red box: actual Box interaction;
- commitment: actual shift/work object rather than only “choose work”.

The chapter should feel like the first morning of adult life, not three menus about adulthood.

### `2000-team` — KEEP

Name → guest → training → match → after. Excellent quest spine.

### `2001-terrace` — VIGNETTE → MICRO-QUEST

One-step career windows should not be free-roam wrappers around one talk.

Add three short actions:

1. receive one concrete responsibility;
2. physically complete it (equipment/meeting point/banner/people count);
3. report back and receive the proof.

### `2002-europe` — EXPAND

Strong narrative sequence but currently dialogue-heavy.

Turn at least two beats into actions:

- beds: actually allocate sleeping places / choose who sleeps where;
- trip: budget/passport/travel preparation object;
- after Milan: locate people/transport before emotional choice.

The final “find the bus” idea should be played, not merely said.

### `2002-desk` — MICRO-QUEST

First publication:

1. inspect two pieces of information;
2. choose/verify what is safe to claim;
3. write/select headline or lead;
4. receive first credit.

### `2004–2006 / 2006-home` — EXPAND LIGHTLY

Hall joy → outside loss → Liron work → Oli/travel is a good arc.

Make Liron’s workshop beat tactile: radio/device/parts/workbench action before conversation payoff.

### `2006-desk` — MICRO-QUEST

Bring back the old publication as an object. The player should find what was wrong/incomplete, correct it, then get the route proof.

### `2007-table` — EXPAND

Do not let founding begin as “pick a role from dialogue”.

Before choosing role, let player inspect the actual sheet / missing columns / names. The role choice then answers a problem the player has seen.

### `2007-registered` — KEEP + physical delivery

If the player promised operations/people, “deliver” should be an object/person action in the room, not only a line.

The demolition/loss beat must retain silence and restraint.

### `2007-key` — EXPAND

A key deserves physical play:

- arrive to empty hall;
- unlock/open;
- switch on / place first equipment / leave readable list;
- handoff.

### `2009-up` — VIGNETTE

This is payoff, not a long quest. Keep it short and intentional: close/lock/clean one thing, then see what grew.

### `2010-cup` — KEEP

Photo → calculation → derby → cup. Good escalating sequence.

### `2010-teddy` — KEEP / benchmark for event momentum

Planning → road → two-ground pressure → call → return. Preserve speed and emotional handoffs.

### `2010-qualify` — EXPAND LIGHTLY

The diary/trip choice should use a real planning surface: calendar, cost, days off, route. Avoid pure dialogue selection.

### `2010-friends` — EXPAND LIGHTLY

Meeting international friends is social by nature, but banner/name/lineup gives physical grammar. Make those visible props/actions.

### `2010-anthem` — KEEP

This is a long historical run; use short documentary cards between matches to prevent “conversation teleportation”. Each match beat should enter and leave with a distinct personal question.

---

## 2011–2021 · people, household, new homes, collapse, distance

### `2011-people` — KEEP

Three people/relationship possibilities are the gameplay. Keep choices human and avoid turning them into route stats.

### `2012-cups` — VIGNETTE

One evening, one promise. Keep it short. The important action is **telling someone before going**; make that the interaction, then cut to outcome.

### `2012-five` — EXPAND LIGHTLY

Five-year memory → ownership question → rehearsal room works.

In rehearsal room, require one small production action (credit list, cable, arrangement) before the social ending.

### `2012-terrace` — MICRO-QUEST

Delegation must be played:

1. prepare/open;
2. teach another person where/how;
3. leave before they do it and later see it worked.

This makes “who opens when you do not come” an actual leadership proof.

### `2013-household` — EXPAND LIGHTLY

Diary is a strong object. Keep it central.

Any parenthood intention should have one everyday action (schedule, home setup, cancelled plan, first evening) so the life choice is not merely a sentence.

### `2015-newhall` — EXPAND

“New home” should be exploratory:

- walk/inspect at least two hall features;
- choose/create a small new ritual;
- then solve the route to the temporary football home with Kobi.

This is a place-memory chapter; let the player inhabit the place.

### `2016-crisis` — EXPAND WITH EXISTING SYSTEMS

This chapter already has the right themes but should use systems that exist:

- kiosk news: use the existing `VERIFY_REPORT` / two-paper interaction;
- till: physical shared-cash decision;
- community list: deliver names;
- table update: documentary consequence, not a player puzzle.

The player should feel the difference between **checking facts**, **handling money**, and **helping people**.

### `2017-after` — KEEP

Aftermath is intentionally quieter. Amit → father → Efi invitation is a good emotional recovery sequence.

Use a short documentary bridge into it so quiet feels chosen rather than empty.

### `2017-distance` — EXPAND LIGHTLY

Tell Ofir → show where life actually was → bus station return. Make the “where life was” beat an object/calendar/photo choice, not only explanation.

### `2018-return` — EXPAND PLACE PLAY

Return to renewed Bloomfield should be visual exploration. The player must physically find 2–3 changed landmarks/signs before the chapter resolves.

Do not turn nostalgia into a paragraph.

### `2019-armchair` — KEEP

Remote control, Amit photo, Saturday choice are already tangible. Good “supporter at distance” grammar.

### `2021-losses` — KEEP

Home screen → cup aftermath → younger people. The chapter is about receiving loss, not solving it.

### `2021-promises` — EXPAND LIGHTLY

When a child exists, first match/scarf should be object-driven. When no child exists, do not expose ghost content.

The core mechanic is promise → next time → kept/broken; keep it concrete.

### `2021-suitcase` — MICRO-QUEST

Packing is the mechanic.

Give 5–6 meaningful things and limited slots/time. The player chooses what physically travels: work, family, Hapoel, red-box copy, practical items. Consequences should be flavour/continuity, not a min-max stat puzzle.

---

## 2023–2026 · what remains, return, ownership, generations

### `2023-tournament` — KEEP + make the football role physical

The tournament is ideal for a real mechanic. Position/role choice should affect at least one short playable football action before the derby/community discussion.

### `2023-quiet` — INTENTIONAL QUIET VIGNETTE

Do **not** gamify grief/help.

The chapter may remain mechanically light, but remove free-roam ambiguity:

- message arrives;
- player makes the small human choice;
- brief silence/transition;
- Kobi beat;
- exit.

“אין פה משימה” must mean “the game is not scoring this”, not “there is nothing to do and no idea why”.

### `2023-visit` — MICRO-QUEST

Two days is a scheduling conflict:

- choose 2–3 commitments from more possibilities;
- physically visit at least one person/place;
- accept that something will be missed.

### `2023-abroad` — EXPAND LIGHTLY

Phone → call → Alex/key is good. Make the key/place interaction physical so the new life feels inhabited.

### `2024-terrace` — MICRO-QUEST

“They are looking at you” must produce leadership play:

- read the immediate problem;
- choose what to explain / delegate;
- crowd/team visibly responds;
- then proof/title consequence.

### `2024-lina` — VIGNETTE

Phone scene. Keep compact. Give one meaningful disagreement choice and a later callback/reaction; do not force walking around a house to activate a call.

### `2025-eurocup` — KEEP

Historical event + father passport handoff is good. Make the passport/plan visible as object, not just words.

### `2025-interview` — MICRO-QUEST

The player should actually choose the three questions from notes/categories, hear answers, then choose what is fair to publish/keep private.

### `2025-owner` — EXPAND WITH BUSINESS OBJECTS

This is the hardest route and should feel mechanically richest.

Use actual surfaces already represented by the fiction:

- team sheet;
- financing/budget sheet;
- conflict-of-interest document;
- home promise/calendar;
- Monday service allocation.

Do not make ownership a five-conversation ladder. Every phase needs a concrete document/decision and a visible constraint.

### `2025-abroad` — VIGNETTE + planning object

“The time I wait for you” should be short and warm. End by creating the actual 2026 reunion point/photo/plan object that later pays off.

### `2026-plan` — EXPAND WITH EXISTING BUDGET/TRAVEL SYSTEM

This is preparation gameplay:

1. establish available money;
2. choose party size / responsibility;
3. close the budget;
4. build the route/meeting plan;
5. show it to Kobi.

Do not allow “show plan” before the player has actually assembled one.

### `2026-finale` — KEEP / final benchmark, strengthen handoffs

The physical journey is the payoff:

> station → airport/bus → European arrival → Botevgrad road → arena exterior → seats → historical night → outside → return choice

Each travel handoff should be automatic once the player has completed the meaningful action; no unnecessary room traversal between transport beats.

The final reversal must remain clear:

> **1983: he had the tickets and carried you.**  
> **2026: you have the plan/tickets and carry him.**

If a child exists and travelled, the third generation must be visibly present in the route decisions, not only named in the ending card.

---

# 6. One-step windows — global rule

The current registry contains several one-step chapters. One-step is not automatically bad, but it must be **intentional**.

For each one-step window choose exactly one treatment:

### A. VIGNETTE

Use when the value is emotional/social and no skill test is needed.

- direct entrance;
- one interaction;
- immediate reaction;
- clean ending;
- no large free-roam room.

### B. MICRO-QUEST

Use when the scene is supposed to prove capability.

Minimum grammar:

> inspect/receive problem → perform one concrete action → handoff/reaction

Career/route proof windows should usually be MICRO-QUEST, because a route title should come from work the player performed.

---

# 7. UX changes that apply everywhere

## 7.1 The `?` sheet must describe the world the player can act on

Keep the progressive checklist.

Also surface **currently available meaningful interactions** once they are revealed by the world — without dumping every flavour hotspot.

Example:

> **עכשיו**  
> ○ רחל — במטבח  
> ○ המחברת — על השולחן  
> ○ יציאה לרחוב

This is not a quest arrow replacement. It is an anti-confusion layer.

## 7.2 Objective text must use concrete nouns

Bad:

> `לשאול. או לא לשאול.`

Good:

> `המחברת סגורה. רחל במטבח.`

Bad:

> `מה עושים עכשיו.`

Good:

> `כולם יצאו. האוטובוס בנקודה שסיכמתם — לספור מי חזר.`

Theme belongs in dialogue and title. Objective belongs to play.

## 7.3 Companion handoff

When an NPC says “בוא”, “אחריי”, “אני לוקח אותך”, that sentence becomes a gameplay contract:

- either the NPC leads / auto-escorts;
- or the route becomes immediately explicit through door/goal affordance.

Never say “בוא” and then leave the player alone to rediscover the destination.

## 7.4 Camera / prompt choreography

When a required new interactable becomes available after a dialogue:

- short camera look / actor glance / sound / pulse;
- no full tutorial popup;
- then control returns.

The player should see the answer before needing the `?` sheet.

---

# 8. Difficulty and fun

Difficulty in THE WORKER should come from **life conflict**, not UI ambiguity.

Good difficulty:

- not enough money for shirt/trip;
- two commitments at same time;
- tell truth vs lie;
- leave a match to keep a promise;
- choose who gets a bed/seat/role;
- decide which relationship/job/route receives limited time;
- organize people without complete information;
- ownership with real conflicts and constraints.

Bad difficulty:

- finding the one hotspot that advances a hidden flag;
- knowing which room the writer intended;
- waiting for an invisible clock threshold;
- speaking to the same NPC twice because the first authored line did not set the knowledge it communicated;
- walking back into the room you are already in to trigger an ending.

---

# 9. QA / automated gameplay-flow contract

Existing dead-end/worldline tests remain.

Add a gameplay-facing QA pass with these assertions.

## 9.1 Critical explicit regressions

### A3

- after the opening beat, the hall route is immediately known/reachable;
- the player is never required to talk to Efi a second time only to unlock what he just said;
- after `entry:granted`, the next visible action is entering the hall;
- after enough exploration, the next action is returning to Efi;
- exploration completion does not unexpectedly auto-close the room before the player can react.

### 1991

- after homework choice, a visible Rachel/kitchen action explains the next beat;
- after permission yes, street/Ofir/Ussishkin becomes the next concrete action immediately;
- after permission no, at least one explicit recovery/stay/sneak action is visible;
- a player who never learned the hall still gets guided there;
- curfew produces a real leave/stay choice while the derby is alive.

## 9.2 Global “human legibility” probes

For representative state snapshots across every chapter:

- if objective is non-null and world is not busy, there is a reachable meaningful action, a valid navigation goal, or an imminent explicit time pass;
- no required checklist step depends only on a flavour hotspot;
- no pure time gate requires more than the existing quiet threshold before offering a pass;
- optional windows can be skipped without leaving the main chain in an undefined state.

## 9.3 Manual playtest matrix

Every chapter gets three runs:

1. **golden path** — player understands the intended route;
2. **messy path** — player refuses, misses, lies, arrives late, skips optional talk;
3. **confused path** — player does nothing useful for 30–60 seconds and follows only what the interface teaches.

A chapter is green only if all three produce a legible next move.

---

# 10. Acceptance standard

This pass is complete only when a full playthrough from the first memory to 2026 feels like **one life**, not a collection of technically connected chapters.

The target feeling is:

- I always know what matters now.
- I am doing things, not only choosing dialogue.
- the city/club changes around me.
- time moves when something meaningful changes.
- choices return later.
- quiet scenes are intentionally quiet.
- big historical moments are earned by the life around them.
- no room asks me to guess what the code wants.

The final test is not “can the state machine reach 2026?”.

It is:

> **Would a player keep going because the next five minutes sound fun, human and emotionally specific?**

That is the standard for every chapter in this pass.