import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertCircle, Clock } from 'lucide-react';

export default function DashboardPage() {
  // Mock data for demonstration
  const signals = [
    {
      id: '1',
      symbol: 'BTCUSDT',
      market: 'crypto',
      timeframe: '1h',
      direction: 'long',
      confidence: 0.85,
      reason: 'Long BTCUSDT 1h — BOS above 68,400 confirmed by footprint imbalance (3.4×), positive CVD slope, POC reclaim.',
      methods: ['smc.bos', 'vp.poc_break', 'footprint.imbalance'],
      invalidation: 67900,
      created_at: new Date(Date.now() - 300000),
    },
    {
      id: '2',
      symbol: 'ETHUSDT',
      market: 'crypto',
      timeframe: '1h',
      direction: 'short',
      confidence: 0.72,
      reason: 'Short ETHUSDT 1h — CHoCH breakdown below 3,200 confirmed by order book liquidity sweep, negative CVD divergence.',
      methods: ['smc.choch', 'orderbook.sweep', 'cvd.divergence'],
      invalidation: 3250,
      created_at: new Date(Date.now() - 600000),
    },
    {
      id: '3',
      symbol: 'SPY',
      market: 'stocks',
      timeframe: '1d',
      direction: 'neutral',
      confidence: 0.45,
      reason: 'Conflicting evidence — SMC shows bullish order block but volume profile shows rejection at VAH.',
      methods: ['smc.order_block', 'vp.rejection'],
      invalidation: null,
      created_at: new Date(Date.now() - 900000),
    },
    {
      id: '4',
      symbol: 'EURUSD',
      market: 'forex',
      timeframe: '15m',
      direction: 'long',
      confidence: 0.68,
      reason: 'Long EURUSD 15m — Premium zone breakout confirmed by tape-derived delta divergence, RSI bullish divergence.',
      methods: ['smc.premium_zone', 'tape.delta_divergence', 'confluence.rsi_divergence'],
      invalidation: 10850,
      created_at: new Date(Date.now() - 1200000),
    },
    {
      id: '5',
      symbol: 'XAUUSD',
      market: 'commodities',
      timeframe: '1h',
      direction: 'short',
      confidence: 0.75,
      reason: 'Short XAUUSD 1h — Liquidity void at 2050 confirmed by order book heatmap, bearish CVD slope.',
      methods: ['smc.liquidity_void', 'orderbook.heatmap', 'cvd.slope'],
      invalidation: 20650,
      created_at: new Date(Date.now() - 1500000),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">True Signal Board</h1>
          <p className="text-muted-foreground mt-1">
            Real-time market signals with multi-method validation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {signals.map((signal) => (
          <Card key={signal.id} className="hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-lg">{signal.symbol}</span>
                  <Badge variant="secondary" className={getMarketColor(signal.market)}>
                    {signal.market}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {signal.timeframe}
                </Badge>
              </div>
              <CardTitle className="text-base mt-2">
                <span className={getSignalColor(signal.direction)}>
                  {signal.direction === 'long' ? <TrendingUp className="inline h-4 w-4 mr-1" /> : signal.direction === 'short' ? <TrendingDown className="inline h-4 w-4 mr-1" /> : <AlertCircle className="inline h-4 w-4 mr-1" />}
                  {signal.direction.charAt(0).toUpperCase() + signal.direction.slice(1)}
                </span>
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                {signal.reason}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-muted-foreground">Confidence:</span>
                  <div className="w-20 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getConfidenceColor(signal.confidence)}`} 
                      style={{ width: `${signal.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium ml-2">{Math.round(signal.confidence * 100)}%</span>
                </div>
                <div className="flex space-x-1">
                  {signal.methods.slice(0, 3).map((method, i) => (
                    <Badge key={i} variant="secondary" className="text-xs px-1 py-0.5">
                      {method.split('.')[1]}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Updated {formatDate(signal.created_at)}</span>
                {signal.invalidation && (
                  <span>Invalidates below {signal.invalidation}</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function getMarketColor(market: string): string {
  const colors: Record<string, string> = {
    crypto: 'text-green-500',
    stocks: 'text-blue-500',
    forex: 'text-purple-500',
    commodities: 'text-orange-500',
    indices: 'text-indigo-500',
    etfs: 'text-teal-500',
  };
  return colors[market.toLowerCase()] || 'text-gray-500';
}

function getSignalColor(direction: string): string {
  switch (direction) {
    case 'long':
      return 'text-green-500';
    case 'short':
      return 'text-red-500';
    case 'neutral':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.6) return 'bg-yellow-500';
  if (confidence >= 0.4) return 'bg-orange-500';
  return 'bg-red-500';
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}