// One-shot ingest + signal generation for all tracked instruments.
// Run: node --env-file=.env.local scripts/run-ingest.mjs
import { createClient } from '@supabase/supabase-js';
import yahooFinance from 'yahoo-finance2';

const yahoo = typeof yahooFinance === 'function' ? new yahooFinance() : new yahooFinance.default();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('missing SUPABASE env');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

// --- Minimal provider fetch (mirrors src/lib/providers) ---
const TIMEOUT = 10000;
async function fetchJson(u) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), TIMEOUT);
  try {
    const r = await fetch(u, { signal: c.signal, cache: 'no-store' });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally {
    clearTimeout(t);
  }
}

async function binance(symbol, tf, limit) {
  const raw = await fetchJson(
    `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=${limit}`
  );
  return raw.map((k) => ({ ts: +k[0], open: +k[1], high: +k[2], low: +k[3], close: +k[4], volume: +k[5] }));
}

async function finnhub(symbol, tf, limit) {
  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) throw new Error('FINNHUB_API_KEY missing');
  const resolution = tf === '1d' ? 'D' : '60';
  const to = Math.floor(Date.now() / 1000);
  const span = resolution === 'D' ? 86400 : 3600;
  const from = to - span * limit;
  const raw = await fetchJson(
    `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}&token=${apiKey}`
  );
  if (raw.s !== 'ok') throw new Error(`finnhub ${raw.s}`);
  return raw.t.map((t, i) => ({ ts: t * 1000, open: raw.o[i], high: raw.h[i], low: raw.l[i], close: raw.c[i], volume: raw.v?.[i] ?? 0 }));
}

async function twelvedata(symbol, tf, limit) {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) throw new Error('TWELVEDATA_API_KEY missing');
  const interval = tf === '1d' ? '1day' : '1h';
  const raw = await fetchJson(
    `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${interval}&outputsize=${limit}&apikey=${apiKey}`
  );
  if (raw.status === 'error' || !raw.values) throw new Error(`twelvedata ${raw.message ?? 'no values'}`);
  return raw.values
    .map((v) => ({
      ts: new Date(v.datetime.replace(' ', 'T') + 'Z').getTime(),
      open: +v.open,
      high: +v.high,
      low: +v.low,
      close: +v.close,
      volume: +(v.volume ?? 0),
    }))
    .sort((a, b) => a.ts - b.ts);
}

const PROVIDERS = { binance, finnhub, twelvedata, yahoo };

const YF_INTERVAL = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '60m', '4h': '240m', '1d': '1d' };

async function yahoo_(symbol, tf, limit) {
  const interval = YF_INTERVAL[tf] ?? '1d';
  // yahoo intraday limits: 60m max ~730 days; use generous window
  const days = limit * (interval === '1d' ? 1.6 : 0.15) + 10;
  const period1 = new Date(Date.now() - days * 86400 * 1000).toISOString().split('T')[0];
  const result = await yahoo.chart(symbol, { period1, interval });
  if (!result?.quotes?.length) throw new Error('yahoo no data');
  const bars = result.quotes
    .filter((q) => q.close != null)
    .map((q) => ({
      ts: new Date(q.date).getTime(),
      open: q.open ?? q.close,
      high: q.high ?? q.close,
      low: q.low ?? q.close,
      close: q.close,
      volume: q.volume ?? 0,
    }));
  if (!bars.length) throw new Error('yahoo empty after filter');
  return bars.slice(-limit);
}
PROVIDERS.yahoo = yahoo_;

