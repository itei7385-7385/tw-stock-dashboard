const fs = require('fs');
const https = require('https');

function fetchText(url){
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseItems(xml){
  const items = [];
  const itemBlocks = xml.split('<item>').slice(1);
  for (const block of itemBlocks) {
    const get = (tag) => {
      const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)<\\/' + tag + '>'));
      if (!m) return '';
      return m[1].replace('<![CDATA[', '').replace(']]>', '').trim();
    };
    items.push({
      title: get('title'),
      link: get('link'),
      source: get('source'),
      pubDate: get('pubDate')
    });
    if (items.length >= 6) break;
  }
  return items;
}

(async () => {
  const watchlist = JSON.parse(fs.readFileSync('watchlist.json', 'utf8'));
  const byCode = {};
  for (const stock of watchlist) {
    const q = encodeURIComponent(stock.name);
    const url = `https://news.google.com/rss/search?q=${q}&hl=zh-TW&gl=TW&ceid=TW:zh-Hant`;
    try {
      const xml = await fetchText(url);
      byCode[stock.code] = parseItems(xml);
    } catch (e) {
      console.warn('抓取失敗：', stock.name, e.message);
      byCode[stock.code] = [];
    }
    await new Promise(r => setTimeout(r, 1500));
  }
  const out = { updatedAt: new Date().toISOString(), byCode };
  fs.writeFileSync('news.json', JSON.stringify(out));
})();
