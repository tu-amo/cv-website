-- supabase/migrations/20260415143000_add_anonymous_rate_limit.sql

-- 1. Create anonymous_rate_limit table
create table if not exists public.anonymous_rate_limit (
    ip_address text primary key,
    requests_today integer not null default 0,
    last_reset_date date not null default current_date
);

-- Enable RLS (though accessed via server admin client)
alter table public.anonymous_rate_limit enable row level security;

-- 2. Alter nutrition_flags to allow anonymous users (drop NOT NULL on flagged_by if any)
-- Currently nutrition_flags has flagged_by UUID references auth.users
alter table public.nutrition_flags alter column flagged_by drop not null;
alter table public.nutrition_flags add column if not exists anonymous_session_id text;

-- 3. Create RPC for atomic rate limiting to avoid race conditions
create or replace function public.check_anonymous_rate_limit(p_ip text, p_max_requests integer)
returns boolean as $$
declare
    v_requests integer;
    v_last_reset date;
begin
    -- Lock row for update or insert
    insert into public.anonymous_rate_limit (ip_address, requests_today, last_reset_date)
    values (p_ip, 1, current_date)
    on conflict (ip_address) do update
    set 
        requests_today = case 
            when public.anonymous_rate_limit.last_reset_date < current_date then 1 
            else public.anonymous_rate_limit.requests_today + 1 
        end,
        last_reset_date = current_date
    returning requests_today, last_reset_date into v_requests, v_last_reset;

    if v_requests <= p_max_requests then
        return true;
    else
        return false;
    end if;
end;
$$ language plpgsql security definer;
