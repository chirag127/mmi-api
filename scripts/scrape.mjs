// Scrape Tickertape Market Mood Index. Writes data/YYYY-MM-DD.json + data/latest.json.
import { writeFileSync, mkdirSync } from 'node:fs';
import { load } from 'cheerio';

const today = new Date().toISOString().slice(0, 10);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function zoneFor(s) {
  if (s < 30) return 'extreme-fear';
  if (s < 50) return 'fear';
  if (s < 70) return 'neutral';
  if (s < 90) return 'greed';
  return 'extreme-greed';
}

let score = 50;
let source = 'placeholder';
try {
  const res = await fetch('https://www.tickertape.in/market-mood-index', { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const $ = load(html);
  // Tickertape embeds the score in __NEXT_DATA__ + on the visible gauge. Try both.
  const next = html.match(/"mmi"\s*:\s*\{[^}]*"now"\s*:\s*([0-9.]+)/);
  if (next) score = +next[1];
  else {
    const txt = $('body').text();
    const m = txt.match(/Market Mood Index[\s\S]{0,200}?([0-9]{1,3}\.[0-9]+|[0-9]{1,3})/);
    if (m) score = +m[1];
  }
  source = 'tickertape';
} catch (e) {
  console.error('Tickertape failed:', e.message);
}

const payload = { date: today, score, zone: zoneFor(score), source };
mkdirSync('data', { recursive: true });
writeFileSync(`data/${today}.json`, JSON.stringify(payload, null, 2) + '\n');
writeFileSync('data/latest.json', JSON.stringify(payload, null, 2) + '\n');
console.log('Wrote', `data/${today}.json`, 'score=', score, 'source=', source);
