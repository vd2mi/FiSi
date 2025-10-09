const axios = require('axios');

const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const BASE_URL = 'https://api.coingecko.com/api/v3';

const headers = COINGECKO_API_KEY ? {
  'x-cg-demo-api-key': COINGECKO_API_KEY
} : {};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, coinId, days, limit, q } = req.query;

  try {
    let response;

    switch (action) {
      case 'top':
        response = await axios.get(`${BASE_URL}/coins/markets`, {
          params: {
            vs_currency: 'usd',
            order: 'market_cap_desc',
            per_page: limit || 20,
            page: 1,
            sparkline: false
          },
          headers
        });
        break;

      case 'details':
        response = await axios.get(`${BASE_URL}/coins/${coinId}`, {
          params: {
            localization: false,
            tickers: false,
            community_data: false,
            developer_data: false
          },
          headers
        });
        break;

      case 'chart':
        response = await axios.get(`${BASE_URL}/coins/${coinId}/market_chart`, {
          params: {
            vs_currency: 'usd',
            days: days || 7
          },
          headers
        });
        break;

      case 'search':
        response = await axios.get(`${BASE_URL}/search`, {
          params: { query: q },
          headers
        });
        break;

      case 'global':
        response = await axios.get(`${BASE_URL}/global`, { headers });
        break;

      case 'trending':
        response = await axios.get(`${BASE_URL}/search/trending`, { headers });
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(200).json({ data: response.data });
  } catch (error) {
    console.error('Crypto API error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
};

