export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'TWELVE_DATA_API_KEY not set' });

  try {
    const symbols = 'BTC/USD,EUR/USD,USD/JPY,XAU/USD,WTI/USD,XNG/USD,SPX';
    const url = `https://api.twelvedata.com/price?symbol=${symbols}&apikey=${apiKey}`;
    const res2 = await fetch(url);
    const data = await res2.json();

    return res.status(200).json({
      btc:  data['BTC/USD']?.price  || null,
      eur:  data['EUR/USD']?.price  || null,
      jpy:  data['USD/JPY']?.price  || null,
      gold: data['XAU/USD']?.price  || null,
      wti:  data['WTI/USD']?.price  || null,
      gas:  data['XNG/USD']?.price  || null,
      sp:   data['SPX']?.price      || null,
    });
  } catch(err) {
    return res.status(500).json({ error: err.message });
  }
}
