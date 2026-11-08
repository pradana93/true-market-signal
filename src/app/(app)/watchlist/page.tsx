import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter } from 'lucide-react';

export default function WatchlistPage() {
  // Mock data for demonstration
  const watchlist = [
    { id: '1', symbol: 'BTCUSDT', market: 'crypto', last_price: 68450, change: 2.34 },
    { id: '2', symbol: 'ETHUSDT', market: 'crypto', last_price: 3215, change: -1.23 },
    { id: '3', symbol: 'SPY', market: 'stocks', last_price: 542.34, change: 0.45 },
    { id: '4', symbol: 'EURUSD', market: 'forex', last_price: 1.0823, change: -0.12 },
    { id: '5', symbol: 'XAUUSD', market: 'commodities', last_price: 2045.67, change: 1.89 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Watchlist</h1>
          <p className="text-muted-foreground mt-1">
            Track your favorite instruments and receive alerts
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            Add Instrument
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search instruments..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button variant="outline" size="sm" className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {watchlist.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg">{item.symbol}</span>
                    <Badge variant="secondary" className={getMarketColor(item.market)}>
                      {item.market}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    ${item.last_price.toLocaleString()}
                  </p>
                </div>
                <div className={`text-sm font-medium ${item.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </div>
              </div>
              <div className="mt-3 flex space-x-2">
                <Button variant="outline" size="sm" className="text-xs px-2 py-1">
                  View Signal
                </Button>
                <Button variant="outline" size="sm" className="text-xs px-2 py-1">
                  Add Alert
                </Button>
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