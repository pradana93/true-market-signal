import { createAdminClient } from '@/lib/supabase/server';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import * as schema from '@/db/schema';

// Environment validation
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  FINNHUB_API_KEY: z.string().min(1).optional(),
  TWELVEDATA_API_KEY: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});

export type Env = z.infer<typeof envSchema>;

// Signal schemas
export const signalInsertSchema = z.object({
  instrument_id: z.number().int().positive(),
  tf: z.enum(['1m', '5m', '15m', '1h', '4h', '1d', '1w', '1mo']),
  direction: z.enum(['long', 'short', 'neutral']),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(10).max(1000),
  evidence: z.record(z.unknown()),
  invalidation: z.number().positive().optional(),
});

export const signalSelectSchema = signalInsertSchema.extend({
  id: z.number().int().positive(),
  created_at: z.string().datetime(),
});

// API response schemas
export const apiResponseSchema = z.object({
  data: z.array(signalSelectSchema).optional(),
  error: z.string().optional(),
});

// Watchlist schemas
export const watchlistInsertSchema = z.object({
  user_id: z.string().min(1),
  name: z.string().min(1).max(100),
  symbols: z.array(z.string().min(1)).min(1),
});

// Alert schemas
export const alertInsertSchema = z.object({
  user_id: z.string().min(1),
  instrument_id: z.number().int().positive(),
  condition: z.record(z.unknown()),
  channel: z.enum(['email', 'webhook', 'push', 'sms']),
  active: z.boolean().default(true),
});

// Provider response schemas
export const finnhubQuoteSchema = z.object({
  c: z.number(), // Current price
  d: z.number().nullable(), // Change
  dp: z.number().nullable(), // Percent change
  h: z.number(), // High price of the day
  l: z.number(), // Low price of the day
  o: z.number(), // Open price of the day
  pc: z.number(), // Previous close price
  t: z.number().optional(), // Timestamp
});

export const twelvedataTimeSeriesSchema = z.object({
  meta: z.object({
    symbol: z.string(),
    interval: z.string(),
    currency: z.string().optional(),
    exchange_timezone: z.string().optional(),
    exchange: z.string().optional(),
    type: z.string().optional(),
  }),
  values: z.array(z.object({
    datetime: z.string(),
    open: z.string(),
    high: z.string(),
    low: z.string(),
    close: z.string(),
    volume: z.string().optional(),
  })),
  status: z.string(),
});

export const binanceKlineSchema = z.tuple([
  z.number(), // Open time
  z.string(), // Open
  z.string(), // High
  z.string(), // Low
  z.string(), // Close
  z.string(), // Volume
  z.number(), // Close time
  z.string(), // Quote asset volume
  z.number(), // Number of trades
  z.string(), // Taker buy base asset volume
  z.string(), // Taker buy quote asset volume
  z.string(), // Ignore
]);

// Export schemas for use in API routes
export { schema };