import React, { useState, useEffect, useCallback } from 'react';
import { Bitcoin, Search } from 'lucide-react';
import TabContainer from '../TabContainer';
import CryptoChart from '../CryptoChart';
import { cryptoAPI } from '../../services/api';

function CryptoTab({ subscribe, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoin, setSelectedCoin] = useState({ id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' });
  const [cryptoList, setCryptoList] = useState([]);
  const [coinDetails, setCoinDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCoin) {
      const unsubscribe = subscribe('crypto', selectedCoin.id, (data) => {
        setCoinDetails(prev => prev ? { ...prev, market_data: { ...prev.market_data, current_price: { usd: data.price } } } : null);
      });
      return unsubscribe;
    }
  }, [selectedCoin, subscribe]);

  const loadTopCryptos = useCallback(async () => {
    try {
      const res = await cryptoAPI.getTop(50);
      setCryptoList(res.data.data || []);
    } catch (error) {
      console.error('Error loading cryptos:', error);
    }
  }, []);

  const loadCoinDetails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cryptoAPI.getDetails(selectedCoin.id);
      setCoinDetails(res.data.data);
    } catch (error) {
      console.error('Error loading coin details:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedCoin.id]);

  useEffect(() => {
    loadTopCryptos();
  }, [loadTopCryptos]);

  useEffect(() => {
    if (selectedCoin) {
      loadCoinDetails();
    }
  }, [selectedCoin, loadCoinDetails]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const found = cryptoList.find(
        c => c.symbol.toLowerCase() === searchQuery.toLowerCase() ||
             c.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (found) {
        setSelectedCoin({ id: found.id, name: found.name, symbol: found.symbol.toUpperCase() });
        setSearchQuery('');
      }
    }
  };

  const formatPrice = (price) => {
    if (!price) return '--';
    if (price < 1) return `$${price.toFixed(6)}`;
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatMarketCap = (cap) => {
    if (!cap) return '--';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  const formatVolume = (vol) => {
    if (!vol) return '--';
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    return `$${vol.toLocaleString()}`;
  };

  return (
    <TabContainer
      title="Cryptocurrency"
      icon={Bitcoin}
      onClose={onClose}
      actions={
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search crypto..."
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
          {coinDetails && (
            <div className="bg-terminal-bg rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {coinDetails.image?.small && (
                    <img src={coinDetails.image.small} alt={coinDetails.name} className="w-12 h-12 rounded-full" />
                  )}
                  <div>
                    <h4 className="text-lg font-semibold text-terminal-text">{coinDetails.name}</h4>
                    <p className="text-sm text-terminal-muted">{coinDetails.symbol?.toUpperCase()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-terminal-text">
                    {formatPrice(coinDetails.market_data?.current_price?.usd)}
                  </div>
                  {coinDetails.market_data?.price_change_percentage_24h && (
                    <div className={`text-sm ${
                      coinDetails.market_data.price_change_percentage_24h >= 0 
                        ? 'text-terminal-green' 
                        : 'text-terminal-red'
                    }`}>
                      {coinDetails.market_data.price_change_percentage_24h >= 0 ? '+' : ''}
                      {coinDetails.market_data.price_change_percentage_24h.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-terminal-muted">Market Cap</div>
                  <div className="text-terminal-text font-semibold">
                    {formatMarketCap(coinDetails.market_data?.market_cap?.usd)}
                  </div>
                </div>
                <div>
                  <div className="text-terminal-muted">24h Volume</div>
                  <div className="text-terminal-text font-semibold">
                    {formatVolume(coinDetails.market_data?.total_volume?.usd)}
                  </div>
                </div>
                <div>
                  <div className="text-terminal-muted">24h High</div>
                  <div className="text-terminal-text font-semibold">
                    {formatPrice(coinDetails.market_data?.high_24h?.usd)}
                  </div>
                </div>
                <div>
                  <div className="text-terminal-muted">24h Low</div>
                  <div className="text-terminal-text font-semibold">
                    {formatPrice(coinDetails.market_data?.low_24h?.usd)}
                  </div>
                </div>
                {coinDetails.market_data?.circulating_supply && (
                  <>
                    <div>
                      <div className="text-terminal-muted">Circulating Supply</div>
                      <div className="text-terminal-text font-semibold">
                        {coinDetails.market_data.circulating_supply.toLocaleString()} {coinDetails.symbol?.toUpperCase()}
                      </div>
                    </div>
                    {coinDetails.market_data?.max_supply && (
                      <div>
                        <div className="text-terminal-muted">Max Supply</div>
                        <div className="text-terminal-text font-semibold">
                          {coinDetails.market_data.max_supply.toLocaleString()} {coinDetails.symbol?.toUpperCase()}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}

          <CryptoChart coinId={selectedCoin.id} />

          <div className="bg-terminal-bg rounded-lg p-4">
            <h5 className="text-sm font-semibold text-terminal-text mb-3">Top Cryptocurrencies</h5>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {cryptoList.slice(0, 20).map((crypto) => (
                <button
                  key={crypto.id}
                  onClick={() => setSelectedCoin({ id: crypto.id, name: crypto.name, symbol: crypto.symbol.toUpperCase() })}
                  className={`w-full text-left p-2 rounded hover:bg-terminal-panel transition-colors ${
                    selectedCoin.id === crypto.id ? 'bg-terminal-panel' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {crypto.image && (
                        <img src={crypto.image} alt={crypto.name} className="w-8 h-8 rounded-full" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-terminal-text">{crypto.name}</div>
                        <div className="text-xs text-terminal-muted">{crypto.symbol?.toUpperCase()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-terminal-text">{formatPrice(crypto.current_price)}</div>
                      <div className={`text-xs ${
                        crypto.price_change_percentage_24h >= 0 
                          ? 'text-terminal-green' 
                          : 'text-terminal-red'
                      }`}>
                        {crypto.price_change_percentage_24h >= 0 ? '▲' : '▼'} 
                        {Math.abs(crypto.price_change_percentage_24h || 0).toFixed(2)}%
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

export default CryptoTab;
