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

function findCode(row){
  return row['公司代號'] || row['Code'] || row['公司代號 '] || null;
}

(async () => {
  const watchlist = JSON.parse(fs.readFileSync('watchlist.json', 'utf8'));
  const wantedCodes = new Set(watchlist.map(s => s.code));

  const url = 'https://openapi.twse.com.tw/v1/opendata/t187ap06_L_ci';

  const byCode = {};
  let fetchError = null;
  try {
    const rows = await fetchJson(url);
    for (const row of rows) {
      const code = findCode(row);
      if (!code || !wantedCodes.has(code)) continue;
      byCode[code] = row;
    }
  } catch (e) {
    fetchError = e.message;
    console.warn('抓取季報財務資料失敗：', e.message);
  }

  const out = { updatedAt: new Date().toISOString(), byCode, fetchError };
  fs.writeFileSync('financials.json', JSON.stringify(out));
})();
