import { chromium } from 'playwright';

const base = 'http://localhost:3111';

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));

  // Dashboard
  await page.goto(base + '/dashboard', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const dashText = await page.innerText('body');
  const stat = await page.locator('text=Tracked Signals').first().locator('xpath=../..').innerText().catch(() => '');
  console.log('=== DASHBOARD ===');
  console.log('stat card:', stat.replace(/\n/g, ' | '));
  console.log('has symbol like /-USD|=X|GC=F/:', /BTC-USD|ETH-USD|GC=F|EUR\/USD|AAPL|NVDA/.test(dashText));
  await page.screenshot({ path: 'shot-dashboard.png', fullPage: true });

  // Watchlist
  await page.goto(base + '/watchlist', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const wlText = await page.innerText('body');
  console.log('=== WATCHLIST ===');
  console.log('tracked count:', (wlText.match(/(\d+) instruments tracked/) || [])[0]);
  console.log('market groups:', [...new Set((wlText.match(/\b(crypto|stocks|forex|commodities|etfs)\b/g) || []))].join(','));
  await page.screenshot({ path: 'shot-watchlist.png', fullPage: true });

  // Alerts
  await page.goto(base + '/alerts', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const alText = await page.innerText('body');
  console.log('=== ALERTS ===');
  console.log('state:', /No alert conditions firing/.test(alText) ? 'empty-state (honest)' : 'has alerts');
  await page.screenshot({ path: 'shot-alerts.png', fullPage: true });

  // Signal detail
  await page.goto(base + '/signals/BTC-USD', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const dText = await page.innerText('body');
  console.log('=== DETAIL BTC-USD ===');
  console.log('has method table:', /All method readings/.test(dText));
  console.log('has regime:', /Regime:/.test(dText));
  console.log('fired methods listed:', /Methods that fired/.test(dText));
  console.log('sample:', dText.split('\n').filter(l => /smc\.|vp\.|cvd\.|confluence\./.test(l)).slice(0, 4).join(' / '));
  await page.screenshot({ path: 'shot-detail.png', fullPage: true });

  console.log('=== CONSOLE ERRORS ===');
  console.log(errors.length ? errors.slice(0, 10).join('\n') : 'none');

  await browser.close();
}

main().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
