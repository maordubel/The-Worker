-- Gate 9 / Royal Rumble V2 — synchronized two-player rooms.
create table if not exists public.royal_rumble_room (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_user_id uuid not null references auth.users(id) on delete cascade,
  guest_user_id uuid references auth.users(id) on delete set null,
  match_seed bigint not null check (match_seed between 0 and 4294967295),
  status text not null default 'waiting' check (status in ('waiting','drafting','countdown','playing','finished','expired')),
  host_ready boolean not null default false,
  guest_ready boolean not null default false,
  starts_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '2 hours')
);

create table if not exists public.royal_rumble_entry (
  room_id uuid not null references public.royal_rumble_room(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  offer_seed bigint not null check (offer_seed between 0 and 4294967295),
  picks jsonb,
  ready boolean not null default false,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

alter table public.royal_rumble_room enable row level security;
alter table public.royal_rumble_entry enable row level security;

drop policy if exists royal_rumble_room_participant_read on public.royal_rumble_room;
create policy royal_rumble_room_participant_read on public.royal_rumble_room for select to authenticated using (auth.uid() = host_user_id or auth.uid() = guest_user_id);
drop policy if exists royal_rumble_entry_owner_read on public.royal_rumble_entry;
create policy royal_rumble_entry_owner_read on public.royal_rumble_entry for select to authenticated using (auth.uid() = user_id);

revoke insert, update, delete on public.royal_rumble_room from anon, authenticated;
revoke insert, update, delete on public.royal_rumble_entry from anon, authenticated;
grant select on public.royal_rumble_room to authenticated;
grant select on public.royal_rumble_entry to authenticated;

create or replace function public.rr_room_code() returns text language sql volatile set search_path = public as $$
  select upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
$$;

create or replace function public.rpc_rr_create_room(p_match_seed bigint, p_offer_seed bigint)
returns table(room_id uuid, code text, match_seed bigint)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_room public.royal_rumble_room%rowtype; v_code text; v_try integer := 0;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_match_seed < 0 or p_match_seed > 4294967295 or p_offer_seed < 0 or p_offer_seed > 4294967295 then raise exception 'BAD_SEED'; end if;
  if p_match_seed <> least(p_offer_seed, (p_offer_seed # 1597463007::bigint)) then raise exception 'BAD_SEED_PAIR'; end if;
  loop
    v_try := v_try + 1; if v_try > 12 then raise exception 'ROOM_CODE_EXHAUSTED'; end if;
    v_code := public.rr_room_code();
    begin
      insert into public.royal_rumble_room(code, host_user_id, match_seed) values (v_code, v_uid, p_match_seed) returning * into v_room;
      exit;
    exception when unique_violation then null;
    end;
  end loop;
  insert into public.royal_rumble_entry(room_id, user_id, offer_seed) values (v_room.id, v_uid, p_offer_seed);
  return query select v_room.id, v_room.code, v_room.match_seed;
end; $$;

create or replace function public.rpc_rr_join_room(p_code text, p_match_seed bigint, p_offer_seed bigint)
returns table(room_id uuid, code text, match_seed bigint)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_room public.royal_rumble_room%rowtype;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_match_seed < 0 or p_match_seed > 4294967295 or p_offer_seed < 0 or p_offer_seed > 4294967295 then raise exception 'BAD_SEED'; end if;
  if p_match_seed <> least(p_offer_seed, (p_offer_seed # 1597463007::bigint)) then raise exception 'BAD_SEED_PAIR'; end if;
  select * into v_room from public.royal_rumble_room where royal_rumble_room.code = upper(trim(p_code)) and expires_at > now() for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_room.match_seed <> p_match_seed then raise exception 'SEED_MISMATCH'; end if;
  if v_room.host_user_id = v_uid then return query select v_room.id, v_room.code, v_room.match_seed; return; end if;
  if v_room.guest_user_id is not null and v_room.guest_user_id <> v_uid then raise exception 'ROOM_FULL'; end if;
  if v_room.guest_user_id is null then
    update public.royal_rumble_room set guest_user_id = v_uid, status = case when status='waiting' then 'drafting' else status end, updated_at=now() where id=v_room.id returning * into v_room;
  end if;
  insert into public.royal_rumble_entry(room_id, user_id, offer_seed) values (v_room.id, v_uid, p_offer_seed) on conflict (room_id,user_id) do nothing;
  return query select v_room.id, v_room.code, v_room.match_seed;
end; $$;

create or replace function public.rpc_rr_lock(p_room_id uuid, p_offer_seed bigint, p_picks jsonb)
returns table(status text, host_ready boolean, guest_ready boolean, starts_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_room public.royal_rumble_room%rowtype; v_host_ready boolean; v_guest_ready boolean;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  if jsonb_typeof(p_picks) <> 'array' or jsonb_array_length(p_picks) <> 5 then raise exception 'BAD_PICKS'; end if;
  if (select count(distinct value) from jsonb_array_elements_text(p_picks)) <> 5 then raise exception 'DUPLICATE_PICKS'; end if;
  select * into v_room from public.royal_rumble_room where id=p_room_id and expires_at>now() for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_uid <> v_room.host_user_id and v_uid <> v_room.guest_user_id then raise exception 'NOT_A_PARTICIPANT'; end if;
  if least(p_offer_seed, (p_offer_seed # 1597463007::bigint)) <> v_room.match_seed then raise exception 'BAD_SEED_PAIR'; end if;
  if v_room.guest_user_id is null then raise exception 'WAITING_FOR_OPPONENT'; end if;
  update public.royal_rumble_entry set offer_seed=p_offer_seed,picks=p_picks,ready=true,locked_at=coalesce(locked_at,now()),updated_at=now() where room_id=p_room_id and user_id=v_uid;
  select coalesce(bool_or(ready) filter (where user_id=v_room.host_user_id),false), coalesce(bool_or(ready) filter (where user_id=v_room.guest_user_id),false)
    into v_host_ready,v_guest_ready from public.royal_rumble_entry where room_id=p_room_id;
  update public.royal_rumble_room set host_ready=v_host_ready, guest_ready=v_guest_ready,
    status=case when v_host_ready and v_guest_ready then 'countdown' else 'drafting' end,
    starts_at=case when v_host_ready and v_guest_ready then coalesce(starts_at,now()+interval '4 seconds') else starts_at end,
    updated_at=now() where id=p_room_id
    returning royal_rumble_room.status, royal_rumble_room.host_ready, royal_rumble_room.guest_ready, royal_rumble_room.starts_at
    into status,host_ready,guest_ready,starts_at;
  return next;
end; $$;

create or replace function public.rpc_rr_state(p_room_id uuid)
returns table(room_id uuid, code text, match_seed bigint, status text, is_host boolean, opponent_joined boolean, you_ready boolean, opponent_ready boolean, starts_at timestamptz, expires_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_room public.royal_rumble_room%rowtype;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_room from public.royal_rumble_room where id=p_room_id;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_uid <> v_room.host_user_id and v_uid <> v_room.guest_user_id then raise exception 'NOT_A_PARTICIPANT'; end if;
  return query select v_room.id,v_room.code,v_room.match_seed,case when v_room.expires_at<=now() then 'expired' else v_room.status end,
    v_uid=v_room.host_user_id,v_room.guest_user_id is not null,
    case when v_uid=v_room.host_user_id then v_room.host_ready else v_room.guest_ready end,
    case when v_uid=v_room.host_user_id then v_room.guest_ready else v_room.host_ready end,
    v_room.starts_at,v_room.expires_at;
end; $$;

create or replace function public.rpc_rr_claim(p_room_id uuid)
returns table(match_seed bigint, host_user_id uuid, guest_user_id uuid, host_offer_seed bigint, guest_offer_seed bigint, host_picks jsonb, guest_picks jsonb, starts_at timestamptz)
language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); v_room public.royal_rumble_room%rowtype; v_host public.royal_rumble_entry%rowtype; v_guest public.royal_rumble_entry%rowtype;
begin
  if v_uid is null then raise exception 'AUTH_REQUIRED'; end if;
  select * into v_room from public.royal_rumble_room where id=p_room_id and expires_at>now() for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if v_uid <> v_room.host_user_id and v_uid <> v_room.guest_user_id then raise exception 'NOT_A_PARTICIPANT'; end if;
  if not v_room.host_ready or not v_room.guest_ready or v_room.starts_at is null then raise exception 'NOT_READY'; end if;
  if now() < v_room.starts_at then raise exception 'COUNTDOWN'; end if;
  select * into v_host from public.royal_rumble_entry where room_id=p_room_id and user_id=v_room.host_user_id;
  select * into v_guest from public.royal_rumble_entry where room_id=p_room_id and user_id=v_room.guest_user_id;
  if v_host.picks is null or v_guest.picks is null then raise exception 'MISSING_PICKS'; end if;
  update public.royal_rumble_room set status='playing',updated_at=now() where id=p_room_id and status='countdown';
  return query select v_room.match_seed,v_room.host_user_id,v_room.guest_user_id,v_host.offer_seed,v_guest.offer_seed,v_host.picks,v_guest.picks,v_room.starts_at;
end; $$;

revoke all on function public.rr_room_code() from public;
revoke all on function public.rpc_rr_create_room(bigint,bigint) from public;
revoke all on function public.rpc_rr_join_room(text,bigint,bigint) from public;
revoke all on function public.rpc_rr_lock(uuid,bigint,jsonb) from public;
revoke all on function public.rpc_rr_state(uuid) from public;
revoke all on function public.rpc_rr_claim(uuid) from public;
grant execute on function public.rpc_rr_create_room(bigint,bigint) to authenticated;
grant execute on function public.rpc_rr_join_room(text,bigint,bigint) to authenticated;
grant execute on function public.rpc_rr_lock(uuid,bigint,jsonb) to authenticated;
grant execute on function public.rpc_rr_state(uuid) to authenticated;
grant execute on function public.rpc_rr_claim(uuid) to authenticated;
