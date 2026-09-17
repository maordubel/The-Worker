-- =====================================================================
-- הצד של האדם — the PLAYER side of the database.
-- =====================================================================
--
-- Everything applied before this file is the ARCHIVE: clubs, matches, people, squads,
-- kits, trivia. It answers "what happened". This file answers the other question —
-- **who is playing, and what did they do** — and it exists because Maor asked for a
-- portal that "holds all the information, talks to itself, uses the data correctly and
-- creates exact synchronisation".
--
-- Today it does none of that. The portal is five unrelated `localStorage` keys
-- (`worker.profile.v1`, `worker.ballot.v1`, `worker.kits.v1`, `worker.xi.v1`,
-- `the-worker:life`) with no server and no identity behind them. A supporter who builds
-- a shirt on his phone and plays the trivia on a laptop is two different people to this
-- app, and the polls wing cannot count a terrace because it has exactly one voter.
--
-- Four rules shape every table below, and all four are rules this repo already has:
--
--   · **RLS on every table, with the policy written out** (core schema §11). A table
--     with RLS on and no policy is not an oversight here — it is the strongest
--     statement available, and `poll_vote` uses it on purpose. See §3.
--   · **Grading and counting happen in Postgres** (rule 4). `rpc_record_run` carries a
--     client-supplied idempotency key, exactly like `answer_log.idempotency_key`.
--   · **A log, never a blob** (rule 39). `life_save` is rows, so the move from
--     `localStorage` is an INSERT rather than a migration — which is what the engine's
--     append-only `LifeEvent[]` was designed for in the first place.
--   · **Nothing is invented** (rule 11). There is no baseline vote, no seeded row and
--     no back-filled counter anywhere in this file.
--
-- ---------------------------------------------------------------------
-- `app_profile` and `app_user` — two tables, one person, and why both.
-- ---------------------------------------------------------------------
-- The core schema already has `app_user`, and `game_session` / `answer_log` /
-- `user_progress` carry foreign keys to it. That table belongs to the server-graded
-- trivia loop rule 4 describes (`rpc_next_question` / `rpc_submit_answer`), which is
-- still `not implemented`. `app_profile` is a different claim: the CARD — the member
-- number, the date the person started, the display name — the things `lib/game/member.ts`
-- and `lib/profile/store.ts` keep on the device today.
--
-- Two rows keyed on the same `auth.users.id` is a real risk of the "two spellings of one
-- concept" failure (rule 59), so the seam is closed rather than described: ONE trigger
-- on `auth.users` writes BOTH rows, so they cannot diverge and no code path has to
-- remember to create the other one.

