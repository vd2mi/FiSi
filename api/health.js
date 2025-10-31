
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    apis: {
      stocks: !!process.env.FINNHUB_API_KEY,
      alphavantage: !!process.env.ALPHAVANTAGE_API_KEY,
      crypto: true, 
      news: !!process.env.FINNHUB_API_KEY,
      options: true, 
    },
    environment: {
      node: process.version,
      platform: process.platform,
    },
    message: 'FiSi API is running'
  };

  const warnings = [];
  if (!process.env.FINNHUB_API_KEY) {
    warnings.push('FINNHUB_API_KEY not set - stock prices will not work');
  }
  if (!process.env.ALPHAVANTAGE_API_KEY) {
    warnings.push('ALPHAVANTAGE_API_KEY not set - using Finnhub for candles (limited)');
  }

  if (warnings.length > 0) {
    health.warnings = warnings;
    health.status = 'DEGRADED';
  }

  res.status(200).json(health);
};

