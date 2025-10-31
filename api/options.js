const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, symbol, expiration } = req.query;

  const ALPACA_API_KEY = process.env.ALPACA_API_KEY_ID;
  const ALPACA_SECRET_KEY = process.env.ALPACA_API_SECRET_KEY;

  if (!ALPACA_API_KEY || !ALPACA_SECRET_KEY) {
    return res.status(500).json({ 
      error: 'Alpaca API credentials not configured. Please set ALPACA_API_KEY_ID and ALPACA_API_SECRET_KEY environment variables.' 
    });
  }

  try {
    switch (action) {
      case 'chain':
        const chainData = await fetchAlpacaOptionChain(symbol, expiration, ALPACA_API_KEY, ALPACA_SECRET_KEY);
        return res.status(200).json({ data: { strikes: chainData } });

      case 'expirations':
        const expirations = await fetchAlpacaExpirations(symbol, ALPACA_API_KEY, ALPACA_SECRET_KEY);
        return res.status(200).json({ data: expirations });

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Alpaca API Error:', error.response?.data || error.message);
    return res.status(500).json({ 
      error: 'Failed to fetch options data from Alpaca', 
      details: error.response?.data || error.message 
    });
  }
};

async function fetchAlpacaOptionChain(symbol, expiration, apiKey, secretKey) {
  try {
    const response = await axios.get(`https://data.alpaca.markets/v1beta1/options/snapshots/${symbol}`, {
      params: {
        feed: 'indicative',
        limit: 1000
      },
      headers: {
        'accept': 'application/json',
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey
      }
    });

    const snapshots = response.data?.snapshots;
    
    if (!snapshots || Object.keys(snapshots).length === 0) {
      throw new Error('No option data available for this symbol');
    }

    const strikeMap = {};

    Object.entries(snapshots).forEach(([contractSymbol, snapshot]) => {
      const contractInfo = parseAlpacaContractSymbol(contractSymbol, symbol);
      
      if (!contractInfo) return;

      if (expiration && contractInfo.expiration !== expiration) {
        return;
      }

      const strike = contractInfo.strike;
      const optionType = contractInfo.type;

      if (!strikeMap[strike]) {
        strikeMap[strike] = { strike, call: {}, put: {} };
      }

      const latestQuote = snapshot.latestQuote || {};
      const latestTrade = snapshot.latestTrade || {};
      const greeks = snapshot.greeks || {};
      const impliedVol = snapshot.impliedVolatility || 0;

      strikeMap[strike][optionType] = {
        bid: latestQuote.bp || 0,
        ask: latestQuote.ap || 0,
        lastPrice: latestTrade.p || 0,
        volume: latestTrade.s || 0,
        openInterest: 0,
        impliedVolatility: impliedVol,
        delta: greeks.delta !== undefined ? greeks.delta : null,
        gamma: greeks.gamma !== undefined ? greeks.gamma : null,
        theta: greeks.theta !== undefined ? greeks.theta : null,
        vega: greeks.vega !== undefined ? greeks.vega : null,
        rho: greeks.rho !== undefined ? greeks.rho : null,
        contractSymbol: contractSymbol,
        expiration: contractInfo.expiration,
        hasGreeks: !!snapshot.greeks
      };
    });

    const strikes = Object.values(strikeMap).sort((a, b) => a.strike - b.strike);

    if (strikes.length === 0) {
      throw new Error('No options found for the specified criteria');
    }

    return strikes;
  } catch (error) {
    console.error('Error fetching Alpaca option chain:', error.message);
    throw error;
  }
}

async function fetchAlpacaExpirations(symbol, apiKey, secretKey) {
  try {
    const response = await axios.get(`https://data.alpaca.markets/v1beta1/options/snapshots/${symbol}`, {
      params: {
        feed: 'indicative',
        limit: 1000
      },
      headers: {
        'accept': 'application/json',
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey
      }
    });

    const snapshots = response.data?.snapshots;
    
    if (!snapshots || Object.keys(snapshots).length === 0) {
      throw new Error('No option data available for this symbol');
    }
    
    const zeroDTESymbols = ['SPY', 'QQQ', 'IWM', 'DIA', 'SPX', 'NDX', 'RUT'];
    const isZeroDTE = zeroDTESymbols.includes(symbol.toUpperCase());
    
    const expirationSet = new Set();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(today.getDate() + 7);
    endOfWeek.setHours(23, 59, 59, 999);
    
    Object.keys(snapshots).forEach(contractSymbol => {
      const contractInfo = parseAlpacaContractSymbol(contractSymbol, symbol);
      if (contractInfo && contractInfo.expiration) {
        const expirationDate = new Date(contractInfo.expiration);
        expirationDate.setHours(0, 0, 0, 0);
        
        const isToday = expirationDate.getTime() === today.getTime();
        const isThisWeek = expirationDate >= today && expirationDate <= endOfWeek;
        
        if (isToday && isZeroDTE) {
          expirationSet.add(contractInfo.expiration);
        } else if (isThisWeek) {
          expirationSet.add(contractInfo.expiration);
        } else if (expirationDate > today) {
          expirationSet.add(contractInfo.expiration);
        }
      }
    });

    const expirations = Array.from(expirationSet).sort();

    if (expirations.length === 0) {
      throw new Error('No expiration dates found for this symbol');
    }

    return expirations;
  } catch (error) {
    console.error('Error fetching Alpaca expirations:', error.message);
    throw error;
  }
}

function parseAlpacaContractSymbol(contractSymbol, underlyingSymbol) {
  try {
    const symbolLength = underlyingSymbol.length;
    const remaining = contractSymbol.substring(symbolLength);
    
    const dateStr = remaining.substring(0, 6);
    const year = '20' + dateStr.substring(0, 2);
    const month = dateStr.substring(2, 4);
    const day = dateStr.substring(4, 6);
    const expiration = `${year}-${month}-${day}`;
    
    const typeChar = remaining.charAt(6);
    const type = typeChar === 'C' ? 'call' : 'put';
    
    const strikeStr = remaining.substring(7);
    const strike = parseInt(strikeStr) / 1000;
    
    return {
      expiration,
      type,
      strike
    };
  } catch (error) {
    console.error('Error parsing contract symbol:', contractSymbol, error);
    return null;
  }
}
