-- RLS policies and supporting indexes for True Market Signal
-- Re-runnable (idempotent).

alter table if exists instruments enable row level security;
alter table if exists candles enable row level security;
alter table if exists orderbook_snapshots enable row level security;
alter table if exists trades_agg enable row level security;
alter table if exists signals enable row level security;
alter table if exists signal_weights enable row level security;
alter table if exists watchlists enable row level security;
alter table if exists alerts enable row level security;

-- Public read for market data and signals
drop policy if exists "instruments_public_read" on instruments;
create policy "instruments_public_read" on instruments for select using (true);

drop policy if exists "candles_public_read" on candles;
create policy "candles_public_read" on candles for select using (true);

drop policy if exists "orderbook_public_read" on orderbook_snapshots;
create policy "orderbook_public_read" on orderbook_snapshots for select using (true);

drop policy if exists "trades_agg_public_read" on trades_agg;
create policy "trades_agg_public_read" on trades_agg for select using (true);

drop policy if exists "signals_public_read" on signals;
create policy "signals_public_read" on signals for select using (true);

drop policy if exists "signal_weights_public_read" on signal_weights;
create policy "signal_weights_public_read" on signal_weights for select using (true);

-- Users may only touch their own rows
drop policy if exists "watchlists_owner_all" on watchlists;
create policy "watchlists_owner_all" on watchlists
  for all using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);

drop policy if exists "alerts_owner_all" on alerts;
create policy "alerts_owner_all" on alerts
  for all using (auth.uid()::text = user_id) with check (auth.uid()::text = user_id);

-- Indexes: hot query paths
create index if not exists signals_created_at_idx on signals (created_at desc);
create index if not exists signals_instrument_tf_idx on signals (instrument_id, tf, created_at desc);
create index if not exists signals_direction_confidence_idx on signals (direction, confidence desc);
create index if not exists candles_lookup_idx on candles (instrument_id, tf, ts desc);
create index if not exists orderbook_lookup_idx on orderbook_snapshots (instrument_id, ts desc);
create index if not exists trades_agg_lookup_idx on trades_agg (instrument_id, bucket, ts desc);
create unique index if not exists signal_weights_unique_idx
  on signal_weights (market, tf, regime, method_id);
create index if not exists instruments_market_idx on instruments (market, enabled);
