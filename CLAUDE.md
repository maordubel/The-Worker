# THE WORKER — working notes for Claude

THE WORKER is the premium club edition of the FAN LIFE universe: a Hebrew, RTL, single-club (Hapoel Tel Aviv) football history game and the home of LIFE, the supporter life simulation, at `theworker.dubelteam.com`. Next.js 14, TypeScript, Tailwind tokens, Supabase (Football Master), Vercel. It is also the upstream of FAN LIFE's LIFE runtime and its three.js football engine: what is proven here for one club is handed to every club there.

What governs what:

- `docs/00-architecture.md` is read before changing anything structural.
- `docs/rules/` holds every standing rule, one file each, indexed by area in `docs/rules/INDEX.md`. Numbers are stable; code comments that say "rule 62" mean `docs/rules/062.md`.
- The owner founded Hapoel Ussishkin and is a source for this club's history, not a claim to be checked; he appears in the product only where a source names him (rules 17, 18).

## Working with the owner

Maor Harel owns every app here and works alone, with Claude as the whole engineering team. These are his standing decisions; each has a reason, and the reason tells you what to do in a case the line does not name.

- **Every action is done the most efficient and correct way, without his involvement.** Choose the best route for the job (CLI, API, connector, script, browser) and carry it through yourself: branch, pull request, CI, merge, migration, deploy, check on production. He authorised Claude to merge. Never hand him a step you can do, and never pick a slower route because it is the one a person would click through. Only what truly needs him (an approval, a secret only he holds, a login) reaches him, reduced to the shortest possible step and listed at the end of the report.
- **No ZIP when you can merge.** Deliver through the repository.
- **Reports are short and businesslike**, outcome first, no tour of the steps. He writes in Hebrew, so answer in Hebrew. Product copy, marketing and code are English unless this file says otherwise.
- **Free tiers only.** Say so before a limit is near; never adopt a paid service without his yes.
- **Anything that cannot be undone waits for his yes**: deleting data, dropping objects, the Auth Site URL, domains, a new kind of public posting. Prepare everything, then ask one question.
- **Every schedule is Europe/Athens time.** Nothing personal about the owner appears in a product, in content or in marketing; public accounts are business accounts only.
- **Design is original and built for the phone first.** Each product has its own identity (never a template), mobile and desktop are two designs, touch targets are at least 44px, and the Dubel Team credit stays in the footer.
- **Say what you noticed.** If you see an upgrade, a reuse or a risk beyond the task, give it one line at the end of the report. He asked for this.

## How to work a task

The order matters more than any single step: most past failures here came from acting on a remembered picture of the code or the database instead of the current one.

1. **Read before you reason.** Start from `origin/main` as it is now, the live database object (`pg_get_functiondef`, `list_tables`) and the page on production. Several sessions change these repositories every day, so what an earlier session knew is a hypothesis to check, not a fact.
2. **Load what the task touches, not everything.** Open `docs/rules/INDEX.md`, find the area you are about to change and read those rule files. Then the contract and the capability list if the change crosses an app boundary. Reading all 117 rules up front spends the context the task needs.
3. **Run the universe check** (next section) before you design, and write its four answers in the pull request description.
4. **Find the cause before you fix.** Reproduce or measure first, then change one thing. A guard that goes red after a data change is read, not muted: it is usually right.
5. **Prove the result.** A claim is established by the script, test or screenshot that shows it. In the report, separate what you verified from what you did not. "Should work" is not a state.
6. **Work wide in parallel.** Send independent reads and searches in one batch. Use a subagent for a sweep across many files or across the other repositories, and keep the decisions in the main thread.
7. **Finish whole.** Tests, green CI, merge, the production check, then the record: the `ecosystem/capabilities.json` row if you built something reusable, a new rule file if the owner decided something or a lesson cost a broken build, and the status line in the Football Master project doc if a planned connection moved.
8. **Keep this file small.** It is loaded into every session, so every paragraph here is paid for on every task. A new decision or lesson is a file in `docs/rules/` plus one line in its index, never a section here.

## The universe check

This app is one of five that share one account, one database and one map. The map is `ecosystem/contract.json` (who owns what) and `ecosystem/capabilities.json` (every engine that already exists, where it lives and who could use it). Both are the same bytes in every repository. The house skill `dubel-universe` runs this check; `ecosystem-sync` runs before anything that touches Supabase, auth, domains or `ecosystem/`.

| App | Role | Moment it owns |
|---|---|---|
| FAN LIFE · `maordubel/fanlife` | the hub: every journey starts here and comes back here | sends `before_round`, `kickoff_live`, `go_deeper`, `derby_only` |
| DUBID · `maordubel/Dubid` | companion before the round (fantasy picks) | `next_moment` to OFFSIDES, `back_to_story` to the hub |
| OFFSIDES · `maordubel/Offsides` | companion at kick-off and live (prediction arenas) | `next_moment` to DUBID, `back_to_story` to the hub |
| THE WORKER · `maordubel/The-Worker` | the premium club edition (Hapoel Tel Aviv) | `bring_depth_back` to the hub |
| FUCK YOU · `maordubel/FuckYou` | a derby-days-only side experience | `back_to_story` to the hub |

