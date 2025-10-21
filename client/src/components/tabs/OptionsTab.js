import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Search, RefreshCw } from 'lucide-react';
import TabContainer from '../TabContainer';
import { optionsAPI } from '../../services/api';

const OptionsTab = React.memo(({ onClose }) => {
  const [symbol, setSymbol] = useState('AAPL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expirations, setExpirations] = useState([]);
  const [selectedExpiration, setSelectedExpiration] = useState(null);
  const [optionChain, setOptionChain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hoveredOption, setHoveredOption] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const loadExpirations = useCallback(async () => {
    try {
      const res = await optionsAPI.getExpirations(symbol);
      const exps = res.data.data || [];
      setExpirations(exps);
      if (exps.length > 0 && !selectedExpiration) {
        setSelectedExpiration(exps[0]);
      }
    } catch (error) {
      console.error('Error loading expirations:', error);
    }
  }, [symbol]);

  const loadOptionChain = useCallback(async () => {
    setLoading(true);
    try {
      const res = await optionsAPI.getChain(symbol, selectedExpiration);
      console.log('Raw API response:', res.data);
      console.log('First strike sample:', res.data.data?.strikes?.[0]);
      setOptionChain(res.data.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading option chain:', error);
    } finally {
      setLoading(false);
    }
  }, [symbol, selectedExpiration]);

  const handleManualRefresh = () => {
    loadOptionChain();
  };

  useEffect(() => {
    loadExpirations();
  }, [loadExpirations]);

  useEffect(() => {
    if (selectedExpiration) {
      loadOptionChain();
      
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        loadOptionChain();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [selectedExpiration, loadOptionChain]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSymbol(searchQuery.toUpperCase());
      setSearchQuery('');
    }
  };

  const formatNumber = (num, decimals = 2) => {
    if (num === null || num === undefined) return 'N/A';
    return num.toFixed(decimals);
  };

  return (
    <TabContainer
      title="Options"
      icon={Activity}
      onClose={onClose}
      actions={
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Symbol..."
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
      <div className="space-y-4">
        <div className="bg-terminal-bg rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-lg font-semibold text-terminal-text">{symbol} Options</h4>
              {lastUpdate && (
                <div className="text-xs text-terminal-muted mt-1">
                  Last updated: {lastUpdate.toLocaleTimeString()} • Auto-refreshing every 30s
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleManualRefresh}
                disabled={loading}
                className="p-2 rounded hover:bg-terminal-border text-terminal-muted hover:text-terminal-accent transition-colors disabled:opacity-50"
                title="Refresh options data"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              {expirations.length > 0 && (
                <select
                  value={selectedExpiration || ''}
                  onChange={(e) => setSelectedExpiration(e.target.value)}
                  className="px-3 py-1 text-sm bg-terminal-panel border border-terminal-border rounded text-terminal-text focus:outline-none focus:border-terminal-accent"
                >
                  {expirations.map((exp) => (
                    <option key={exp} value={exp}>
                      {exp}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-terminal-muted">Loading option chain...</div>
          </div>
        ) : optionChain?.strikes ? (
          <div className="bg-terminal-bg rounded-lg p-4 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-terminal-border">
                  <th colSpan="5" className="text-center py-2 text-terminal-green">CALLS</th>
                  <th className="text-center py-2 text-terminal-accent">STRIKE</th>
                  <th colSpan="5" className="text-center py-2 text-terminal-red">PUTS</th>
                </tr>
                <tr className="text-terminal-muted">
                  <th className="text-left py-2">Bid</th>
                  <th className="text-left py-2">Ask</th>
                  <th className="text-right py-2">Vol</th>
                  <th className="text-right py-2">OI</th>
                  <th className="text-right py-2">IV</th>
                  <th className="text-center py-2 text-terminal-accent">Price</th>
                  <th className="text-left py-2">IV</th>
                  <th className="text-left py-2">OI</th>
                  <th className="text-right py-2">Vol</th>
                  <th className="text-right py-2">Ask</th>
                  <th className="text-right py-2">Bid</th>
                </tr>
              </thead>
              <tbody>
                {optionChain.strikes.slice(5, 15).map((strike, index) => (
                  <tr key={index} className="border-b border-terminal-border/50 hover:bg-terminal-panel relative">
                    <td 
                      className="py-2 text-terminal-green cursor-pointer"
                      onMouseEnter={() => setHoveredOption({ type: 'call', strike: strike.strike, data: strike.call })}
                      onMouseLeave={() => setHoveredOption(null)}
                    >
                      ${formatNumber(strike.call.bid)}
                    </td>
                    <td 
                      className="py-2 text-terminal-green cursor-pointer"
                      onMouseEnter={() => setHoveredOption({ type: 'call', strike: strike.strike, data: strike.call })}
                      onMouseLeave={() => setHoveredOption(null)}
                    >
                      ${formatNumber(strike.call.ask)}
                    </td>
                    <td 
                      className="py-2 text-right text-terminal-muted cursor-pointer"
                      onMouseEnter={() => setHoveredOption({ type: 'call', strike: strike.strike, data: strike.call })}
                      onMouseLeave={() => setHoveredOption(null)}
                    >
                      {strike.call.volume || 0}
                    </td>
                    <td 
                      className="py-2 text-right text-terminal-muted cursor-pointer"
                      onMouseEnter={() => setHoveredOption({ type: 'call', strike: strike.strike, data: strike.call })}
                      onMouseLeave={() => setHoveredOption(null)}
                    >
                      {strike.call.openInterest || 0}
                    </td>
                    <td 
                      className="py-2 text-right text-terminal-green cursor-pointer"
                      onMouseEnter={() => setHoveredOption({ type: 'call', strike: strike.strike, data: strike.call })}
                      onMouseLeave={() => setHoveredOption(null)}
                    >
                      {formatNumber(strike.call.impliedVolatility * 100, 1)}%
                    </td>
                    
                    <td className="py-2 text-center font-semibold text-terminal-accent">${formatNumber(strike.strike)}</td>
                    
                    <td 
                      className="py-2 text-terminal-red cursor-pointer"
                      onMouseEnter={() => setHoveredOption({ type: 'put', strike: strike.strike, data: strike.put })}
                      onMouseLeave={() => setHoveredOption(null)}
                    >
                      {formatNumber(strike.put.impliedVolatility * 100, 1)}%
                    </td>
                    <td 
                      className="py-2 text-terminal-muted cursor-pointer"
                      onMouseEnter={() => setHoveredOption({ type: 'put', strike: strike.strike, data: strike.put })}
                      onMouseLeave={() => setHoveredOption(null)}
                    >
                      {strike.put.openInterest || 0}
                    </td>
                    <td 
                      className="py-2 text-right text-terminal-muted cursor-pointer"
                      onMouseEnter={() => setHoveredOption({ type: 'put', strike: strike.strike, data: strike.put })}
                      onMouseLeave={() => setHoveredOption(null)}
                    >
                      {strike.put.volume || 0}
                    </td>
                    <td 
                      className="py-2 text-right text-terminal-red cursor-pointer"
                      onMouseEnter={() => setHoveredOption({ type: 'put', strike: strike.strike, data: strike.put })}
                      onMouseLeave={() => setHoveredOption(null)}
                    >
                      ${formatNumber(strike.put.ask)}
                    </td>
                    <td 
                      className="py-2 text-right text-terminal-red cursor-pointer"
                      onMouseEnter={() => setHoveredOption({ type: 'put', strike: strike.strike, data: strike.put })}
                      onMouseLeave={() => setHoveredOption(null)}
                    >
                      ${formatNumber(strike.put.bid)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {hoveredOption && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-terminal-panel border-2 border-terminal-accent rounded-lg p-4 shadow-2xl z-50 min-w-[250px]">
                <div className="text-center mb-3">
                  <div className={`text-sm font-semibold ${hoveredOption.type === 'call' ? 'text-terminal-green' : 'text-terminal-red'}`}>
                    {hoveredOption.type.toUpperCase()} @ ${hoveredOption.strike}
                  </div>
                  <div className="text-xs text-terminal-muted">{selectedExpiration}</div>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Delta (Δ):</span>
                    <span className="text-terminal-text font-semibold">
                      {formatNumber(hoveredOption.data.delta, 4) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Gamma (Γ):</span>
                    <span className="text-terminal-text font-semibold">
                      {formatNumber(hoveredOption.data.gamma, 4) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Theta (Θ):</span>
                    <span className="text-terminal-text font-semibold">
                      {formatNumber(hoveredOption.data.theta, 4) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-terminal-muted">Vega (ν):</span>
                    <span className="text-terminal-text font-semibold">
                      {formatNumber(hoveredOption.data.vega, 4) || 'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-terminal-border pt-2 mt-2">
                    <span className="text-terminal-muted">IV:</span>
                    <span className="text-terminal-text font-semibold">
                      {formatNumber(hoveredOption.data.impliedVolatility * 100, 1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-terminal-muted">
            No option data available
          </div>
        )}

        {optionChain?.strikes && (
          <div className="bg-terminal-bg rounded-lg p-4">
            <h5 className="text-sm font-semibold text-terminal-text mb-3">Understanding Greeks</h5>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="font-semibold text-terminal-accent mb-1">Delta (Δ)</div>
                <div className="text-terminal-muted">Rate of change of option price with respect to underlying</div>
              </div>
              <div>
                <div className="font-semibold text-terminal-accent mb-1">Gamma (Γ)</div>
                <div className="text-terminal-muted">Rate of change of delta</div>
              </div>
              <div>
                <div className="font-semibold text-terminal-accent mb-1">Theta (Θ)</div>
                <div className="text-terminal-muted">Time decay - value lost per day</div>
              </div>
              <div>
                <div className="font-semibold text-terminal-accent mb-1">Vega (ν)</div>
                <div className="text-terminal-muted">Sensitivity to volatility changes</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TabContainer>
  );
});

OptionsTab.displayName = 'OptionsTab';

export default OptionsTab;
