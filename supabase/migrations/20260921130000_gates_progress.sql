-- =====================================================================
-- שכבת ההתקדמות — כרטיס העובד, האוספים, ותעודת האוהד (21.9.2026)
-- =====================================================================
--
-- `20260917090000_portal_identity.sql` gave the account a card row and a row per finished
-- round. Three things still lived on one device only, and this file moves them up:
--
--   1. **The Worker Card** (gate 10) — the nickname, the shirt number and what the person
--      declared about themselves (`book.card` in `lib/game/member.ts`). It merges across
--      devices as ONE unit, newest edit first, and the table enforces that below.
--   2. **Collections** — the Ussishkin cards, gate 4's shirts, gate 12's saved items,
--      gate 13's routes. On the device they are sets of ids; here they are ROWS, one per
--      item, grow-only, so the union merge `lib/portal/merge.ts` already runs becomes exact
--      across devices. A removal is never a delete: it is a second set (`<set>~`) or a
--      parity token (`id#2`) — see `lib/profile/store.ts`.
--   3. **Gate 7's seal** — the supporter's favourite, position and reasons, as ids and
--      message keys. On the owner's own row only; the ballot itself stays in `poll_vote`,
--      which still has no user id and no policy (rule 76). Nothing here joins the two.
--
-- **Additive and idempotent.** Every statement is `if not exists`, `drop … if exists` +
-- create, or `create or replace`. Running this file twice changes nothing the second
-- time, and nothing in it drops or rewrites an existing column or row.
--
-- **The app does not wait for it.** Until this file is run, `lib/portal/sync.ts` reads and
-- writes exactly what the 17.9.2026 file offers, and everything here stays on the device.
-- The card, the collections and the seal start travelling the first sync after it runs.
-- ---------------------------------------------------------------------

do $$
begin
  if to_regclass('public.app_profile') is null then
    raise exception 'הריצו קודם את 20260917090000_portal_identity.sql — הטבלה app_profile חסרה';
  end if;
end $$;

-- ---------------------------------------------------------------------
-- §1 · הכרטיס — four columns on the account's own row
-- ---------------------------------------------------------------------

alter table app_profile add column if not exists card           jsonb;
alter table app_profile add column if not exists card_edited_at timestamptz;
alter table app_profile add column if not exists shirt_number   smallint;
alter table app_profile add column if not exists supporter      jsonb;

-- A card is a handful of chips and ids. 2 KB is ten times what the app writes, and a
-- ceiling is what keeps an owner-writable jsonb column from becoming somebody's storage.
alter table app_profile drop constraint if exists app_profile_card_shape;
alter table app_profile add constraint app_profile_card_shape
  check (card is null or (jsonb_typeof(card) = 'object' and octet_length(card::text) <= 2048));

alter table app_profile drop constraint if exists app_profile_supporter_shape;
alter table app_profile add constraint app_profile_supporter_shape
  check (supporter is null or (jsonb_typeof(supporter) = 'object' and octet_length(supporter::text) <= 2048));

alter table app_profile drop constraint if exists app_profile_shirt_number_range;
alter table app_profile add constraint app_profile_shirt_number_range
  check (shirt_number is null or shirt_number between 1 and 99);

/*
 * העריכה החדשה מנצחת — enforced here as well as in `lib/portal/merge.ts editWinner`.
 *
 * The name, the number and the card are one unit. A device whose clock is behind, or a
 * sync that raced an edit on another phone, must not put an OLDER edit over a newer one —
 * so an update that carries an older `card_edited_at` (or clears it) keeps the unit that
 * is already here. Same shape as `app_profile_keep_identity`: the TypeScript refuses, and
 * so does the table, because the next sync path will not have read the TypeScript.
 *
 * The seal is its own clock: the NEWER `sealedOn` wins.
 */
create or replace function app_profile_keep_newest_card() returns trigger
language plpgsql as $$
begin
  if old.card_edited_at is not null
     and (new.card_edited_at is null or new.card_edited_at < old.card_edited_at) then
    new.card           := old.card;
    new.card_edited_at := old.card_edited_at;
    new.shirt_number   := old.shirt_number;
    new.display_name   := old.display_name;
  end if;
  if old.supporter is not null
     and (new.supporter is null
          or coalesce(new.supporter ->> 'sealedOn', '') < coalesce(old.supporter ->> 'sealedOn', '')) then
    new.supporter := old.supporter;
  end if;
  return new;
end $$;

drop trigger if exists app_profile_newest_card on app_profile;
create trigger app_profile_newest_card before update on app_profile
  for each row execute function app_profile_keep_newest_card();