-- =====================================================================
-- 1. app_profile — הכרטיס
-- =====================================================================
create table if not exists app_profile (
  id           uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  -- מספר המנוי — the file number on the card. `lib/game/member.ts` mints it as
  -- `TIK-0417` and says the one thing that matters about it: it cannot be re-earned.
  -- So it is unique, nullable until a device claims one, and protected by a trigger
  -- rather than by a comment — see `app_profile_keep_identity` below.
  member_no    text unique,
  -- מאז — the day this person first played anything, on ANY device. Only ever moves
  -- backwards. A newer phone signing in for the first time carries today's date and
  -- must not be allowed to overwrite a card that started in 2026.
  since        date not null default current_date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

/*
 * שתי עובדות שלא נכתבות מחדש — enforced in the database, not in the client.
 *
 * `member_no` and `since` are the two fields on the card that a second device can only
 * damage. Every other number on the profile is a counter that a max() merge settles
 * safely; these two are not counters. A merge function in TypeScript already refuses to
 * overwrite them (`lib/portal/merge.ts`), and that refusal is worth exactly as much as
 * the next person who writes a second sync path — so the table refuses too.
 *
 * `member_no`: once non-null it is frozen. Clearing it or changing it is rejected.
 * `since`:     always the EARLIER of what is stored and what is being written.
 */
create or replace function app_profile_keep_identity() returns trigger
language plpgsql as $$
begin
  if old.member_no is not null and new.member_no is distinct from old.member_no then
    raise exception 'member_no cannot be re-issued: % is already on this card', old.member_no;
  end if;
  new.since := least(old.since, new.since);
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists app_profile_identity on app_profile;
create trigger app_profile_identity before update on app_profile
  for each row execute function app_profile_keep_identity();

/*
 * One person, two rows, one trigger.
 *
 * `app_user` is the archive side's row (core schema §8) and is created here as well, so
 * that the day `rpc_submit_answer` is implemented there is no user who can play and
 * cannot be scored. `on conflict do nothing` keeps it idempotent, and the function is
 * `security definer` because it runs as the auth admin inserting into `public`.
 */
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into app_profile (id, display_name)
    values (
      new.id,
      -- Google hands back `full_name`; a provider that does not is left null rather
      -- than having a name derived from the address. An email is not a name.
      nullif(coalesce(new.raw_user_meta_data ->> 'full_name', ''), '')
    )
    on conflict (id) do nothing;

  -- Guarded on the table existing, because the failure mode if it does not is the worst
  -- one available: sign-up itself would raise, and nobody could create an account at all.
  -- A portal that works without the archive side is better than a door that throws.
  if to_regclass('public.app_user') is not null then
    insert into app_user (id, display_name)
      values (new.id, nullif(coalesce(new.raw_user_meta_data ->> 'full_name', ''), ''))
      on conflict (id) do nothing;
  end if;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

/*
 * מי שנרשם לפני הקובץ הזה — the backfill, run once and safe to run again.
 *
 * A trigger only fires for the next person. Anybody who signed in to this project before
 * this migration existed would have no card at all — and `gate_run.user_id` points at
 * `app_profile`, so every round they finished would fail a foreign key and vanish
 * silently. A row that cannot be written is bad; a row that cannot be written and says
 * nothing is the shape of bug this repo keeps finding.
 *
 * `since` is taken from the account's own creation date rather than from today, because
 * that is the day the person actually started, and `since` is the one field this schema
 * refuses to let move forward later.
 */
insert into app_profile (id, display_name, since)
  select u.id,
         nullif(coalesce(u.raw_user_meta_data ->> 'full_name', ''), ''),
         u.created_at::date
  from auth.users u
  on conflict (id) do nothing;

do $$
begin
  if to_regclass('public.app_user') is not null then
    insert into app_user (id, display_name)
      select u.id, nullif(coalesce(u.raw_user_meta_data ->> 'full_name', ''), '')
      from auth.users u
      on conflict (id) do nothing;
  end if;
end $$;

-- =====================================================================
-- 2. gate_run — סבב שהסתיים
-- =====================================================================
--
-- One row per FINISHED round, which is the same moment `components/play/RecordRun.tsx`
-- reports on the device: a round that was opened and walked away from is not a round.
--
-- `gate` is the route path as `gateId()` in `lib/profile/standing.ts` normalises it —
-- `/xi`, `/kits/build`, `/trivia/general`. Not the gate NUMBER, for the reason that file
-- already gives: the numbers are Bloomfield's and a wing has sub-routes under one number,
-- so `/trivia` and `/trivia/general` would collapse onto gate 2 and stop being tellable
-- apart. The path is what the device already keys its profile on, so the two sides of the
-- sync agree by construction rather than by a mapping table somebody has to maintain.
create table if not exists gate_run (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references app_profile(id) on delete cascade,
  gate            text not null check (gate like '/%'),
  -- which deck this round came out of (`lib/rotation/deck.ts`). Null for the wings,
  -- which deal no round — `/xi`, `/kits`, `/polls` report a deed, not a seed.
  seed            bigint check (seed is null or seed > 0),
  score           integer  not null default 0 check (score >= 0),
  asked           smallint not null default 0 check (asked >= 0),
  correct         smallint not null default 0 check (correct >= 0),
  played_on       date not null default current_date,
  played_at       timestamptz not null default now(),
  -- 'session:question' is the shape the core schema uses; here it is one key per RUN,
  -- minted once by the client when the round starts and re-sent on every retry.
  idempotency_key text not null,
  created_at      timestamptz not null default now(),
  -- A round cannot be more right than it was long.
  constraint gate_run_correct_sane check (correct <= asked),
  unique (user_id, idempotency_key)
);

create index if not exists gate_run_user_idx on gate_run (user_id, played_on desc);
create index if not exists gate_run_gate_idx on gate_run (user_id, gate);

-- =====================================================================
-- 3. poll_vote — הקלפי
-- =====================================================================
--
-- The shape here is not a choice made in this file. `lib/polls/store.ts` has carried it
-- as a written commitment since the wing was built: `poll_vote (device_id, question_id,
-- pick, voted_at)` with a unique key on `(device_id, question_id)` "so a changed mind
-- updates rather than stuffs the box". That is honoured exactly.
--
-- ---------------------------------------------------------------------
-- הכרעת הפרטיות — the tally is public, the vote is not attributable.
-- ---------------------------------------------------------------------
-- This table has RLS enabled and **no policy of any kind** — no select, no insert, no
-- update, no delete. That is the same construction rule 4 uses for `trivia_answer`, used
-- here for the opposite-looking reason, and it is a decision rather than a default:
--
--   · **The count must be public**, or gate 7 can never do the one thing it exists for.
--     `lib/polls/board.ts` will not print a percentage under a hundred ballots and says
--     out loud that there is no count yet (`poll.noCount`); it needs real numbers to
--     stop saying that, and those numbers belong to everybody who voted.
--   · **A vote must not be attributable.** So `user_id` is NOT on this table. It is not
--     omitted for tidiness — a column that links a person to a pick is a column that can
--     be read, subpoenaed, leaked or joined, and the only version of "we do not know who
--     voted for whom" worth writing down is the one where the row cannot answer the
--     question. `device_id` is an opaque random id minted in the browser
--     (`lib/portal/device.ts`); it is what stops one device voting eight times on one
--     question, and it is deliberately not a person.
--   · **And the ROWS are not public either.** `select using (true)` was the obvious
--     policy and it is wrong: eight rows sharing one `device_id` are one supporter's
--     whole ballot, which is a fingerprint even with no name on it. Nobody needs the
--     rows. Everybody needs the counts.
--
-- So the table is reachable only through two `security definer` functions: a vote goes
-- in through `rpc_poll_vote` and comes back out only as a count, through
-- `rpc_poll_tally`. Aggregate out, never rows out.
--
-- **What this does NOT claim.** An anonymous ballot with no account cannot stop somebody
-- minting device ids in a loop; the unique key stops accidental double-voting and casual
-- repeat votes, not a determined stuffer. That is stated here rather than implied,
-- because the wing's whole argument is that it does not pretend about numbers (rule 11).
create table if not exists poll_vote (
  id          uuid primary key default gen_random_uuid(),
  device_id   text not null check (length(device_id) between 8 and 64),
  question_id text not null,
  pick        text not null check (length(pick) between 1 and 120),
  voted_at    timestamptz not null default now(),
  unique (device_id, question_id)
);

create index if not exists poll_vote_question_idx on poll_vote (question_id);

-- =====================================================================
-- 4. kit_built · xi_pick — שני האוספים
-- =====================================================================
--
-- `lib/kit/collection.ts` and `lib/xi/store.ts` are the two device stores that already
-- declare a `remote` flag and say in their own headers that an account turns them into
-- one line. These are the tables behind that line, keyed per USER (unlike the ballot,
-- where being keyed per user is the thing that would break it).
create table if not exists kit_built (
  user_id        uuid not null references app_profile(id) on delete cascade,
  season_label   text not null,
  variant        text not null check (variant in ('home','away','third')),
  -- A shirt enters the collection when it is ASSEMBLED, at any score (rule 24, gate 5).
  first_built_on date not null default current_date,
  best_parts     smallint not null default 0 check (best_parts between 0 and 5),
  times          integer  not null default 1 check (times > 0),
  updated_at     timestamptz not null default now(),
  primary key (user_id, season_label, variant)
);

create table if not exists xi_pick (
  user_id   uuid not null references app_profile(id) on delete cascade,
  -- 'best' is הרכב כל הזמנים, 'worst' is the supporter's OWN worst eleven. The second is
  -- an opinion and the app never ranks anybody (rule 74) — which is a product rule, but
  -- it is the reason the two sheets are one column and not two tables.
  tab       text not null check (tab in ('best','worst')),
  formation text not null,
  -- slot id → roster SLUG. Slugs, never names: a name freezes a spelling the archive is
  -- still correcting (`lib/xi/store.ts`).
  picks     jsonb not null default '{}'::jsonb,
  saved_on  date not null default current_date,
  updated_at timestamptz not null default now(),
  primary key (user_id, tab)
);

-- =====================================================================
-- 5. life_save — יומן החיים
-- =====================================================================
--
-- Rule 39: the save is an append-only `LifeEvent[]` and `LifeState` is what you get by
-- folding it, so "the eventual move to Supabase is an insert rather than a migration".
-- This is that insert. One ROW per event, not one JSON document per life — a blob would
-- be a snapshot with extra steps, and every property the log was chosen for (a chapter
-- can be rewritten without breaking a save; an unknown event from a newer build folds to
-- a no-op) dies the moment the whole file is overwritten on each save.
--
-- `seq` is the event's index in the log, assigned by the client, never wall clock —
-- the same choice `match_event.seq` makes and for the same reason.
create table if not exists life_save (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references app_profile(id) on delete cascade,
  -- One person may keep more than one life. Today the engine writes a single key, so
  -- this is 'default'; it costs one column now and a whole migration later.
  life_id      text not null default 'default',
  seq          integer not null check (seq >= 0),
  -- The event exactly as `lib/life/events.ts` wrote it: `{ t: 'moved', to: 'street' }`.
  -- Not normalised into columns — the reducer is the only thing that knows what an
  -- event means, and a schema that parsed them here would be a second one that thinks
  -- it does.
  event        jsonb not null,
  -- `SAVE_VERSION` from `lib/life/save.ts`, carried per row so a log written across a
  -- version bump can still say which build wrote which row.
  save_version smallint not null default 4,
  recorded_at  timestamptz not null default now(),
  unique (user_id, life_id, seq)
);

-- No separate index: `unique (user_id, life_id, seq)` already builds exactly the one a
-- fold of the log walks, and a second copy of it would be an index nobody reads and
-- everybody's insert pays for.

-- Append-only, enforced by trigger and not by convention — `match_event` again.
create or replace function life_save_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'life_save is append-only: a life is a log, append the next event instead';
end $$;

drop trigger if exists life_save_no_update on life_save;
create trigger life_save_no_update before update on life_save
  for each row execute function life_save_immutable();
drop trigger if exists life_save_no_delete on life_save;
create trigger life_save_no_delete before delete on life_save
  for each row execute function life_save_immutable();

/*
 * נקודת השמירה — beside the journal, never inside it.
 *
 * `lib/life/checkpoint.ts` keeps the needle's position inside a directed master event
 * NEXT to the log, and says why in one sentence: "it is not something that happened to
 * the boy; it is where the record player was when the power went out." A table that put
 * it in `life_save` would make it an event, and it would then be folded by a reducer
 * that has no business knowing about it. So it is one mutable row per life, and it is
 * the only mutable thing in this section.
 */
create table if not exists life_checkpoint (
  user_id    uuid not null references app_profile(id) on delete cascade,
  life_id    text not null default 'default',
  checkpoint jsonb,
  year       integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, life_id)
);

