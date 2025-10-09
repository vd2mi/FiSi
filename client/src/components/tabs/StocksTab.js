import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Search } from 'lucide-react';
import TabContainer from '../TabContainer';
import StockChart from '../StockChart';
import { stocksAPI } from '../../services/api';

function StocksTab({ subscribe, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [stockData, setStockData] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [popularStocks, setPopularStocks] = useState([]);

  useEffect(() => {
    if (selectedSymbol) {
      const unsubscribe = subscribe('stock', selectedSymbol, (data) => {
        setStockData(prev => ({ ...prev, ...data }));
      });
      return unsubscribe;
    }
  }, [selectedSymbol, subscribe]);

  const loadStockData = useCallback(async (symbol) => {
    setLoading(true);
    try {
      const [quoteRes, profileRes] = await Promise.all([
        stocksAPI.getQuote(symbol),
        stocksAPI.getProfile(symbol),
      ]);
      setStockData(quoteRes.data.data);
      setProfile(profileRes.data.data);
    } catch (error) {
      console.error('Error loading stock data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPopularStocks = useCallback(async () => {
    try {
      const res = await stocksAPI.getPopular();
      setPopularStocks(res.data.data || []);
    } catch (error) {
      console.error('Error loading popular stocks:', error);
    }
  }, []);

  useEffect(() => {
    if (selectedSymbol) {
      loadStockData(selectedSymbol);
    }
  }, [selectedSymbol, loadStockData]);

  useEffect(() => {
    loadPopularStocks();
  }, [loadPopularStocks]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedSymbol(searchQuery.toUpperCase());
      setSearchQuery('');
    }
  };

  const formatPrice = (price) => {
    return price ? `$${price.toFixed(2)}` : '--';
  };

  const formatChange = (change, percent) => {
    if (!change) return '--';
    const sign = change >= 0 ? '+' : '';
    return `${sign}${change.toFixed(2)} (${sign}${percent?.toFixed(2)}%)`;
  };

  return (
    <TabContainer
      title="Stocks"
      icon={TrendingUp}
      onClose={onClose}
      actions={
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symbol..."
            className="px-3 py-1 text-sm bg-terminal-bg border border-terminal-border rounded text-terminal-text placeholder-terminal-muted focus:outline-none focus:border-terminal-accent"
          />
          <button
            type="submit"
            className="p-1 rounded hover:bg-terminal-border text-terminal-muted hover:text-terminal-text transition-colors"
          >
            <Search size={16} />
          </button>
        </form>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-terminal-muted">Loading...</div>
        </div>
      ) : (
        <div className="space-y-4">
          {profile && (
            <div className="bg-terminal-bg rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="text-lg font-semibold text-terminal-text">{selectedSymbol}</h4>
                  <p className="text-sm text-terminal-muted">{profile.name}</p>
                </div>
                {profile.logo && (
                  <img src={profile.logo} alt={profile.name} className="w-12 h-12 rounded" />
                )}
              </div>
              
              {stockData && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <div className="text-2xl font-bold text-terminal-text">
                      {formatPrice(stockData.c)}
                    </div>
                    <div className={`text-sm ${stockData.d >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                      {formatChange(stockData.d, stockData.dp)}
                    </div>
                  </div>
                  <div className="text-right text-sm space-y-1">
                    <div className="text-terminal-muted">Open: <span className="text-terminal-text">{formatPrice(stockData.o)}</span></div>
                    <div className="text-terminal-muted">High: <span className="text-terminal-text">{formatPrice(stockData.h)}</span></div>
                    <div className="text-terminal-muted">Low: <span className="text-terminal-text">{formatPrice(stockData.l)}</span></div>
                    <div className="text-terminal-muted">Prev Close: <span className="text-terminal-text">{formatPrice(stockData.pc)}</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          <StockChart symbol={selectedSymbol} />

          <div className="bg-terminal-bg rounded-lg p-4">
            <h5 className="text-sm font-semibold text-terminal-text mb-3">Popular Stocks</h5>
            <div className="space-y-2">
              {popularStocks.slice(0, 8).map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => setSelectedSymbol(stock.symbol)}
                  className={`w-full text-left p-2 rounded hover:bg-terminal-panel transition-colors ${
                    selectedSymbol === stock.symbol ? 'bg-terminal-panel' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-terminal-text">{stock.symbol}</div>
                      <div className="text-xs text-terminal-muted">{stock.profile?.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-terminal-text">{formatPrice(stock.c)}</div>
                      <div className={`text-xs ${stock.d >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                        {stock.d >= 0 ? '+' : ''}{stock.dp?.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </TabContainer>
  );
}

export default StocksTab;
