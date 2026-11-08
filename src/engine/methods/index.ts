export * from './smc';
export * from './volume-profile';
export * from './orderbook';
export * from './footprint';
export * from './cvd';
export * from './absorption';
export * from './confluence';

// Export the SignalMethod interface
export interface SignalMethod {
  id: string;
  markets: Market[];
  timeframe: TF[];
  compute(ctx: MarketContext): Promise<MethodSignal>;
}

export interface MethodSignal {
  direction: 'long' | 'short' | 'neutral';
  confidence: number;
  reason: string;
  evidence: Record<string, unknown>;
  invalidation?: number;
}

export type Market = 'crypto' | 'stocks' | 'forex' | 'commodities' | 'indices' | 'etfs';
export type TF = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w' | '1mo';

export interface MarketContext {
  symbol: string;
  market: Market;
  timeframe: TF;
  candles: Candle[];
  orderbook?: OrderBookSnapshot;
  trades?: Trade[];
  volumeProfile?: VolumeProfile;
  footprint?: FootprintData;
  cvd?: CVDData;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderBookSnapshot {
  bids: [number, number][]; // [price, size]
  asks: [number, number][]; // [price, size]
  timestamp: number;
}

export interface Trade {
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
}

export interface VolumeProfile {
  poc: number;
  vah: number;
  val: number;
  valueArea: number;
  totalVolume: number;
  timestamp: number;
}

export interface FootprintData {
  imbalance: number;
  delta: number;
  diagonalImbalance: number;
  timestamp: number;
}

export interface CVDData {
  slope: number;
  divergence: number;
  timestamp: number;
}