-- =====================================================================
-- 6. RLS — חובה, ועם מדיניות כתובה לכל טבלה
-- =====================================================================
alter table app_profile     enable row level security;
alter table gate_run        enable row level security;
alter table poll_vote       enable row level security;
alter table kit_built       enable row level security;
alter table xi_pick         enable row level security;
alter table life_save       enable row level security;
alter table life_checkpoint enable row level security;

-- app_profile — a person reads and updates their own card, and nobody else's. No insert
-- policy: the row is created by the trigger on `auth.users`, so there is no code path
-- that needs to make one and therefore no policy that has to allow it. No delete policy:
-- the cascade from `auth.users` is the only way a card goes away.
drop policy if exists app_profile_read on app_profile;
create policy app_profile_read on app_profile
  for select using (id = auth.uid());
drop policy if exists app_profile_write on app_profile;
create policy app_profile_write on app_profile
  for update using (id = auth.uid()) with check (id = auth.uid());

-- gate_run — insert and read your own rows only.
--
-- The insert policy exists as well as `rpc_record_run` on purpose: the RPC is what a
-- client calls (it is idempotent and it touches the card), and the policy is what keeps
-- a direct insert from ever writing a row under somebody else's name if one is ever made.
-- Neither update nor delete: a finished round is a fact, and a card whose history can be
-- edited is a scoreboard (`lib/game/member.ts`).
drop policy if exists gate_run_read on gate_run;
create policy gate_run_read on gate_run
  for select using (user_id = auth.uid());
