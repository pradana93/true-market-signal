import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Bell, X } from 'lucide-react';

export default function AlertsPage() {
  // Mock data for demonstration
  const alerts = [
    {
      id: '1',
      symbol: 'BTCUSDT',
      market: 'crypto',
      condition: 'Price crosses above $68,500',
      channel: 'Email',
      active: true,
      created_at: new Date(Date.now() - 3600000),
    },
    {
      id: '2',
      symbol: 'ETHUSDT',
      market: 'crypto',
      condition: 'Price breaks below $3,200',
      channel: 'Webhook',
      active: true,
      created_at: new Date(Date.now() - 7200000),
    },
    {
      id: '3',
      symbol: 'SPY',
      market: 'stocks',
      condition: 'RSI crosses above 70',
      channel: 'Push',
      active: false,
      created_at: new Date(Date.now() - 10800000),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Set custom price and technical alerts for your instruments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Manage Channels
          </Button>
          <Button variant="default" size="sm" className="flex items-center">
            <Plus className="h-4 w-4 mr-2" />
            New Alert
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search alerts..."
            className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button variant="outline" size="sm" className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      <div className="space-y-4">
        {alerts.map((alert) => (
          <Card key={alert.id} className="hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg">{alert.symbol}</span>
                    <Badge variant="secondary" className={getMarketColor(alert.market)}>
                      {alert.market}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {alert.condition}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={alert.active ? 'default' : 'secondary'}>
                    {alert.active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {alert.channel}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <span>Created {formatDate(alert.created_at)}</span>
                <div className="flex space-x-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
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

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}