# Fi-Si Financial Terminal

A modern, real-time financial terminal web application with support for stocks, options, cryptocurrency, portfolio management, and financial news. Built with React and deployed on Vercel with serverless functions.

![Fi-Si Terminal](https://img.shields.io/badge/version-1.0.0-purple.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> ⚠️ **Demo Application**: This is a portfolio simulation tool for educational purposes. Not for real trading.

## Features

### 📊 Stocks
- Real-time stock quotes with WebSocket updates
- Interactive price charts with multiple timeframes
- Company profiles and information
- Popular stocks dashboard
- Symbol search functionality

### 💼 Portfolio Management
- Virtual portfolio with $100,000 starting cash
- Buy/sell stock simulation
- Real-time holdings tracking
- Average buy price calculation
- Transaction history
- Portfolio value and gains tracking

### 📈 Options Trading
- Option chains with calls and puts
- Multiple expiration dates
- Greeks display (Delta, Gamma, Theta, Vega)
- Strike prices and implied volatility
- Open interest and volume data

### 📰 Financial News
- Latest market news from multiple categories
- Real-time news updates
- Categories: General, Forex, Crypto, M&A
- Source attribution and timestamps

### ₿ Cryptocurrency
- Real-time crypto prices for top 50 coins
- Interactive price charts
- Market cap and 24h volume
- Price change indicators
- Circulating and max supply information

### 🎨 Modern Terminal UI
- Movable and resizable panels
- Dark theme optimized for extended viewing
- Responsive grid layout
- Customizable workspace
- Real-time connection status indicator

## Technology Stack

### Frontend
- React 18.2
- React Grid Layout
- Recharts
- Tailwind CSS
- Lucide React
- Axios
- Firebase

### Deployment
- Vercel (Frontend & Serverless Functions)
- Firebase (Authentication & Database)

### APIs
- Finnhub (Stocks, news, charts)
- CoinGecko (Cryptocurrency data)
- Theta Data (Options chains and Greeks)

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Finnhub API key: https://finnhub.io/register
- Firebase project: https://console.firebase.google.com/

### Installation

1. Clone and install
```bash
git clone <your-repo-url>
cd FiSi/client
npm install
```

2. Configure environment variables

Create `client/.env`:
```env
REACT_APP_API_URL=your_vercel_deployment_url
REACT_APP_WS_URL=ws://localhost:3001
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456
REACT_APP_FIREBASE_APP_ID=your_app_id
```

3. Run locally
```bash
npm start
```

4. Open http://localhost:3000 and enter any username to start!

## Deployment to Vercel

This application is designed to be deployed on Vercel with serverless functions.

1. Create a Vercel account at https://vercel.com
2. Install Vercel CLI: `npm i -g vercel`
3. Deploy: `vercel`
4. Configure environment variables in Vercel dashboard
5. Add your Vercel deployment URL to Firebase authorized domains

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Finnhub for stock market data
- CoinGecko for cryptocurrency data
- Theta Data for options data
- React Grid Layout for the movable UI
- Recharts for beautiful charts

Built with ❤️ for financial enthusiasts and traders
