const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, symbol, expiration } = req.query;

  try {
    switch (action) {
      case 'chain':
        const chainData = await fetchYahooOptions(symbol, expiration);
        return res.status(200).json({ data: { strikes: chainData } });

      case 'expirations':
        const expirations = await fetchYahooExpirations(symbol);
        return res.status(200).json({ data: expirations });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    return res.status(200).json({
      data: action === 'expirations' 
        ? generateExpirations() 
        : { strikes: generateMockOptions(symbol) }
    });
  }
};

async function fetchYahooOptions(symbol, expiration) {
  try {
    const response = await axios.get(`https://query2.finance.yahoo.com/v7/finance/options/${symbol}`, {
      params: expiration ? { date: new Date(expiration).getTime() / 1000 } : {},
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const optionData = response.data?.optionChain?.result?.[0];
    if (!optionData) {
      return generateMockOptions(symbol);
    }

    const calls = optionData.options?.[0]?.calls || [];
    const puts = optionData.options?.[0]?.puts || [];

    const strikeMap = {};

    calls.forEach(call => {
      const strike = call.strike;
      if (!strikeMap[strike]) {
        strikeMap[strike] = { strike, call: {}, put: {} };
      }
      strikeMap[strike].call = {
        bid: call.bid || 0,
        ask: call.ask || 0,
        volume: call.volume || 0,
        openInterest: call.openInterest || 0,
        impliedVolatility: call.impliedVolatility || 0.25,
        delta: call.delta || 0.5,
        gamma: call.gamma || 0.01,
        theta: call.theta || -0.05,
        vega: call.vega || 0.1
      };
    });

    puts.forEach(put => {
      const strike = put.strike;
      if (!strikeMap[strike]) {
        strikeMap[strike] = { strike, call: {}, put: {} };
      }
      strikeMap[strike].put = {
        bid: put.bid || 0,
        ask: put.ask || 0,
        volume: put.volume || 0,
        openInterest: put.openInterest || 0,
        impliedVolatility: put.impliedVolatility || 0.25,
        delta: put.delta || -0.5,
        gamma: put.gamma || 0.01,
        theta: put.theta || -0.05,
        vega: put.vega || 0.1
      };
    });

    return Object.values(strikeMap).sort((a, b) => a.strike - b.strike);
  } catch (error) {
    return generateMockOptions(symbol);
  }
}

async function fetchYahooExpirations(symbol) {
  try {
    const response = await axios.get(`https://query2.finance.yahoo.com/v7/finance/options/${symbol}`, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const expirationTimestamps = response.data?.optionChain?.result?.[0]?.expirationDates || [];
    return expirationTimestamps.map(ts => {
      const date = new Date(ts * 1000);
      return date.toISOString().split('T')[0];
    });
  } catch (error) {
    return generateExpirations();
  }
}

function generateExpirations() {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 12; i++) {
    const friday = new Date(today);
    friday.setDate(today.getDate() + (5 - today.getDay() + 7 * i));
    dates.push(friday.toISOString().split('T')[0]);
  }
  
  return dates;
}

function generateMockOptions(symbol) {
  const basePrice = 150;
  const strikes = [];
  
  for (let i = -10; i <= 10; i++) {
    const strike = basePrice + (i * 5);
    const distanceFromMoney = Math.abs(i);
    
    strikes.push({
      strike,
      call: {
        bid: Math.max(0.1, (11 - distanceFromMoney) * Math.random() * 2),
        ask: Math.max(0.2, (11 - distanceFromMoney) * Math.random() * 2 + 0.5),
        volume: Math.floor(Math.random() * 1000),
        openInterest: Math.floor(Math.random() * 5000),
        impliedVolatility: 0.2 + Math.random() * 0.3,
        delta: Math.max(0.01, Math.min(0.99, 0.5 + (i * 0.05))),
        gamma: 0.01 + Math.random() * 0.02,
        theta: -0.05 - Math.random() * 0.1,
        vega: 0.1 + Math.random() * 0.2
      },
      put: {
        bid: Math.max(0.1, (11 - distanceFromMoney) * Math.random() * 2),
        ask: Math.max(0.2, (11 - distanceFromMoney) * Math.random() * 2 + 0.5),
        volume: Math.floor(Math.random() * 1000),
        openInterest: Math.floor(Math.random() * 5000),
        impliedVolatility: 0.2 + Math.random() * 0.3,
        delta: Math.max(-0.99, Math.min(-0.01, -0.5 + (i * 0.05))),
        gamma: 0.01 + Math.random() * 0.02,
        theta: -0.05 - Math.random() * 0.1,
        vega: 0.1 + Math.random() * 0.2
      }
    });
  }
  
  return strikes;
}

//testing Deploymentttttttt