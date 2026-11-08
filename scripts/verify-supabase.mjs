// Verify remote schema + RLS via Supabase REST (service role)
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('missing env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const tables = [
  'instruments',
  'candles',
  'orderbook_snapshots',
  'trades_agg',
  'signals',
  'signal_weights',
  'watchlists',
  'alerts',
];

let ok = 0;
for (const t of tables) {
  const { error, count } = await supabase.from(t).select('*', { count: 'exact', head: true });
  if (error) {
    console.log(`FAIL ${t}: ${error.message}`);
  } else {
    console.log(`OK   ${t} (rows=${count ?? 0})`);
    ok++;
  }
}

// Verify anon read on signals, and that anon cannot write
const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
const readSignal = await anon.from('signals').select('*', { head: true, count: 'exact' });
console.log(`anon SELECT signals: ${readSignal.error ? 'FAIL ' + readSignal.error.message : 'OK'}`);

const writeSignal = await anon
  .from('signals')
  .insert([{ instrument_id: 1, tf: '1h', direction: 'long', confidence: 0.5, reason: 'rls probe test row', evidence: {} }]);
console.log(
  `anon INSERT signals: ${writeSignal.error ? 'BLOCKED (expected) -> ' + writeSignal.error.code : 'ALLOWED (BAD)'}`
);

console.log(`\n${ok}/${tables.length} tables reachable`);
