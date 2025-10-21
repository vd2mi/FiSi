const axios = require('axios');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action, symbol, expiration } = req.query;

  // Check for Alpaca API credentials
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
    // Fetch option chain snapshots from Alpaca
    const response = await axios.get(`https://data.alpaca.markets/v1beta1/options/snapshots/${symbol}`, {
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey
      }
    });

    const snapshots = response.data?.snapshots;
    
    if (!snapshots || Object.keys(snapshots).length === 0) {
      throw new Error('No option data available for this symbol');
    }

    // Group options by strike price
    const strikeMap = {};

    Object.entries(snapshots).forEach(([contractSymbol, snapshot]) => {
      // Parse contract symbol to extract strike, type, and expiration
      // Alpaca format: AAPL250117C00100000 (symbol + YYMMDD + C/P + strike * 1000)
      const contractInfo = parseAlpacaContractSymbol(contractSymbol, symbol);
      
      if (!contractInfo) return;

      // Filter by expiration date if provided
      if (expiration && contractInfo.expiration !== expiration) {
        return;
      }

      const strike = contractInfo.strike;
      const optionType = contractInfo.type; // 'call' or 'put'

      if (!strikeMap[strike]) {
        strikeMap[strike] = { strike, call: {}, put: {} };
      }

      const latestQuote = snapshot.latestQuote || {};
      const latestTrade = snapshot.latestTrade || {};
      const greeks = snapshot.greeks || {};

      strikeMap[strike][optionType] = {
        bid: latestQuote.bp || 0,
        ask: latestQuote.ap || 0,
        lastPrice: latestTrade.p || 0,
        volume: latestTrade.s || 0,
        impliedVolatility: snapshot.impliedVolatility || greeks.implied_volatility || 0,
        // Greeks
        delta: greeks.delta || 0,
        gamma: greeks.gamma || 0,
        theta: greeks.theta || 0,
        vega: greeks.vega || 0,
        rho: greeks.rho || 0,
        // Additional metadata
        contractSymbol: contractSymbol,
        expiration: contractInfo.expiration
      };
    });

    // Convert to array and sort by strike
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
    // Fetch option contracts to get available expirations
    const response = await axios.get('https://paper-api.alpaca.markets/v2/options/contracts', {
      params: {
        underlying_symbols: symbol,
        limit: 1000
      },
      headers: {
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey
      }
    });

    const contracts = response.data?.option_contracts || [];
    
    // Extract unique expiration dates
    const expirationSet = new Set();
    contracts.forEach(contract => {
      if (contract.expiration_date) {
        expirationSet.add(contract.expiration_date);
      }
    });

    // Convert to sorted array
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
    // Alpaca option contract format: SYMBOL + YYMMDD + C/P + 8-digit strike price
    // Example: AAPL250117C00150000 = AAPL expiring Jan 17, 2025, Call at $150
    
    const symbolLength = underlyingSymbol.length;
    const remaining = contractSymbol.substring(symbolLength);
    
    // Extract date (YYMMDD)
    const dateStr = remaining.substring(0, 6);
    const year = '20' + dateStr.substring(0, 2);
    const month = dateStr.substring(2, 4);
    const day = dateStr.substring(4, 6);
    const expiration = `${year}-${month}-${day}`;
    
    // Extract option type (C or P)
    const typeChar = remaining.charAt(6);
    const type = typeChar === 'C' ? 'call' : 'put';
    
    // Extract strike price (8 digits, divide by 1000)
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
