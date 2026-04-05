export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'ANTHROPIC_API_KEY not set — add it in Vercel environment variables' });

  const { title, region, tag } = req.body;
  if (!title) return res.status(400).json({ error: 'Missing event title' });

  const prompt = `You are a senior financial market analyst. Analyze this news event and return ONLY a raw JSON object. No markdown, no backticks, no text before or after. Start with { and end with }.

Event: "${title}" | Region: ${region || 'Global'} | Category: ${tag || 'general'}

{"summary":"2-3 sentences on why this moves markets","goods":[{"name":"","direction":"up|down|neutral","magnitude":"strong|moderate|slight","reason":"max 10 words"}],"stocks":[{"name":"","ticker":"","direction":"up|down|neutral","magnitude":"strong|moderate|slight","reason":"max 10 words"}],"bonds":[{"name":"","direction":"up|down|neutral","magnitude":"strong|moderate|slight","reason":"max 10 words"}],"currencies":[{"pair":"XXX/YYY","direction":"up|down|neutral","effect":"max 8 words"}],"supplychain":"2-3 sentences on supply chain disruption"}

4-5 goods, 4-5 stocks, 3 bonds, 4 currencies. Real company names and tickers.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err.error?.message || `Error ${response.status}` });
    }

    const data = await response.json();
    const raw = (data.content || []).map(b => b.text || '').join('');
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return res.status(500).json({ error: 'Could not parse AI response' });
    return res.status(200).json(JSON.parse(match[0]));

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