const TRACKED = [
  ['BTC-USD', 'crypto', 'yahoo', 'yahoo'],
  ['ETH-USD', 'crypto', 'yahoo', 'yahoo'],
  ['SOL-USD', 'crypto', 'yahoo', 'yahoo'],
  ['BNB-USD', 'crypto', 'yahoo', 'yahoo'],
  ['XRP-USD', 'crypto', 'yahoo', 'yahoo'],
  ['AAPL', 'stocks', 'yahoo', 'nasdaq'],
  ['MSFT', 'stocks', 'yahoo', 'nasdaq'],
  ['NVDA', 'stocks', 'yahoo', 'nasdaq'],
  ['TSLA', 'stocks', 'yahoo', 'nasdaq'],
  ['AMZN', 'stocks', 'yahoo', 'nasdaq'],
  ['SPY', 'etfs', 'yahoo', 'nyse'],
  ['QQQ', 'etfs', 'yahoo', 'nasdaq'],
  ['DIA', 'etfs', 'yahoo', 'nyse'],
  ['EUR/USD', 'forex', 'twelvedata', 'fx'],
  ['USD/JPY', 'forex', 'twelvedata', 'fx'],
  ['GBP/USD', 'forex', 'twelvedata', 'fx'],
  ['XAU/USD', 'commodities', 'twelvedata', 'otc'],
  ['GC=F', 'commodities', 'yahoo', 'cmx'],
];

// --- Volume profile ---
function buildVolumeProfile(candles, buckets = 24) {
  const lows = candles.map((c) => c.low);
  const highs = candles.map((c) => c.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  if (!isFinite(min) || !isFinite(max) || max <= min) return undefined;
  const step = (max - min) / buckets;
  const hist = new Array(buckets).fill(0);
  for (const c of candles) {
    const lo = Math.max(0, Math.min(buckets - 1, Math.floor((c.low - min) / step)));
    const hi = Math.max(0, Math.min(buckets - 1, Math.floor((c.high - min) / step)));
    const spread = Math.max(1, hi - lo + 1);
    for (let i = lo; i <= hi; i++) hist[i] += c.volume / spread;
  }
  const totalVolume = hist.reduce((a, b) => a + b, 0);
  const pocIdx = hist.indexOf(Math.max(...hist));
  const priceAt = (i) => min + step * (i + 0.5);
  const target = totalVolume * 0.7;
  let captured = hist[pocIdx];
  let lo = pocIdx;
  let hi = pocIdx;
  while (captured < target && (lo > 0 || hi < buckets - 1)) {
    const nextLo = lo > 0 ? hist[lo - 1] : -1;
    const nextHi = hi < buckets - 1 ? hist[hi + 1] : -1;
    if (nextHi >= nextLo) {
      hi += 1;
      captured += nextHi;
    } else {
      lo -= 1;
      captured += nextLo;
    }
  }
  return { poc: priceAt(pocIdx), vah: priceAt(hi), val: priceAt(lo), valueArea: 0.7, totalVolume, timestamp: candles.at(-1).ts };
}

// --- Inline engine (mirrors src/engine/methods + fusion) ---
function atr(candles, period = 14) {
  const slice = candles.slice(-period - 1);
  let sum = 0;
  for (let i = 1; i < slice.length; i++) {
    sum += Math.max(
      slice[i].high - slice[i].low,
      Math.abs(slice[i].high - slice[i - 1].close),
      Math.abs(slice[i].low - slice[i - 1].close)
    );
  }
  return sum / Math.max(1, slice.length - 1);
}

function adx(candles) {
  const n = Math.min(20, candles.length);
  let dmP = 0,
    dmM = 0,
    tr = 0;
  for (let i = candles.length - n + 1; i < candles.length; i++) {
    const up = candles[i].high - candles[i - 1].high;
    const dn = candles[i - 1].low - candles[i].low;
    dmP += up > dn && up > 0 ? up : 0;
    dmM += dn > up && dn > 0 ? dn : 0;
    tr += Math.max(
      candles[i].high - candles[i].low,
      Math.abs(candles[i].high - candles[i - 1].close),
      Math.abs(candles[i].low - candles[i - 1].close)
    );
  }
  if (tr === 0) return 0;
  const diP = (dmP / tr) * 100;
  const diM = (dmM / tr) * 100;
  return (Math.abs(diP - diM) / (diP + diM || 1)) * 100;
}

function ema(candles, period) {
  if (candles.length < period) return null;
  const k = 2 / (period + 1);
  let e = candles.slice(0, period).reduce((s, c) => s + c.close, 0) / period;
  for (let i = period; i < candles.length; i++) e = candles[i].close * k + e * (1 - k);
  return e;
}

function rsi(candles, period = 14) {
  if (candles.length < period + 1) return 50;
  let gains = 0,
    losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = candles[i].close - candles[i - 1].close;
    if (d > 0) gains += d;
    else losses -= d;
  }
  let ag = gains / period,
    al = losses / period;
  for (let i = period + 1; i < candles.length; i++) {
    const d = candles[i].close - candles[i - 1].close;
    ag = (ag * (period - 1) + Math.max(0, d)) / period;
    al = (al * (period - 1) + Math.max(0, -d)) / period;
  }
  if (al === 0) return 100;
  return 100 - 100 / (1 + ag / al);
}

