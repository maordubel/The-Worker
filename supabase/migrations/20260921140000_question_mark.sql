-- =====================================================================
-- question_mark — פנקס הנקמות של שער 2 (21.9.2026)
-- =====================================================================
--
-- One row per (person, question): how often it was asked, how often it beat them, and
-- whether the LAST time was a miss. That last field is what Revenge deals from — "it
-- beat you last time", not "it ever beat you" — and it is why a merge between two
-- devices is newer-wins on the outcome and max on the counters (lib/profile/marks.ts):
-- a question avenged on the phone must not come back as pending because the laptop
-- still remembers the miss.
--
-- `question_id` is the Question Master's opaque `q_` id (content/generated/
-- question-master.json) — never a natural key, which moves the day the archive is
-- corrected (rule 35). A retired id resolves through the master's `aliases`.
--
-- Additive only: a new table, its RLS, one function. Nothing existing is altered.
-- Paste into the Supabase SQL editor as one block; it is safe to run twice.

create table if not exists question_mark (
  user_id       uuid not null references app_profile(id) on delete cascade,
  question_id   text not null check (question_id ~ '^q_[0-9a-f]{12}$'),
  -- the topic the question was dealt under, for gate 10's strengths — informational
  topic         text,
  wrong         integer not null default 0 check (wrong >= 0),
  "right"       integer not null default 0 check ("right" >= 0),
  last_outcome  text not null check (last_outcome in ('w', 'r')),
  last_at       timestamptz not null,
  updated_at    timestamptz not null default now(),
  primary key (user_id, question_id)
);

create index if not exists question_mark_pending_idx
  on question_mark (user_id, last_at desc) where last_outcome = 'w';

comment on table question_mark is
  'פנקס הנקמות: לכל אדם ולכל שאלה — כמה פעמים נשאלה, כמה פעמים טעה, ומה קרה בפעם האחרונה. מזין את מצב הנקמה בשער 2.';

-- RLS — a person reads and writes their own rows, and nobody else's.
alter table question_mark enable row level security;

drop policy if exists question_mark_read on question_mark;
create policy question_mark_read on question_mark
  for select using (user_id = auth.uid());
drop policy if exists question_mark_insert on question_mark;
create policy question_mark_insert on question_mark
  for insert with check (user_id = auth.uid());
drop policy if exists question_mark_update on question_mark;
create policy question_mark_update on question_mark
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

/*
 * rpc_mark_questions — the device's ledger, merged into the account's.
 *
 * `p_marks` is a JSON array of {q, topic, w, r, last, at}. Each element is merged with
 * the same rule the device uses: counters take the max, the outcome of the NEWER side
 * wins. So two devices pushing in any order converge on one row, and a retry is a no-op.
 * `security definer`, `search_path` pinned, the caller's own id only (rule 4's shape).
 */
create or replace function rpc_mark_questions(p_marks jsonb)
returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_user  uuid := auth.uid();
  v_count integer := 0;
  v_item  jsonb;
begin
  if v_user is null then
    raise exception 'rpc_mark_questions requires a signed-in user';
  end if;
  if p_marks is null or jsonb_typeof(p_marks) <> 'array' then
    raise exception 'rpc_mark_questions expects a JSON array';
  end if;
  if jsonb_array_length(p_marks) > 2000 then
    raise exception 'rpc_mark_questions takes at most 2000 marks';
  end if;

  for v_item in select * from jsonb_array_elements(p_marks) loop
    if (v_item->>'q') !~ '^q_[0-9a-f]{12}$' or (v_item->>'last') not in ('w', 'r') then
      continue;
    end if;
    insert into question_mark (user_id, question_id, topic, wrong, "right", last_outcome, last_at)
      values (
        v_user,
        v_item->>'q',
        nullif(v_item->>'topic', ''),
        greatest(coalesce((v_item->>'w')::integer, 0), 0),
        greatest(coalesce((v_item->>'r')::integer, 0), 0),
        v_item->>'last',
        coalesce((v_item->>'at')::timestamptz, now())
      )
      on conflict (user_id, question_id) do update set
        wrong        = greatest(question_mark.wrong, excluded.wrong),
        "right"      = greatest(question_mark."right", excluded."right"),
        last_outcome = case when excluded.last_at > question_mark.last_at
                            then excluded.last_outcome else question_mark.last_outcome end,
        last_at      = greatest(question_mark.last_at, excluded.last_at),
        topic        = coalesce(excluded.topic, question_mark.topic),
        updated_at   = now();
    v_count := v_count + 1;
  end loop;

  return v_count;
end $$;

revoke all on function rpc_mark_questions(jsonb) from public;
grant execute on function rpc_mark_questions(jsonb) to authenticated;
