const axios = require('axios');

const THETA_API_KEY = process.env.THETA_DATA_API_KEY;
const BASE_URL = 'https://api.thetadata.us/v2';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, symbol, expiration } = req.query;

  if (!THETA_API_KEY) {
    return res.status(200).json({
      data: {
        strikes: generateMockOptions(symbol)
      }
    });
  }

  try {
    let response;

    switch (action) {
      case 'chain':
        response = await axios.get(`${BASE_URL}/option/chain`, {
          params: { root: symbol, exp: expiration },
          headers: { 'Authorization': `Bearer ${THETA_API_KEY}` }
        });
        break;

      case 'expirations':
        response = await axios.get(`${BASE_URL}/option/expirations`, {
          params: { root: symbol },
          headers: { 'Authorization': `Bearer ${THETA_API_KEY}` }
        });
        break;

      case 'quote':
        response = await axios.get(`${BASE_URL}/option/quote`, {
          params: { root: symbol },
          headers: { 'Authorization': `Bearer ${THETA_API_KEY}` }
        });
        break;

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(200).json({ data: response.data });
  } catch (error) {
    console.error('Options API error:', error.message);
    res.status(200).json({
      data: {
        strikes: generateMockOptions(symbol)
      }
    });
  }
};

function generateMockOptions(symbol) {
  const basePrice = 150;
  const strikes = [];
  
  for (let i = -10; i <= 10; i++) {
    const strike = basePrice + (i * 5);
    strikes.push({
      strike,
      call: {
        bid: Math.max(0.1, Math.random() * 10),
        ask: Math.max(0.2, Math.random() * 10 + 0.1),
        volume: Math.floor(Math.random() * 1000),
        openInterest: Math.floor(Math.random() * 5000),
        impliedVolatility: 0.2 + Math.random() * 0.3,
        delta: 0.5 + (i * 0.05),
        gamma: 0.01 + Math.random() * 0.02,
        theta: -0.05 - Math.random() * 0.1,
        vega: 0.1 + Math.random() * 0.2
      },
      put: {
        bid: Math.max(0.1, Math.random() * 10),
        ask: Math.max(0.2, Math.random() * 10 + 0.1),
        volume: Math.floor(Math.random() * 1000),
        openInterest: Math.floor(Math.random() * 5000),
        impliedVolatility: 0.2 + Math.random() * 0.3,
        delta: -0.5 + (i * 0.05),
        gamma: 0.01 + Math.random() * 0.02,
        theta: -0.05 - Math.random() * 0.1,
        vega: 0.1 + Math.random() * 0.2
      }
    });
  }
  
  return strikes;
}

