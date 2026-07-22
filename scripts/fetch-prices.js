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

(async () => {
  const watchlist = JSON.parse(fs.readFileSync('watchlist.json', 'utf8'));

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 730); // 抓約2年份，讓圖表可以往前拖曳看更久的走勢
  const startDateStr = startDate.toISOString().slice(0, 10);

  const byCode = {};

  for (const stock of watchlist) {
    try {
      const url = `https://api.finmindtrade.com/api/v4/data?dataset=TaiwanStockPrice&data_id=${stock.code}&start_date=${startDateStr}`;
      const payload = await fetchJson(url);
      const rows = payload.data || [];
      byCode[stock.code] = rows.map(r => ({
        date: r.date,
        open: r.open,
        high: r.max,
        low: r.min,
        close: r.close,
        volume: r.Trading_Volume
      }));
    } catch (e) {
      console.warn('抓取股價歷史失敗：', stock.name, e.message);
      byCode[stock.code] = [];
    }
    await new Promise(r => setTimeout(r, 800));
  }

  const out = { updatedAt: new Date().toISOString(), byCode };
  fs.writeFileSync('prices.json', JSON.stringify(out));
})();
