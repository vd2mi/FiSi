import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Minus } from 'lucide-react';
import TabContainer from '../TabContainer';
import { stocksAPI } from '../../services/api';
import { portfolioService } from '../../services/portfolioService';

const PortfolioTab = React.memo(({ userId, subscribe, onClose }) => {
  const [portfolio, setPortfolio] = useState({ holdings: [], transactions: [], cash: 100000 });
  const [loading, setLoading] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const [tradeForm, setTradeForm] = useState({ symbol: '', quantity: '', type: 'buy' });
  const [currentPrices, setCurrentPrices] = useState({});

  const loadPortfolio = useCallback(() => {
    setLoading(true);
    try {
      const data = portfolioService.get(userId);
      setPortfolio(data);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  useEffect(() => {
    if (portfolio.holdings.length > 0) {
      portfolio.holdings.forEach(holding => {
        loadCurrentPrice(holding.symbol);
      });
      
      const unsubscribes = portfolio.holdings.map(holding => {
        if (subscribe) {
          return subscribe('stock', holding.symbol, (data) => {
            setCurrentPrices(prev => ({ ...prev, [holding.symbol]: data.c }));
          });
        }
        return null;
      });
      
      return () => {
        unsubscribes.forEach(unsub => unsub && unsub());
      };
    }
  }, [portfolio.holdings, subscribe]);

  const loadCurrentPrice = async (symbol) => {
    try {
      const res = await stocksAPI.getQuote(symbol);
      setCurrentPrices(prev => ({ ...prev, [symbol]: res.data.data.c }));
    } catch (error) {
      console.error(`Error loading price for ${symbol}:`, error);
    }
  };

  const handleTrade = async (e) => {
    e.preventDefault();
    const { symbol, quantity, type } = tradeForm;
    
    if (!symbol || !quantity) {
      alert('Please fill in all fields');
      return;
    }

    if (parseFloat(quantity) <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }

    try {
      const res = await stocksAPI.getQuote(symbol.toUpperCase());
      const price = res.data.data.c;

      if (!price || price <= 0) {
        alert('Unable to get valid price for this symbol');
        return;
      }

      const tradeData = {
        symbol: symbol.toUpperCase(),
        quantity: parseFloat(quantity),
        price,
        type,
        timestamp: new Date().toISOString(),
      };

      portfolioService.trade(userId, tradeData);

      loadPortfolio();
      setShowTrade(false);
      setTradeForm({ symbol: '', quantity: '', type: 'buy' });
      alert(`Successfully ${type === 'buy' ? 'bought' : 'sold'} ${quantity} shares of ${symbol.toUpperCase()}`);
    } catch (error) {
      console.error('Trade error:', error);
      alert(error.message || 'Trade failed. Please try again.');
    }
  };

  const calculateHoldingValue = (holding) => {
    const currentPrice = currentPrices[holding.symbol] || holding.averagePrice;
    return holding.quantity * currentPrice;
  };

  const calculateHoldingGain = (holding) => {
    const currentPrice = currentPrices[holding.symbol] || holding.averagePrice;
    const currentValue = holding.quantity * currentPrice;
    const costBasis = holding.quantity * holding.averagePrice;
    return currentValue - costBasis;
  };

  const calculateHoldingGainPercent = (holding) => {
    const currentPrice = currentPrices[holding.symbol] || holding.averagePrice;
    return ((currentPrice - holding.averagePrice) / holding.averagePrice) * 100;
  };

  const totalPortfolioValue = portfolio.cash + portfolio.holdings.reduce((sum, h) => sum + calculateHoldingValue(h), 0);
  const totalGain = portfolio.holdings.reduce((sum, h) => sum + calculateHoldingGain(h), 0);

  return (
    <TabContainer
      title="Portfolio"
      icon={DollarSign}
      onClose={onClose}
      actions={
        <button
          onClick={() => setShowTrade(!showTrade)}
          className="px-3 py-1 text-xs bg-terminal-accent text-white rounded hover:bg-terminal-accent/80 transition-colors"
        >
          {showTrade ? 'Cancel' : 'Trade'}
        </button>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-terminal-muted">Loading...</div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-terminal-bg rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-terminal-muted mb-1">Total Value</div>
                <div className="text-2xl font-bold text-terminal-text">
                  ${totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-terminal-muted mb-1">Total Gain/Loss</div>
                <div className={`text-2xl font-bold ${totalGain >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {totalGain >= 0 ? '+' : ''}${totalGain.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-terminal-muted mb-1">Cash Available</div>
                <div className="text-lg font-semibold text-terminal-text">
                  ${portfolio.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div>
                <div className="text-xs text-terminal-muted mb-1">Holdings</div>
                <div className="text-lg font-semibold text-terminal-text">
                  {portfolio.holdings.length} Positions
                </div>
              </div>
            </div>
          </div>

          {showTrade && (
            <div className="bg-terminal-bg rounded-lg p-4">
              <form onSubmit={handleTrade} className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTradeForm({ ...tradeForm, type: 'buy' })}
                    className={`flex-1 py-2 rounded transition-colors ${
                      tradeForm.type === 'buy' ? 'bg-terminal-green text-white' : 'bg-terminal-border text-terminal-muted'
                    }`}
                  >
                    <Plus size={16} className="inline mr-1" />
                    Buy
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeForm({ ...tradeForm, type: 'sell' })}
                    className={`flex-1 py-2 rounded transition-colors ${
                      tradeForm.type === 'sell' ? 'bg-terminal-red text-white' : 'bg-terminal-border text-terminal-muted'
                    }`}
                  >
                    <Minus size={16} className="inline mr-1" />
                    Sell
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Symbol (e.g., AAPL)"
                  value={tradeForm.symbol}
                  onChange={(e) => setTradeForm({ ...tradeForm, symbol: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-text placeholder-terminal-muted focus:outline-none focus:border-terminal-accent"
                />
                <input
                  type="number"
                  placeholder="Quantity"
                  value={tradeForm.quantity}
                  onChange={(e) => setTradeForm({ ...tradeForm, quantity: e.target.value })}
                  className="w-full px-3 py-2 bg-terminal-panel border border-terminal-border rounded text-terminal-text placeholder-terminal-muted focus:outline-none focus:border-terminal-accent"
                  min="0"
                  step="0.01"
                />
                <button
                  type="submit"
                  className="w-full py-2 bg-terminal-accent text-white rounded hover:bg-terminal-accent/80 transition-colors"
                >
                  Execute Trade
                </button>
              </form>
            </div>
          )}

          <div className="bg-terminal-bg rounded-lg p-4">
            <h5 className="text-sm font-semibold text-terminal-text mb-3">Holdings</h5>
            {portfolio.holdings.length === 0 ? (
              <div className="text-sm text-terminal-muted text-center py-4">
                No holdings yet. Start trading to build your portfolio.
              </div>
            ) : (
              <div className="space-y-2">
                {portfolio.holdings.map((holding, index) => {
                  const gainPercent = calculateHoldingGainPercent(holding);
                  const gainAmount = calculateHoldingGain(holding);
                  const currentValue = calculateHoldingValue(holding);
                  
                  return (
                    <div key={index} className="p-3 bg-terminal-panel rounded">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-semibold text-terminal-text">{holding.symbol}</div>
                          <div className="text-xs text-terminal-muted">
                            {holding.quantity} shares @ ${holding.averagePrice.toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-terminal-text">
                            ${currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          <div className={`text-xs ${gainAmount >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                            {gainAmount >= 0 ? '+' : ''}${gainAmount.toFixed(2)} ({gainAmount >= 0 ? '+' : ''}{gainPercent.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-terminal-bg rounded-lg p-4">
            <h5 className="text-sm font-semibold text-terminal-text mb-3">Recent Transactions</h5>
            {portfolio.transactions.length === 0 ? (
              <div className="text-sm text-terminal-muted text-center py-4">
                No transactions yet
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {portfolio.transactions.slice().reverse().slice(0, 20).map((tx, index) => (
                  <div key={index} className="p-2 bg-terminal-panel rounded text-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`font-semibold ${tx.type === 'buy' ? 'text-terminal-green' : 'text-terminal-red'}`}>
                          {tx.type.toUpperCase()}
                        </span>
                        <span className="text-terminal-text ml-2">{tx.symbol}</span>
                        <span className="text-terminal-muted ml-2">{tx.quantity} @ ${tx.price.toFixed(2)}</span>
                      </div>
                      <div className="text-terminal-muted">
                        {new Date(tx.timestamp).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </TabContainer>
  );
});

PortfolioTab.displayName = 'PortfolioTab';

export default PortfolioTab;