drop policy if exists gate_run_insert on gate_run;
create policy gate_run_insert on gate_run
  for insert with check (user_id = auth.uid());

-- poll_vote — NO POLICY. Read §3: the count is public through `rpc_poll_tally`,
-- the rows are nobody's business, and the table cannot name a voter because it holds
-- no user_id to name one with.

-- kit_built · xi_pick — your collection, all four verbs, your rows only.
drop policy if exists kit_built_self on kit_built;
create policy kit_built_self on kit_built
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists xi_pick_self on xi_pick;
create policy xi_pick_self on xi_pick
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- life_save — read and append your own life. Update and delete are refused by the
-- trigger above whoever asks, so no policy is written for them: a policy that permitted
-- what the table rejects would be a sentence that reads as permission and is not.
drop policy if exists life_save_read on life_save;
create policy life_save_read on life_save
  for select using (user_id = auth.uid());
drop policy if exists life_save_append on life_save;
create policy life_save_append on life_save
  for insert with check (user_id = auth.uid());

drop policy if exists life_checkpoint_self on life_checkpoint;
create policy life_checkpoint_self on life_checkpoint
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- =====================================================================
-- 7. סמכות השרת — the RPCs
-- =====================================================================

/*
 * rpc_record_run — a finished round, written once however many times it is sent.
 *
 * Shaped after `rpc_submit_answer` (rule 4): `security definer`, `search_path` pinned,
 * and idempotent on a key the CLIENT supplies. The client mints one key per run when the
 * round starts and re-sends it on every retry, so a dropped response, a double-invoked
 * effect (`components/play/RecordRun.tsx` already guards one of those with a ref) and a
 * flaky connection all resolve to the same single row.
 *
 * It also touches the card, which is the whole "talk to itself" requirement in one
 * statement: `since` walks back to the earliest day this person is known to have played,
 * and never forward. The trigger in §1 would refuse it anyway; `least()` here means the
 * refusal never has to fire.
 */
