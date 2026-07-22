const fs = require('fs');
const https = require('https');

function fetchJson(url){
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch(e){ reject(new Error('JSON parse failed: ' + e.message)); }
      });
    }).on('error', reject);
  });
}

function pickByOriginName(rows, includeKw, excludeKw = []){
  const hit = rows.find(r =>
    includeKw.every(kw => (r.origin_name || '').includes(kw)) &&
    excludeKw.every(kw => !(r.origin_name || '').includes(kw))
  );
  return hit ? hit.value : null;
}

(async () => {
  const watchlist = JSON.parse(fs.readFileSync('watchlist.json', 'utf8'));

  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2);
  const startDateStr = startDate.toISOString().slice(0, 10);

  const byCode = {};

  for (const stock of watchlist) {
    try {
      const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockFinancialStatements&data_id=${stock.code}&start_date=${startDateStr}`;
      const payload = await fetchJson(url);
      const rows = payload.data || [];

      const byDate = {};
      rows.forEach(r => {
        if (!byDate[r.date]) byDate[r.date] = [];
        byDate[r.date].push(r);
      });

      const dates = Object.keys(byDate).sort();

      const quarters = dates.map((date, idx) => {
        const dRows = byDate[date];
        const cumulativeEPS = pickByOriginName(dRows, ['每股盈餘']);
        const grossProfit = pickByOriginName(dRows, ['毛利']);
        const netIncomeCumulative = pickByOriginName(dRows, ['本期淨利']) || pickByOriginName(dRows, ['淨利'], ['每股', '率']);

        const month = parseInt(date.slice(5, 7), 10);
        const isQ1 = month <= 3;

        let quarterEPS = cumulativeEPS;
        if (!isQ1 && idx > 0) {
          const prevDate = dates[idx - 1];
          const prevYear = prevDate.slice(0, 4);
          const curYear = date.slice(0, 4);
          if (prevYear === curYear) {
            const prevEPS = pickByOriginName(byDate[prevDate], ['每股盈餘']);
            if (typeof cumulativeEPS === 'number' && typeof prevEPS === 'number') {
              quarterEPS = Math.round((cumulativeEPS - prevEPS) * 100) / 100;
            }
          }
        }

        return { period: date, cumulativeEPS, quarterEPS, grossProfit, netIncomeCumulative };
      });

      const last5 = quarters.slice(-5);
      const latest = quarters[quarters.length - 1] || null;

      byCode[stock.code] = {
        quarters: last5,
        latestCumulativeEPS: latest ? latest.cumulativeEPS : null,
        latestPeriod: latest ? latest.period : null
      };
    } catch (e) {
      console.warn('抓取失敗：', stock.name, e.message);
      byCode[stock.code] = { quarters: [], latestCumulativeEPS: null, latestPeriod: null, error: e.message };
    }
    await new Promise(r => setTimeout(r, 800));
  }

  const out = { updatedAt: new Date().toISOString(), byCode };
  fs.writeFileSync('financials.json', JSON.stringify(out));
})();