A companion is "a smart companion, never a replacement": it sends the supporter back to the hub as readily as the hub sends them out.

Answer these four in one line each, before building:

1. **Does this engine already exist?** Look it up in `ecosystem/capabilities.json`. If it does, reuse it through its owner (a shared view or RPC, a route, a handoff). Copying source between repositories is a fork, and forks are how three shirt engines came to exist.
2. **Which moment does it fire?** A link to another app is built with `createHandoff` from `ecosystem/sdk.ts` and carries its moment; the target reports `shared.handoff_outcome`. A bare URL with UTM is invisible to the funnel, and an invisible link cannot be improved.
3. **Who else gains from it?** Name the app, the marketing slot or the page that could consume what you are building. Record it as `couldUse` in the capability row. If nobody, say so.
4. **What does it cost on the free tier?** Football Master is capped at 500MB and was at 469MB on 9.11.2026: a table that grows per minute or per match ships with its retention job in the same pull request. No new paid service. Vercel Hobby is non-commercial.

Lines that do not bend, because another app breaks when they do:

- An app writes only what it owns. THE WORKER owns no migrations of its own: `public.worker_*` is written in FAN LIFE and mirrored here byte for byte, and this app writes those tables only through FAN LIFE's RPCs. Everything else is read through views and RPCs in `shared` and `core`, never by reading another app's tables.
- Value crosses apps only through `shared.grant_reward`. Currencies never mix.
- Before changing a database object, read the live one. Never rebuild a live function from a file in the repository.
- No trigger on `auth.users`, no change to the Auth Site URL, sign-out stays local.
- `ecosystem/` is byte-identical in all five repositories. A change there, or to `core`, `shared` or the contract, is a five-repository change in the same round with the contract version bumped.
- One crest library (`ecosystem/crests`, sourced from OFFSIDES). One provider reader (`ecosystem/feed`). No second copy of either.

## How THE WORKER feeds the hub, and is fed by it

- **Depth is built here first, then handed up.** LIFE (`lib/life`) and the football engine (`lib/life/football`) are consumed by FAN LIFE through its upstream import. Write them club-agnostic where it costs nothing: a mission reads the club through its archive, so every FAN LIFE club can be handed the same newest LIFE.
- **When you change LIFE, say what FAN LIFE has to pick up.** Put it in the pull request description: files, any new asset, any change to the save format. A silent change here is a broken import there.
- **`go_deeper` arrives here, `bring_depth_back` leaves.** A supporter who came from a FAN LIFE club page gets a way back to the hub with their progress acknowledged, through `createHandoff`.
- **Reuse the hub's engines.** Share cards, kits, sourced trivia and seeded rounds have their canonical copy in FAN LIFE (see `ecosystem/capabilities.json`). Where this repository still carries its own copy, keep the two in step and do not let them diverge in behaviour.
- **The engine has a second life outside the game.** The 3D football engine can replay a historic goal for gate 8 and for Shorts in the hub's video engine. When you add a capability to it, record who else could use it.

## This repository's own lines

- Hebrew and RTL first: logical properties only, every string through `messages/he.json` and `t()` (rules 9, 10).
- Two scoped design systems, the shell and the press layer, and no yellow in either except the named, approved file paths (rules 8, 61, 62, 69).
- One shared data engine; every fact carries `source_id` and `confidence`; ingestion never invents; football and basketball never share canonical records (rules 1, 2, 6, 11).
- A derby means Maccabi Tel Aviv and nothing else (rule 13).
- LIFE is a game runtime, not a fourteenth gate, and a player can never be stuck (rules 39, 75).
- The Supabase project is shared: THE WORKER touches only what it created (rule 89).
- A new rule is its own file in `docs/rules/` and one line in `docs/rules/INDEX.md`.

## Commands

```
npm run lint · npm run typecheck · npm run test · npm run build
npm run repo:hygiene        # nothing but README.md and CLAUDE.md at the root
npm run ingest:dry          # stage and report, no database
npm run story:overlap       # needs a dev server; fails on any collision
npm run qa:sweep            # routes x widths: overflow, console errors, yellow
```

## Skills that apply

`dubel-universe`, `ecosystem-sync` and `the-worker-studio` first. Then by task: `hapoel-tel-aviv-facts`, `football-data`, `supabase-server-authority`, `frontend-standards`, `brand-concept`, `responsive-qa`, `measure-before-you-fix`, `dubel-credit`. Check the installed skills before starting any task.

## When this file and the code disagree

The code and the live database are the truth; this file is the map. Fix the map in the same pull request, and keep the fix as short as the thing it corrects.