create or replace function rpc_record_run(
  p_key       text,
  p_gate      text,
  p_score     integer default 0,
  p_asked     integer default 0,
  p_correct   integer default 0,
  p_seed      bigint  default null,
  p_played_on date    default null
) returns table (run_id uuid, first_time boolean)
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_day  date := coalesce(p_played_on, current_date);
  v_id   uuid;
begin
  if v_user is null then
    raise exception 'rpc_record_run requires a signed-in user';
  end if;
  if p_key is null or length(trim(p_key)) = 0 then
    raise exception 'rpc_record_run requires an idempotency key';
  end if;

  insert into gate_run (user_id, gate, seed, score, asked, correct, played_on, idempotency_key)
    values (v_user, p_gate, p_seed, greatest(coalesce(p_score, 0), 0),
            coalesce(p_asked, 0), coalesce(p_correct, 0), v_day, p_key)
    on conflict (user_id, idempotency_key) do nothing
    returning id into v_id;

  if v_id is null then
    -- Already recorded. The first answer is the answer — return it, do not write again.
    select id into v_id from gate_run
      where user_id = v_user and idempotency_key = p_key;
    return query select v_id, false;
    return;
  end if;

  update app_profile
     set since = least(since, v_day),
         updated_at = now()
   where id = v_user;

  return query select v_id, true;
end $$;

/*
 * rpc_poll_vote — one device, one question, one pick; a changed mind updates.
 *
 * A vote is cast through a function rather than through an insert policy because the
 * table has no policies at all (§3). The function takes the device id from the caller —
 * it cannot be derived from anything the server knows, which is exactly the property
 * that makes the ballot anonymous — and it returns nothing. A cast vote produces no
 * readable row, only a bigger count.
 */
