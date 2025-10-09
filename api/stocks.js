const axios = require('axios');

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const ALPHAVANTAGE_API_KEY = process.env.ALPHAVANTAGE_API_KEY;
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
        if (ALPHAVANTAGE_API_KEY) {
          const interval = resolution === '5' ? '5min' : resolution === '60' ? '60min' : 'daily';
          const func = interval.includes('min') ? 'TIME_SERIES_INTRADAY' : 'TIME_SERIES_DAILY';
          
          const avResponse = await axios.get('https://www.alphavantage.co/query', {
            params: {
              function: func,
              symbol,
              interval: interval.includes('min') ? interval : undefined,
              outputsize: 'full',
              apikey: ALPHAVANTAGE_API_KEY
            }
          });

          const timeSeriesKey = Object.keys(avResponse.data).find(key => key.includes('Time Series'));
          const timeSeries = avResponse.data[timeSeriesKey];
          
          if (timeSeries) {
            const candles = Object.entries(timeSeries)
              .map(([time, data]) => ({
                t: new Date(time).getTime() / 1000,
                o: parseFloat(data['1. open']),
                h: parseFloat(data['2. high']),
                l: parseFloat(data['3. low']),
                c: parseFloat(data['4. close']),
                v: parseInt(data['5. volume'])
              }))
              .sort((a, b) => a.t - b.t);

            return res.status(200).json({
              data: {
                s: 'ok',
                t: candles.map(c => c.t),
                o: candles.map(c => c.o),
                h: candles.map(c => c.h),
                l: candles.map(c => c.l),
                c: candles.map(c => c.c),
                v: candles.map(c => c.v)
              }
            });
          }
        }
        
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