function detectRegime(candles) {
  if (candles.length < 20) return { regime: 'quiet', confidence: 0.3, evidence: {} };
  const a = adx(candles);
  const atrPct = (atr(candles) / candles.at(-1).close) * 100;
  if (a > 25 && atrPct > 1.5) return { regime: 'trending', confidence: 0.85, evidence: { adx: a, atrPct } };
  if (a < 15 && atrPct < 0.5) return { regime: 'quiet', confidence: 0.75, evidence: { adx: a, atrPct } };
  if (a < 20 && atrPct > 1.0) return { regime: 'volatile', confidence: 0.7, evidence: { adx: a, atrPct } };
  return { regime: 'ranging', confidence: 0.65, evidence: { adx: a, atrPct } };
}

const WEIGHTS = {
  trending: { 'smc.bos': 1.2, 'smc.choch': 1.1, 'vp.poc_break': 1.0, 'vp.vah_val': 0.9, 'cvd.slope': 1.0, 'cvd.divergence': 1.0, 'absorption.exhaustion': 0.8, 'confluence.ema_structure': 1.0, 'confluence.rsi_divergence': 0.8, 'confluence.vwap_deviation': 0.7 },
  ranging: { 'smc.bos': 0.8, 'smc.choch': 1.2, 'vp.poc_break': 1.0, 'vp.vah_val': 1.1, 'cvd.slope': 0.8, 'cvd.divergence': 1.0, 'absorption.exhaustion': 1.0, 'confluence.ema_structure': 0.6, 'confluence.rsi_divergence': 1.0, 'confluence.vwap_deviation': 0.9 },
  volatile: { 'smc.bos': 1.1, 'smc.choch': 1.0, 'vp.poc_break': 0.9, 'vp.vah_val': 0.8, 'cvd.slope': 0.9, 'cvd.divergence': 1.1, 'absorption.exhaustion': 1.0, 'confluence.ema_structure': 0.7, 'confluence.rsi_divergence': 1.1, 'confluence.vwap_deviation': 0.8 },
  quiet: { 'smc.bos': 0.7, 'smc.choch': 0.8, 'vp.poc_break': 0.8, 'vp.vah_val': 1.0, 'cvd.slope': 0.8, 'cvd.divergence': 0.8, 'absorption.exhaustion': 0.9, 'confluence.ema_structure': 0.5, 'confluence.rsi_divergence': 0.9, 'confluence.vwap_deviation': 1.0 },
};

