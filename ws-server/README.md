# Fi-Si WebSocket Server

Real-time price streaming for stocks and crypto.

## Deploy to Railway (FREE)

Railway will give you a URL like: `ws://your-app.railway.app`

## Add to Your Frontend

In Vercel environment variables, add:
```
REACT_APP_WS_URL=wss://your-app.railway.app
```

## Local Testing

```bash
cd ws-server
npm install
FINNHUB_API_KEY=your_key npm start
```

## How It Works

- Clients subscribe to symbols
- Server fetches prices every 5 seconds
- Broadcasts to all subscribed clients
- Automatic reconnection on disconnect
- Heartbeat ping/pong to detect dead connections

