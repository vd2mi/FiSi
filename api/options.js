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
    // First, get all option contracts for this underlying symbol
    const contractsResponse = await axios.get('https://data.alpaca.markets/v2/options/contracts', {
      params: {
        underlying_symbol: symbol,
        limit: 1000,
        expiration_date: expiration || undefined
      },
      headers: {
        'accept': 'application/json',
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey
      }
    });

    const contracts = contractsResponse.data?.contracts;
    
    if (!contracts || contracts.length === 0) {
      throw new Error('No option data available for this symbol');
    }

    // Fetch latest quotes for all contracts in batches (limit is typically 100)
    const BATCH_SIZE = 100;
    const quotes = {};
    
    for (let i = 0; i < contracts.length; i += BATCH_SIZE) {
      const batch = contracts.slice(i, i + BATCH_SIZE);
      const identifiers = batch.map(c => c.name).join(',');
      
      try {
        const quotesResponse = await axios.get('https://data.alpaca.markets/v2/options/latest/quotes', {
          params: {
            feed: 'opra',
            identifiers: identifiers
          },
          headers: {
            'accept': 'application/json',
            'APCA-API-KEY-ID': apiKey,
            'APCA-API-SECRET-KEY': secretKey
          }
        });
        
        if (quotesResponse.data?.quotes) {
          Object.assign(quotes, quotesResponse.data.quotes);
        }
      } catch (error) {
        console.error(`Error fetching batch ${i / BATCH_SIZE + 1}:`, error.message);
        // Continue with other batches even if one fails
      }
    }

    // Build strike map
    const strikeMap = {};

    contracts.forEach(contract => {
      const strike = parseFloat(contract.strike_price);
      const optionType = contract.type === 'call' ? 'call' : 'put';
      const contractExpiration = contract.expiration_date;

      // Filter by expiration if specified
      if (expiration && contractExpiration !== expiration) {
        return;
      }

      if (!strikeMap[strike]) {
        strikeMap[strike] = { strike, call: {}, put: {} };
      }

      const quote = quotes[contract.name] || {};
      const latestTrade = quote.trade || {};
      const greeks = quote.greeks || {};

      strikeMap[strike][optionType] = {
        bid: quote.bid_price || 0,
        ask: quote.ask_price || 0,
        lastPrice: quote.last_quote?.last_price || 0,
        volume: latestTrade.size || 0,
        openInterest: contract.open_interest || 0,
        impliedVolatility: quote.implied_volatility || 0,
        delta: greeks.delta !== undefined ? greeks.delta : null,
        gamma: greeks.gamma !== undefined ? greeks.gamma : null,
        theta: greeks.theta !== undefined ? greeks.theta : null,
        vega: greeks.vega !== undefined ? greeks.vega : null,
        rho: greeks.rho !== undefined ? greeks.rho : null,
        contractSymbol: contract.name,
        expiration: contractExpiration,
        hasGreeks: !!quote.greeks
      };
    });

    const strikes = Object.values(strikeMap).sort((a, b) => a.strike - b.strike);

    if (strikes.length === 0) {
      throw new Error('No options found for the specified criteria');
    }

    return strikes;
  } catch (error) {
    console.error('Error fetching Alpaca option chain:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

async function fetchAlpacaExpirations(symbol, apiKey, secretKey) {
  try {
    // Get all option contracts for this underlying symbol to extract expiration dates
    const response = await axios.get('https://data.alpaca.markets/v2/options/contracts', {
      params: {
        underlying_symbol: symbol,
        limit: 1000
      },
      headers: {
        'accept': 'application/json',
        'APCA-API-KEY-ID': apiKey,
        'APCA-API-SECRET-KEY': secretKey
      }
    });

    const contracts = response.data?.contracts;
    
    if (!contracts || contracts.length === 0) {
      throw new Error('No option data available for this symbol');
    }
    
    const expirationSet = new Set();
    
    contracts.forEach(contract => {
      if (contract.expiration_date) {
        expirationSet.add(contract.expiration_date);
      }
    });

    const expirations = Array.from(expirationSet).sort();

    if (expirations.length === 0) {
      throw new Error('No expiration dates found for this symbol');
    }

    return expirations;
  } catch (error) {
    console.error('Error fetching Alpaca expirations:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