function methods(ctx) {
  const { candles, volumeProfile } = ctx;
  const price = candles.at(-1).close;
  const out = {};

  // SMC: BOS
  const recentHigh = Math.max(...candles.slice(-10).map((c) => c.high));
  out['smc.bos'] =
    price > recentHigh * 1.005
      ? { direction: 'long', confidence: 0.75, reason: `BOS above ${recentHigh.toFixed(2)}, price ${price.toFixed(2)}`, evidence: { recentHigh, price } }
      : { direction: 'neutral', confidence: 0.4, reason: 'No BOS', evidence: {} };

  // SMC: CHoCH
  let choch = { direction: 'neutral', confidence: 0.4, reason: 'No CHoCH', evidence: {} };
  const lows = candles.slice(-20).map((c) => c.low);
  if (lows.at(-1) < Math.min(...lows.slice(0, 10)) && price < Math.min(...lows.slice(0, 10))) {
    choch = { direction: 'short', confidence: 0.7, reason: 'CHoCH breakdown', evidence: { priorLow: Math.min(...lows.slice(0, 10)) } };
  } else if (Math.max(...candles.slice(-10).map((c) => c.high)) > Math.max(...candles.slice(-20, -10).map((c) => c.high))) {
    choch = { direction: 'long', confidence: 0.7, reason: 'CHoCH upward break', evidence: {} };
  }
  out['smc.choch'] = choch;

  // VP: POC break
  if (volumeProfile) {
    if (price > volumeProfile.poc * 1.003)
      out['vp.poc_break'] = { direction: 'long', confidence: 0.8, reason: `POC break above ${volumeProfile.poc.toFixed(2)}`, evidence: { poc: volumeProfile.poc, price } };
    else if (price < volumeProfile.poc * 0.997)
      out['vp.poc_break'] = { direction: 'short', confidence: 0.75, reason: `Lost POC ${volumeProfile.poc.toFixed(2)}`, evidence: { poc: volumeProfile.poc, price } };
    else out['vp.poc_break'] = { direction: 'neutral', confidence: 0.4, reason: 'At POC', evidence: { poc: volumeProfile.poc } };

    if (price > volumeProfile.vah * 1.002)
      out['vp.vah_val'] = { direction: 'long', confidence: 0.7, reason: `Value area breakout above VAH ${volumeProfile.vah.toFixed(2)}`, evidence: { vah: volumeProfile.vah } };
    else if (price < volumeProfile.val * 0.998)
      out['vp.vah_val'] = { direction: 'short', confidence: 0.65, reason: `Rejected below VAL ${volumeProfile.val.toFixed(2)}`, evidence: { val: volumeProfile.val } };
    else out['vp.vah_val'] = { direction: 'neutral', confidence: 0.4, reason: 'Inside value area', evidence: {} };
  }

  // CVD proxy: signed volume from candle direction
  let cvd = 0;
  for (const c of candles.slice(-30)) cvd += (c.close > c.open ? 1 : -1) * c.volume;
  const recentVol = candles.slice(-30).reduce((s, c) => s + c.volume, 0);
  const slope = recentVol > 0 ? cvd / recentVol : 0;
  out['cvd.slope'] =
    slope > 0.25
      ? { direction: 'long', confidence: 0.7, reason: `Buy-side tape dominance ${(slope * 100).toFixed(0)}%`, evidence: { slope } }
      : slope < -0.25
        ? { direction: 'short', confidence: 0.7, reason: `Sell-side tape dominance ${(Math.abs(slope) * 100).toFixed(0)}%`, evidence: { slope } }
        : { direction: 'neutral', confidence: 0.4, reason: 'Balanced tape', evidence: { slope } };

  // CVD divergence
  const low5 = Math.min(...candles.slice(-5).map((c) => c.low));
  const high5 = Math.max(...candles.slice(-5).map((c) => c.high));
  out['cvd.divergence'] =
    slope > 0.1 && price <= low5
      ? { direction: 'long', confidence: 0.65, reason: 'Bullish delta divergence at lows', evidence: { slope } }
      : slope < -0.1 && price >= high5
        ? { direction: 'short', confidence: 0.65, reason: 'Bearish delta divergence at highs', evidence: { slope } }
        : { direction: 'neutral', confidence: 0.4, reason: 'No divergence', evidence: {} };

  // Absorption / exhaustion
  const last10 = candles.slice(-10);
  const range = Math.max(...last10.map((c) => c.high)) - Math.min(...last10.map((c) => c.low));
  const avgVol10 = last10.reduce((s, c) => s + c.volume, 0) / last10.length;
  const avgVol20 = candles.slice(-20, -10).reduce((s, c) => s + c.volume, 0) / 10;
  if (avgVol10 > avgVol20 * 1.3 && range < price * 0.008) {
    out['absorption.exhaustion'] = { direction: 'neutral', confidence: 0.65, reason: 'Heavy volume, no progress: absorption', evidence: { avgVol10, range } };
  } else if (avgVol10 < avgVol20 * 0.7 && price >= high5) {
    out['absorption.exhaustion'] = { direction: 'short', confidence: 0.6, reason: 'Thin volume into new highs', evidence: { avgVol10, avgVol20 } };
  } else if (avgVol10 < avgVol20 * 0.7 && price <= low5) {
    out['absorption.exhaustion'] = { direction: 'long', confidence: 0.6, reason: 'Thin volume into new lows', evidence: { avgVol10, avgVol20 } };
  } else {
    out['absorption.exhaustion'] = { direction: 'neutral', confidence: 0.4, reason: 'No absorption signal', evidence: {} };
  }

  // EMA structure
  const e20 = ema(candles, 20);
  const e50 = ema(candles, 50);
  const e200 = candles.length >= 200 ? ema(candles, 200) : null;
  if (e20 && e50) {
    if (price > e20 && e20 > e50 && (e200 === null || e50 > e200))
      out['confluence.ema_structure'] = { direction: 'long', confidence: 0.6, reason: 'EMA stack 20>50>200 bullish', evidence: { e20, e50, e200 } };
    else if (price < e20 && e20 < e50 && (e200 === null || e50 < e200))
      out['confluence.ema_structure'] = { direction: 'short', confidence: 0.6, reason: 'EMA stack 20<50<200 bearish', evidence: { e20, e50, e200 } };
    else out['confluence.ema_structure'] = { direction: 'neutral', confidence: 0.4, reason: 'EMA stack tangled', evidence: { e20, e50, e200 } };
  }

  // RSI
  const r = rsi(candles, 14);
  const prevMin = Math.min(...candles.slice(-15, -2).map((c) => c.close));
  const prevMax = Math.max(...candles.slice(-15, -2).map((c) => c.close));
  out['confluence.rsi_divergence'] =
    r < 35 && price < prevMin
      ? { direction: 'long', confidence: 0.65, reason: `RSI ${r.toFixed(0)} oversold at fresh lows`, evidence: { rsi: r } }
      : r > 65 && price > prevMax
        ? { direction: 'short', confidence: 0.65, reason: `RSI ${r.toFixed(0)} overbought at fresh highs`, evidence: { rsi: r } }
        : { direction: 'neutral', confidence: 0.4, reason: 'No RSI divergence', evidence: { rsi: r } };

  // VWAP deviation
  const vwapVol = candles.slice(-50).reduce((s, c) => s + c.volume, 0);
  const vwap = vwapVol > 0 ? candles.slice(-50).reduce((s, c) => s + ((c.high + c.low + c.close) / 3) * c.volume, 0) / vwapVol : price;
  const dev = (price - vwap) / vwap;
  out['confluence.vwap_deviation'] =
    dev > 0.02
      ? { direction: 'short', confidence: 0.6, reason: `${(dev * 100).toFixed(1)}% above VWAP, stretched`, evidence: { vwap, dev } }
      : dev < -0.02
        ? { direction: 'long', confidence: 0.6, reason: `${(dev * 100).toFixed(1)}% below VWAP, stretched`, evidence: { vwap, dev } }
        : { direction: 'neutral', confidence: 0.4, reason: 'At VWAP', evidence: { vwap, dev } };

  return out;
}

