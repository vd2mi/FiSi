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

  const { action, category, symbol, from, to } = req.query;

  try {
    let response;

    switch (action) {
      case 'market':
        response = await axios.get(`${BASE_URL}/news`, {
          params: { category: category || 'general', token: FINNHUB_API_KEY }
        });
        break;

      case 'company':
        response = await axios.get(`${BASE_URL}/company-news`, {
          params: {
            symbol,
            from: from || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            to: to || new Date().toISOString().split('T')[0],
            token: FINNHUB_API_KEY
          }
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(200).json({ data: response.data });
  } catch (error) {
    console.error('News API error:', error.message);
    res.status(error.response?.status || 500).json({
      error: error.message,
      details: error.response?.data
    });
  }
};

