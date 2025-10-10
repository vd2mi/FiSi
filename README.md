# 🟢 Fi-Si Financial Terminal

> **Matrix-themed real-time financial terminal** with live WebSocket streaming, candlestick charts, and options Greeks analysis.

![Version](https://img.shields.io/badge/version-1.0.0-00ff41.svg)
![License](https://img.shields.io/badge/license-MIT-00ff41.svg)
![Matrix](https://img.shields.io/badge/style-MATRIX-00ff41.svg)
![Live](https://img.shields.io/badge/status-LIVE-00ff41.svg)

**🔗 Live Demo:** [fi-si.vercel.app](https://fi-si.vercel.app)

---

## 🎯 **What It Does**

Professional-grade financial terminal for tracking stocks, options, cryptocurrency, and portfolio performance in real-time. Built with modern web technologies and deployed on a distributed serverless architecture.

### **Key Highlights:**
- 📡 **Live WebSocket streaming** - Prices update every 5 seconds
- 📊 **OHLC Candlestick charts** - Professional trading visualization
- 🎲 **Options Greeks** - Delta, Gamma, Theta, Vega on hover
- 💼 **Portfolio tracking** - Buy/sell simulation with P&L calculations
- 🔐 **Firebase Authentication** - Secure user management
- 🎨 **Matrix UI** - Pitch black + neon green aesthetic

---

## 🏗️ **Architecture**

```
┌─────────────────────────────────────────────────┐
│  Frontend (Vercel)                              │
│  React SPA with drag-and-drop panels            │
└──────────────┬──────────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
       ▼               ▼
┌─────────────┐  ┌──────────────────┐
│  WebSocket  │  │ Serverless APIs  │
│   Server    │  │    (Vercel)      │
│  (Render)   │  │                  │
│             │  │ • /api/stocks    │
│ • 5s updates│  │ • /api/crypto    │
│ • Auto-sub  │  │ • /api/options   │
│ • Reconnect │  │ • /api/news      │
└─────────────┘  │ • /api/portfolio │
                 └──────────────────┘
                          │
            ┌─────────────┼─────────────┐
            ▼             ▼             ▼
       Finnhub      CoinGecko    Yahoo Finance
```

**Distributed microservices architecture** - Frontend, API layer, and WebSocket server all independently scaled.

---

## ✨ **Features**

### **Real-Time Data Streaming**
- WebSocket connections for live price updates
- Automatic reconnection on network issues
- Efficient subscription management
- 5-second refresh intervals with optimized re-rendering

### **Advanced Charting**
- OHLC candlestick visualization
- Multiple timeframes (1D, 1W, 1M, 3M, 1Y)
- Interactive tooltips showing Open/High/Low/Close
- Color-coded bull/bear candles

### **Options Analysis**
- Full option chains (calls & puts)
- Greeks displayed on hover
- Real expiration dates
- Bid/Ask spreads & volume
- Open interest data

### **Portfolio Management**
- $100K virtual starting capital
- Real-time P&L calculations
- Position tracking with average cost basis
- Transaction history
- Holdings performance metrics

### **Modern Terminal UI**
- Drag-and-drop resizable panels
- Customizable layout persistence
- Matrix-inspired neon aesthetics
- Responsive design

---

## 🛠️ **Tech Stack**

### **Frontend**
- **React 18** - Component-based UI with memoization & performance optimizations
- **Tailwind CSS** - Utility-first styling with custom Matrix theme
- **React Grid Layout** - Movable/resizable panels
- **Recharts** - Optimized candlestick chart rendering with `useMemo`
- **Axios** - HTTP client
- **Firebase SDK** - Client-side authentication

### **Backend**
- **Vercel Serverless Functions** - Auto-scaling API endpoints
- **Node.js WebSocket Server** - Real-time price streaming (Render)
- **Firebase Admin SDK** - Server-side auth validation

### **Data Sources**
- **Finnhub API** - Stock quotes, company data, financial news
- **Alpha Vantage** - Historical OHLC candlestick data
- **CoinGecko API** - Cryptocurrency market data
- **Yahoo Finance** - Options chains with Greeks

### **Infrastructure**
- **Vercel** - Frontend hosting + serverless functions
- **Render** - WebSocket server deployment
- **Firebase** - Authentication & Firestore database

---

## 🚀 **Local Development**

### **Prerequisites**
- Node.js 16+
- Git
- Firebase project
- API keys (Finnhub, Alpha Vantage)

### **Setup**

1. **Clone repository**
```bash
git clone https://github.com/vd2mi/FiSi.git
cd FiSi
```

2. **Install dependencies**
```bash
cd client && npm install
cd ../ws-server && npm install
```

3. **Configure environment**

`client/.env`:
```env
REACT_APP_WS_URL=ws://localhost:8080
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-domain.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project
REACT_APP_FIREBASE_STORAGE_BUCKET=your-bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456
REACT_APP_FIREBASE_APP_ID=your-app-id
```

`ws-server/.env`:
```env
FINNHUB_API_KEY=your_finnhub_key
COINGECKO_API_KEY=your_coingecko_key
PORT=8080
```

4. **Run servers**
```bash
# Terminal 1 - WebSocket
cd ws-server && npm start

# Terminal 2 - Frontend
cd client && npm start
```

5. **Open** http://localhost:3000

---

## 📦 **Deployment**

### **Frontend + API (Vercel)**

1. Push to GitHub
2. Import project to Vercel
3. Set root directory to **blank/empty**
4. Add environment variables
5. Deploy

### **WebSocket Server (Render)**

1. Create new Web Service
2. Connect GitHub repo
3. Set root directory: `ws-server`
4. Add environment variables
5. Deploy on free tier

### **Environment Variables**

**Vercel (Frontend):**
- All `REACT_APP_*` Firebase config
- `REACT_APP_WS_URL` (from Render)

**Vercel (Serverless API):**
- `FINNHUB_API_KEY`
- `ALPHAVANTAGE_API_KEY`
- `COINGECKO_API_KEY`
- Firebase Admin credentials

**Render (WebSocket):**
- `FINNHUB_API_KEY`
- `COINGECKO_API_KEY`
- `PORT` (required, default: 8080)

---

## 🎓 **Learning Outcomes**

This project demonstrates:

- ✅ **Full-stack development** - React frontend + Node.js backend
- ✅ **Real-time systems** - WebSocket protocol implementation
- ✅ **Serverless architecture** - Vercel Functions
- ✅ **Microservices** - Distributed deployment strategy
- ✅ **State management** - React hooks & context
- ✅ **Performance optimization** - React.memo, useMemo, useCallback for efficient re-renders
- ✅ **Authentication** - Firebase Auth with secure routes
- ✅ **API integration** - Multiple third-party services
- ✅ **Data visualization** - Custom candlestick charts
- ✅ **Responsive design** - Drag-and-drop grid system
- ✅ **Production deployment** - Multi-platform hosting

---

## 🔒 **Security**

- Firebase Authentication for user management
- API keys secured server-side only
- CORS policies configured
- Firestore security rules enforced
- Client credentials safely exposed (by design)

---

## 📊 **API Rate Limits**

Free tier limits and caching strategy:

| Service | Limit | Strategy |
|---------|-------|----------|
| Finnhub | 60/min | WebSocket reduces to ~10/min |
| CoinGecko | 50/min | 10s cache |
| Alpha Vantage | 25/day | Used for charts only |
| Yahoo Finance | None | Direct scraping |

---

## 🤝 **Contributing**

This is a portfolio/educational project. Feel free to fork and customize!

---

## 📄 **License**

MIT License - See [LICENSE](LICENSE) file

---

## 🙏 **Credits**

- **APIs:** Finnhub, Alpha Vantage, CoinGecko, Yahoo Finance
- **UI Libraries:** React Grid Layout, Recharts, Lucide React
- **Infrastructure:** Vercel, Render, Firebase

---

**Built with ❤️ and lots of caffeine** ☕

*For educational and portfolio purposes only. Not financial advice.*