function fuse(ctx) {
  const regimeR = detectRegime(ctx.candles);
  const w = WEIGHTS[regimeR.regime] ?? WEIGHTS.ranging;
  const ms = methods(ctx);
  let lw = 0,
    sw = 0;
  let cl = 0,
    cs = 0;
  const firedLong = [];
  const firedShort = [];
  for (const [id, s] of Object.entries(ms)) {
    const weight = w[id] ?? 1;
    // A neutral reading is an abstention, not a vote for sideways. Only
    // methods that actually found a pattern contribute to the score.
    if (s.direction === 'long') {
      lw += s.confidence * weight;
      if (s.confidence >= 0.6) {
        cl++;
        firedLong.push(id);
      }
    } else if (s.direction === 'short') {
      sw += s.confidence * weight;
      if (s.confidence >= 0.6) {
        cs++;
        firedShort.push(id);
      }
    }
  }
  // Share of decisive weight held by the leading side.
  const decisive = lw + sw;
  let direction = 'neutral',
    confidence = 0,
    reason = '';
  const price = ctx.candles.at(-1).close;
  const a = atr(ctx.candles);

  if (decisive === 0) {
    direction = 'neutral';
    confidence = 0.3;
    reason = `No setup on ${ctx.symbol} ${ctx.timeframe}. No method found a pattern. ${regimeR.regime} regime.`;
  } else if (lw > sw * 1.15) {
    direction = 'long';
    confidence = Math.min(0.95, lw / decisive);
    if (cl < 2 && confidence >= 0.6) confidence = 0.55;
    reason = `Long ${ctx.symbol} ${ctx.timeframe}: ${firedLong.slice(0, 3).join(', ') || 'weak'} fired. ${regimeR.regime} regime (ADX ${regimeR.evidence.adx?.toFixed(0) ?? 'n/a'}).`;
  } else if (sw > lw * 1.15) {
    direction = 'short';
    confidence = Math.min(0.95, sw / decisive);
    if (cs < 2 && confidence >= 0.6) confidence = 0.55;
    reason = `Short ${ctx.symbol} ${ctx.timeframe}: ${firedShort.slice(0, 3).join(', ') || 'weak'} fired. ${regimeR.regime} regime (ADX ${regimeR.evidence.adx?.toFixed(0) ?? 'n/a'}).`;
  } else {
    direction = 'neutral';
    confidence = 0.35;
    const conflict = [
      ...firedLong.map((id) => `${id}=long`),
      ...firedShort.map((id) => `${id}=short`),
    ].slice(0, 3);
    reason = `No edge on ${ctx.symbol} ${ctx.timeframe}: methods split (${conflict.join(' vs ') || 'balanced weight'}). ${regimeR.regime} regime.`;
  }

  const invalidation =
    direction === 'long' ? price - a * 1.5 : direction === 'short' ? price + a * 1.5 : undefined;

  return {
    direction,
    confidence: Number(confidence.toFixed(2)),
    reason,
    invalidation,
    evidence: { regime: regimeR, methodSignals: ms, methodWeights: w, price, atr: a, corroboratingLong: cl, corroboratingShort: cs },
  };
}

