-- Stored function to atomically increment global stats
-- Run this in Supabase SQL editor after 001_initial.sql

create or replace function increment_stats(
  p_volume  numeric,
  p_charity numeric
) returns void
language plpgsql
security definer
as $$
begin
  update stats
  set
    total_volume          = total_volume + p_volume,
    total_charity_donated = total_charity_donated + p_charity,
    total_transactions    = total_transactions + 1
  where id = 1;
end;
$$;
