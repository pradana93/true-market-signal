import { pgTable, serial, text, varchar, integer, timestamp, jsonb, boolean, real } from 'drizzle-orm/pg-core';

// Instruments table
export const instruments = pgTable('instruments', {
  id: serial('id').primaryKey(),
  symbol: varchar('symbol', { length: 50 }).notNull().unique(),
  market: varchar('market', { length: 20 }).notNull(), // 'crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'
  exchange: varchar('exchange', { length: 50 }),
  provider_ids: jsonb('provider_ids'), // JSONB to store multiple provider IDs
  enabled: boolean('enabled').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Candles table (partitioned by month)
export const candles = pgTable('candles', {
  id: serial('id').primaryKey(),
  instrument_id: integer('instrument_id').notNull(),
  tf: varchar('tf', { length: 10 }).notNull(), // '1m', '5m', '15m', '1h', '4h', '1d', '1w', '1mo'
  ts: timestamp('ts').notNull(),
  open: real('open').notNull(),
  high: real('high').notNull(),
  low: real('low').notNull(),
  close: real('close').notNull(),
  volume: real('volume').notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

// Order book snapshots (crypto only, 1-day TTL)
export const orderbook_snapshots = pgTable('orderbook_snapshots', {
  id: serial('id').primaryKey(),
  instrument_id: integer('instrument_id').notNull(),
  ts: timestamp('ts').notNull(),
  bids: jsonb('bids').notNull(), // [[price, size], ...]
  asks: jsonb('asks').notNull(), // [[price, size], ...]
  created_at: timestamp('created_at').defaultNow(),
});

// Trades aggregation table
export const trades_agg = pgTable('trades_agg', {
  id: serial('id').primaryKey(),
  instrument_id: integer('instrument_id').notNull(),
  ts: timestamp('ts').notNull(),
  bucket: varchar('bucket', { length: 20 }).notNull(), // '1m', '5m', '15m', '1h'
  buy_vol: real('buy_vol').notNull(),
  sell_vol: real('sell_vol').notNull(),
  delta: real('delta').notNull(), // buy_vol - sell_vol
  created_at: timestamp('created_at').defaultNow(),
});

// Signals table
export const signals = pgTable('signals', {
  id: serial('id').primaryKey(),
  instrument_id: integer('instrument_id').notNull(),
  tf: varchar('tf', { length: 10 }).notNull(), // '1m', '5m', '15m', '1h', '4h', '1d', '1w', '1mo'
  direction: varchar('direction', { length: 10 }).notNull(), // 'long', 'short', 'neutral'
  confidence: real('confidence').notNull(), // 0..1
  reason: text('reason').notNull(),
  evidence: jsonb('evidence').notNull(),
  invalidation: real('invalidation'), // price level that kills the signal
  created_at: timestamp('created_at').defaultNow(),
});

// Signal weights table
export const signal_weights = pgTable('signal_weights', {
  id: serial('id').primaryKey(),
  market: varchar('market', { length: 20 }).notNull(), // 'crypto', 'stocks', 'forex', 'commodities', 'indices', 'etfs'
  tf: varchar('tf', { length: 10 }).notNull(), // '1m', '5m', '15m', '1h', '4h', '1d', '1w', '1mo'
  regime: varchar('regime', { length: 20 }).notNull(), // 'trending', 'ranging', 'volatile', 'quiet'
  method_id: varchar('method_id', { length: 100 }).notNull(), // 'smc.bos', 'vp.poc_break', etc.
  weight: real('weight').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Watchlists table
export const watchlists = pgTable('watchlists', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 100 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  symbols: jsonb('symbols').notNull(), // ['BTCUSDT', 'ETHUSDT', ...]
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

// Alerts table
export const alerts = pgTable('alerts', {
  id: serial('id').primaryKey(),
  user_id: varchar('user_id', { length: 100 }).notNull(),
  instrument_id: integer('instrument_id').notNull(),
  condition: jsonb('condition').notNull(), // { type: 'price_cross', level: 68500 }
  channel: varchar('channel', { length: 50 }).notNull(), // 'email', 'webhook', 'push', 'sms'
  active: boolean('active').default(true),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});