const results = [];
for (const [symbol, market, providerId, exchange] of TRACKED) {
  const tf = market === 'stocks' || market === 'etfs' ? '1d' : '1h';
  const limit = tf === '1d' ? 250 : 200;
  try {
    const bars = await PROVIDERS[providerId](symbol, tf, limit);
    if (!bars || bars.length < 30) throw new Error(`only ${bars?.length ?? 0} bars`);

    const { data: existing } = await supabase.from('instruments').select('id').eq('symbol', symbol).maybeSingle();
    let id = existing?.id;
    if (!id) {
      const { data: ins, error } = await supabase
        .from('instruments')
        .insert([{ symbol, market, exchange, provider_ids: { [providerId]: symbol }, enabled: true }])
        .select('id')
        .single();
      if (error) throw new Error(error.message);
      id = ins.id;
    }

    await supabase.from('candles').delete().eq('instrument_id', id).eq('tf', tf);
    const { error: ce } = await supabase.from('candles').insert(
      bars.map((b) => ({
        instrument_id: id,
        tf,
        ts: new Date(b.ts).toISOString(),
        open: b.open,
        high: b.high,
        low: b.low,
        close: b.close,
        volume: b.volume,
      }))
    );
    if (ce) throw new Error(`candles: ${ce.message}`);

    const ctx = {
      symbol,
      market,
      timeframe: tf,
      candles: bars,
      volumeProfile: buildVolumeProfile(bars),
    };
    const fused = fuse(ctx);

    const { error: se } = await supabase.from('signals').insert([
      {
        instrument_id: id,
        tf,
        direction: fused.direction,
        confidence: fused.confidence,
        reason: fused.reason,
        evidence: fused.evidence,
        invalidation: fused.invalidation ?? null,
      },
    ]);
    if (se) throw new Error(`signals: ${se.message}`);

    results.push({ symbol, market, tf, bars: bars.length, ...fused, ok: true });
    console.log(
      `OK   ${symbol.padEnd(9)} ${market.padEnd(12)} ${tf.padEnd(3)} bars=${String(bars.length).padStart(3)} -> ${fused.direction.padEnd(7)} ${(fused.confidence * 100).toFixed(0)}%`
    );
  } catch (err) {
    results.push({ symbol, market, ok: false, error: err.message });
    console.log(`FAIL ${symbol.padEnd(9)} ${market.padEnd(12)} ${err.message}`);
  }
}

const okCount = results.filter((r) => r.ok).length;
console.log(`\n${okCount}/${results.length} instruments ingested and scored.`);