create or replace function rpc_poll_vote(
  p_device_id   text,
  p_question_id text,
  p_pick        text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_device_id is null or length(p_device_id) < 8 then
    raise exception 'a vote needs a device id';
  end if;
  if p_pick is null or length(trim(p_pick)) = 0 then
    raise exception 'a vote needs a pick';
  end if;

  insert into poll_vote (device_id, question_id, pick, voted_at)
    values (p_device_id, p_question_id, trim(p_pick), now())
    on conflict (device_id, question_id)
      do update set pick = excluded.pick, voted_at = now();
end $$;

/*
 * rpc_poll_tally — counts, never voters.
 *
 * Returns `(pick, votes)` for one question and nothing else: no device id, no timestamp,
 * no row identity, nothing that could be assembled back into a ballot. `stable` because
 * it only reads, and readable by `anon` because the count board is a public screen —
 * a supporter who has not signed in still gets to see what the terrace said.
 *
 * It does NOT apply the hundred-ballot rule. That belongs to `lib/polls/board.ts`, which
 * already owns it and is tested against fixtures; two places deciding when a percentage
 * is honest is how the two drift apart (rule 59).
 */
create or replace function rpc_poll_tally(p_question_id text)
returns table (pick text, votes bigint)
language sql stable security definer set search_path = public as $$
  select pick, count(*)::bigint as votes
  from poll_vote
  where question_id = p_question_id
  group by pick
  order by count(*) desc, pick;
$$;

revoke all on function rpc_record_run(text,text,integer,integer,integer,bigint,date) from public;
revoke all on function rpc_poll_vote(text,text,text)                                  from public;
revoke all on function rpc_poll_tally(text)                                           from public;

grant execute on function rpc_record_run(text,text,integer,integer,integer,bigint,date) to authenticated;
-- The ballot is deliberately open to a supporter who has not signed in: gate 7 is a
-- public wing, and requiring an account to vote would be the quietest possible way of
-- turning an anonymous ballot into an identified one.
grant execute on function rpc_poll_vote(text,text,text) to anon, authenticated;
grant execute on function rpc_poll_tally(text)          to anon, authenticated;

-- =====================================================================
-- 8. מה כל טבלה — in Hebrew, like every other migration in this folder
-- =====================================================================
comment on table app_profile is
  'הכרטיס — שורה אחת לכל משתמש מחובר: שם תצוגה, מספר מנוי שאי אפשר להנפיק מחדש, ותאריך '
  'ההתחלה שרק הולך אחורה. מי שמשחק, לא מה שקרה.';
comment on table gate_run is
  'סבב שהסתיים — שורה אחת לכל סבב שנגמר, לפי נתיב השער. לא סבב שנפתח ולא סבב שננטש.';
comment on table poll_vote is
  'הקלפי — קול אחד למכשיר לכל שאלה בשער 7. אין בשורה משתמש, ואין לטבלה שום מדיניות: '
  'הקול נכנס דרך rpc_poll_vote ויוצא רק כספירה דרך rpc_poll_tally.';
comment on table kit_built is
  'אוסף החולצות — חולצה נכנסת כשמרכיבים אותה בשער 4, בכל ניקוד.';
comment on table xi_pick is
  'שני הגיליונות של שער 1 — הרכב כל הזמנים וההרכב הגרוע. סלאגים בלבד, אף פעם לא שמות.';
comment on table life_save is
  'יומן החיים — שורה אחת לכל אירוע, מוסיפים בלבד. המצב הוא מה שמקבלים מקיפול היומן.';
comment on table life_checkpoint is
  'נקודת השמירה של אירוע־אב — ליד היומן ולא בתוכו. זה לא משהו שקרה לילד.';

comment on column app_profile.member_no is
  'מספר המנוי מ-lib/game/member.ts. ברגע שנכתב הוא קפוא — טריגר דוחה כל שינוי.';
comment on column app_profile.since is
  'רק אחורה. מכשיר חדש שנכנס היום לא דורס כרטיס שהתחיל לפני שנה.';
comment on column gate_run.gate is
  'נתיב השער כפי ש-gateId() כותב אותו: /xi, /kits/build, /trivia/general. לא מספר השער.';
comment on column gate_run.idempotency_key is
  'מפתח שהלקוח מייצר פעם אחת לסבב ושולח שוב בכל ניסיון חוזר. שליחה כפולה מחזירה את השורה הראשונה.';
comment on column poll_vote.device_id is
  'מזהה אקראי של מכשיר (lib/portal/device.ts). לא אדם, ולא ניתן לקישור לאדם.';
comment on column life_save.event is
  'האירוע כפי ש-lib/life/events.ts כתב אותו. לא מפורק לעמודות — רק הרדיוסר יודע מה אירוע אומר.';
