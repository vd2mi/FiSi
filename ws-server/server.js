const WebSocket = require('ws');
const axios = require('axios');

const PORT = process.env.PORT || 8080;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

const wss = new WebSocket.Server({ 
  port: PORT,
  verifyClient: (info) => {
    return true;
  }
});

const subscriptions = new Map();
const priceCache = new Map();

console.log(`WebSocket server running on port ${PORT}`);

wss.on('connection', (ws) => {
  console.log('Client connected');
  
  ws.isAlive = true;
  ws.subscriptions = new Set();

  ws.on('pong', () => {
    ws.isAlive = true;
  });

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'subscribe':
          handleSubscribe(ws, data.payload);
          break;
        
        case 'unsubscribe':
          handleUnsubscribe(ws, data.payload);
          break;
        
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
      }
    } catch (error) {
      console.error('Message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    ws.subscriptions.forEach(sub => {
      const subs = subscriptions.get(sub);
      if (subs) {
        subs.delete(ws);
        if (subs.size === 0) {
          subscriptions.delete(sub);
        }
      }
    });
  });
});

function handleSubscribe(ws, payload) {
  const { channel, symbols } = payload;
  
  symbols.forEach(symbol => {
    const key = `${channel}:${symbol}`;
    ws.subscriptions.add(key);
    
    if (!subscriptions.has(key)) {
      subscriptions.set(key, new Set());
    }
    subscriptions.get(key).add(ws);
    
    const cached = priceCache.get(key);
    if (cached && Date.now() - cached.timestamp < 5000) {
      ws.send(JSON.stringify({
        type: 'update',
        channel,
        symbol,
        data: cached.data,
        timestamp: cached.timestamp
      }));
    }
  });
}

function handleUnsubscribe(ws, payload) {
  const { channel, symbols } = payload;
  
  symbols.forEach(symbol => {
    const key = `${channel}:${symbol}`;
    ws.subscriptions.delete(key);
    
    const subs = subscriptions.get(key);
    if (subs) {
      subs.delete(ws);
      if (subs.size === 0) {
        subscriptions.delete(key);
      }
    }
  });
}

async function fetchStockPrice(symbol) {
  try {
    const response = await axios.get('https://finnhub.io/api/v1/quote', {
      params: { symbol, token: FINNHUB_API_KEY }
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${symbol}:`, error.message);
    return null;
  }
}

async function fetchCryptoPrice(coinId) {
  try {
    const url = COINGECKO_API_KEY 
      ? `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&x_cg_demo_api_key=${COINGECKO_API_KEY}`
      : `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
    
    const response = await axios.get(url);
    return { price: response.data[coinId]?.usd };
  } catch (error) {
    console.error(`Error fetching ${coinId}:`, error.message);
    return null;
  }
}

async function broadcastUpdates() {
  const updates = [];
  
  for (const [key, clients] of subscriptions.entries()) {
    if (clients.size === 0) continue;
    
    const [channel, symbol] = key.split(':');
    let data;
    
    if (channel === 'stock') {
      data = await fetchStockPrice(symbol);
    } else if (channel === 'crypto') {
      data = await fetchCryptoPrice(symbol);
    }
    
    if (data) {
      priceCache.set(key, { data, timestamp: Date.now() });
      
      const message = JSON.stringify({
        type: 'update',
        channel,
        symbol,
        data,
        timestamp: Date.now()
      });
      
      clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

setInterval(broadcastUpdates, 5000);

const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (!ws.isAlive) {
      ws.terminate();
      return;
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(pingInterval);
});