-- ---------------------------------------------------------------------
-- §2 · האוספים — one row per collected item, grow-only
-- ---------------------------------------------------------------------

create table if not exists profile_item (
  user_id  uuid not null references app_profile(id) on delete cascade,
  -- `ussishkin`, `kits`, `archive.mine`, `thread.routes`, `archive.mine~` (a tombstone
  -- set). Lower-case ids only; a preference set never leaves the device at all.
  set_id   text not null check (set_id ~ '^[a-z0-9][a-z0-9._~-]{0,47}$'),
  -- whatever the set holds: a slug, a kit key (`1984/85|home`), a parity token (`id#3`)
  item_id  text not null check (char_length(item_id) between 1 and 128 and item_id !~ '[[:cntrl:]]'),
  added_on date not null default current_date,
  primary key (user_id, set_id, item_id)
);

alter table profile_item enable row level security;

drop policy if exists profile_item_read on profile_item;
create policy profile_item_read on profile_item
  for select using (user_id = auth.uid());

-- No insert, update or delete policy, on purpose: the only way in is `rpc_collect`, and
-- there is no way out. A set that can only grow is a set a union merge settles exactly.
revoke insert, update, delete on profile_item from anon, authenticated;
grant select on profile_item to authenticated;

/*
 * rpc_collect — ids into one of the caller's sets. Idempotent: an id already there is
 * skipped, so a retry, a double tap and a full re-push after a sync all write nothing
 * new. Returns how many ids were new. Ids that are empty, too long or carry control
 * characters are dropped, not raised — one bad id must not cost the other 199.
 */
create or replace function rpc_collect(p_set text, p_ids text[])
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_new  integer := 0;
begin
  if v_user is null then
    raise exception 'rpc_collect requires a signed-in user';
  end if;
  if p_set is null or p_set !~ '^[a-z0-9][a-z0-9._~-]{0,47}$' then
    raise exception 'rpc_collect: bad set id';
  end if;
  if p_ids is null or cardinality(p_ids) = 0 then
    return 0;
  end if;
  if cardinality(p_ids) > 500 then
    raise exception 'rpc_collect: at most 500 ids per call';
  end if;
  if (select count(*) from profile_item where user_id = v_user) >= 20000 then
    raise exception 'rpc_collect: this account already holds 20000 items';
  end if;
  insert into profile_item (user_id, set_id, item_id)
    select v_user, p_set, item
      from (select distinct trim(raw) as item from unnest(p_ids) as raw) ids
     where item is not null
       and char_length(item) between 1 and 128
       and item !~ '[[:cntrl:]]'
    on conflict (user_id, set_id, item_id) do nothing;
  get diagnostics v_new = row_count;
  return v_new;
end $$;

revoke all on function rpc_collect(text, text[]) from public;
grant execute on function rpc_collect(text, text[]) to authenticated;

-- ---------------------------------------------------------------------
-- §3 · מה כל דבר כאן
-- ---------------------------------------------------------------------

comment on table profile_item is
  'האוספים — שורה לכל פריט שנאסף, לפי אוסף. רק גדל: נכנסים דרך rpc_collect ולא יוצאים. '
  'הסרה היא אוסף שני (<set>~) או אסימון זוגיות (id#2), כך שאיחוד בין מכשירים מדויק.';
comment on column profile_item.set_id is
  'שם האוסף כפי ש-lib/profile/store.ts כותב אותו: ussishkin, kits, archive.mine, thread.routes.';
comment on column app_profile.card is
  'מה שהאוהד הצהיר על עצמו בכרטיס העובד (שער 10): שער בית, מאז, איך התחיל, מקום ראשון, ערכים. '
  'מזהים ושבבים — כל השאר נגזר מההתקדמות ולא נשמר.';
comment on column app_profile.card_edited_at is
  'מתי נערכו לאחרונה הכינוי, המספר והכרטיס — יחידה אחת. העריכה החדשה מנצחת; טריגר דוחה ישנה.';
comment on column app_profile.shirt_number is
  'המספר על הגב, 1–99 — אותו מספר בשער 7 ובשער 10.';
comment on column app_profile.supporter is
  'החותם של שער 7: שחקן מועדף (מזהה), עמדה (קוד) ונימוקים (מפתחות הודעה). לא הבחירות עצמן — '
  'הקלפי נשארת ב-poll_vote, בלי משתמש.';
comment on function rpc_collect(text, text[]) is
  'פריטים לאוסף של המשתמש המחובר. אידמפוטנטי — פריט קיים מדולג. מחזיר כמה היו חדשים.';
