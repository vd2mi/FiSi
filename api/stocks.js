const axios = require('axios');

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, symbol, resolution, from, to, q } = req.query;

  try {
    let response;

    switch (action) {
      case 'quote':
        response = await axios.get(`${BASE_URL}/quote`, {
          params: { symbol, token: FINNHUB_API_KEY }
        });
        break;

      case 'profile':
        response = await axios.get(`${BASE_URL}/stock/profile2`, {
          params: { symbol, token: FINNHUB_API_KEY }
        });
        break;

      case 'candles':
        response = await axios.get(`${BASE_URL}/stock/candle`, {
          params: { symbol, resolution, from, to, token: FINNHUB_API_KEY }
        });
        break;

      case 'search':
        response = await axios.get(`${BASE_URL}/search`, {
          params: { q, token: FINNHUB_API_KEY }
        });
        break;

      case 'popular':
        const popularSymbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'AMD'];
        const quotes = await Promise.all(
          popularSymbols.map(sym =>
            axios.get(`${BASE_URL}/quote`, {
              params: { symbol: sym, token: FINNHUB_API_KEY }
            }).then(res => ({ symbol: sym, ...res.data }))
          )
        );
        const profiles = await Promise.all(
          popularSymbols.map(sym =>
            axios.get(`${BASE_URL}/stock/profile2`, {
              params: { symbol: sym, token: FINNHUB_API_KEY }
            }).then(res => ({ symbol: sym, profile: res.data }))
          )
        );
        const combined = quotes.map(quote => ({
          ...quote,
          profile: profiles.find(p => p.symbol === quote.symbol)?.profile
        }));
        return res.status(200).json({ data: combined });

      case 'market-status':
        response = await axios.get(`${BASE_URL}/stock/market-status`, {
          params: { exchange: 'US', token: FINNHUB_API_KEY }
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(200).json({ data: response.data });
  } catch (error) {
    console.error('Stocks API error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
};

