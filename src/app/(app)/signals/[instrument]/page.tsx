import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertCircle, Download, Share2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default async function SignalDetailPage({
  params,
}: {
  params: Promise<{ instrument: string }>;
}) {
  const { instrument } = await params;
  
  // Mock data for demonstration
  const signal = {
    id: '1',
    symbol: 'BTCUSDT',
    market: 'crypto',
    timeframe: '1h',
    direction: 'long',
    confidence: 0.85,
    reason: 'Long BTCUSDT 1h — BOS above 68,400 confirmed by footprint imbalance (3.4×), positive CVD slope, POC reclaim. Target: unvisited POC 69,200. Invalidates below 67,900.',
    methods: ['smc.bos', 'vp.poc_break', 'footprint.imbalance', 'cvd.slope', 'confluence.poc_reclaim'],
    evidence: {
      price: 68450,
      volume: 1250000000,
      volatility: 0.023,
      liquidity_sweeps: 3,
      order_book_imbalance: 3.4,
      cvd_slope: 0.78,
      poc_price: 69200,
      invalidation_level: 67900,
    },
    invalidation: 67900,
    created_at: new Date(Date.now() - 300000),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{instrument}</h1>
          <p className="text-muted-foreground mt-1">
            Detailed signal analysis and chart visualization
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" className="flex items-center">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Signal Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <span className="font-semibold text-lg">{signal.symbol}</span>
                  <Badge variant="secondary" className={getMarketColor(signal.market)}>
                    {signal.market}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {signal.timeframe}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <span className={getSignalColor(signal.direction)}>
                  {signal.direction === 'long' ? <TrendingUp className="inline h-5 w-5 mr-1" /> : signal.direction === 'short' ? <TrendingDown className="inline h-5 w-5 mr-1" /> : <AlertCircle className="inline h-5 w-5 mr-1" />}
                  <span className="font-semibold">{signal.direction.charAt(0).toUpperCase() + signal.direction.slice(1)}</span>
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Confidence:</span>
                  <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getConfidenceColor(signal.confidence)}`} 
                      style={{ width: `${signal.confidence * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium">{Math.round(signal.confidence * 100)}%</span>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg mb-4">
                <p className="text-sm">
                  {signal.reason}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                {signal.methods.map((method, i) => (
                  <Badge key={i} variant="secondary" className="text-xs px-2 py-1">
                    {method.split('.')[1]}
                  </Badge>
                ))}
              </div>
              
              {signal.invalidation && (
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">Invalidation level:</span> {signal.invalidation}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Chart Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80 bg-muted/50 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/25">
                <p className="text-muted-foreground text-center">
                  TradingView Lightweight Chart would be rendered here<br />
                  with SMC overlays, volume profile, and footprint data
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Volume Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-muted/50 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/25">
                <p className="text-muted-foreground text-center">
                  Recharts heatmap showing POC, VAH, VAL
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Footprint Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-muted/50 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/25">
                <p className="text-muted-foreground text-center">
                  Footprint chart showing bid/ask imbalance
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>CVD Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-40 bg-muted/50 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/25">
                <p className="text-muted-foreground text-center">
                  CVD line chart showing delta divergence
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
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