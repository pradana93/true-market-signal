import { YahooFinance } from 'yahoo-finance2';

const yahooFinance = new YahooFinance();

const symbols = ['BTC-USD', 'ETH-USD', 'AAPL', 'SPY', 'GC=F'];
for (const s of symbols) {
  try {
    const res = await yahooFinance.chart(s, { period1: '2026-10-01', interval: '1d' });
    console.log(`OK ${s}: ${res.quotes.length} quotes, last close: ${res.meta.regularMarketPrice}`);
  } catch (err) {
    console.log(`FAIL ${s}: ${err.message}`);
  }
}