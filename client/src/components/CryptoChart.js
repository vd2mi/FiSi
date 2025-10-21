import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { cryptoAPI } from '../services/api';

const CryptoChart = React.memo(({ coinId }) => {
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState(7);
  const [loading, setLoading] = useState(false);

  const loadChartData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await cryptoAPI.getChart(coinId, timeframe);
      const data = res.data.data;

      if (data && data.prices) {
        const candleSize = timeframe <= 7 ? 3600000 : 86400000;
        const candles = {};
        
        data.prices.forEach(([timestamp, price]) => {
          const candleTime = Math.floor(timestamp / candleSize) * candleSize;
          if (!candles[candleTime]) {
            candles[candleTime] = {
              time: candleTime,
              open: price,
              high: price,
              low: price,
              close: price,
              range: [price, price],
            };
          } else {
            candles[candleTime].high = Math.max(candles[candleTime].high, price);
            candles[candleTime].low = Math.min(candles[candleTime].low, price);
            candles[candleTime].close = price;
            candles[candleTime].range = [candles[candleTime].low, candles[candleTime].high];
          }
        });
        
        const formatted = Object.values(candles).sort((a, b) => a.time - b.time);
        setChartData(formatted);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  }, [coinId, timeframe]);

  useEffect(() => {
    if (coinId) {
      loadChartData();
    }
  }, [coinId, loadChartData]);

  const formatXAxis = useCallback((timestamp) => {
    const date = new Date(timestamp);
    if (timeframe === 1) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [timeframe]);

  const formatPrice = useCallback((price) => {
    if (!price) return '--';
    if (price < 1) return `$${price.toFixed(6)}`;
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }, []);

  const CustomTooltip = useMemo(() => React.memo(({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-terminal-panel border border-terminal-border rounded p-2 text-xs">
          <p className="text-terminal-muted mb-1">{new Date(data.time).toLocaleString()}</p>
          <p className="text-terminal-text">O: {formatPrice(data.open)}</p>
          <p className="text-terminal-text">H: {formatPrice(data.high)}</p>
          <p className="text-terminal-text">L: {formatPrice(data.low)}</p>
          <p className="text-terminal-text">C: {formatPrice(data.close)}</p>
        </div>
      );
    }
    return null;
  }), [formatPrice]);

  const renderCandlestick = useCallback((props) => {
    const { x, y, width, height, index, payload } = props;
    const data = payload;
    
    if (!data || !data.open || !data.close) return null;

    const { open, close, high, low } = data;
    const isGreen = close >= open;
    const color = isGreen ? '#00ff41' : '#ff0055';
    
    const wickX = x + width / 2;
    
    const candleRange = high - low;
    if (candleRange === 0) {
      const centerY = y + height / 2;
      return (
        <g key={`candle-${index}`}>
          <line x1={x} y1={centerY} x2={x + width} y2={centerY} stroke={color} strokeWidth={1} />
        </g>
      );
    }
    
    const bodyTop = y + ((high - Math.max(open, close)) / candleRange) * height;
    const bodyBottom = y + ((high - Math.min(open, close)) / candleRange) * height;
    const bodyHeight = Math.abs(bodyBottom - bodyTop);
    
    const minBodyHeight = Math.max(bodyHeight, 1);

    return (
      <g key={`candle-${index}`}>
        <line x1={wickX} y1={y} x2={wickX} y2={bodyTop} stroke={color} strokeWidth={1} />
        <line x1={wickX} y1={bodyBottom} x2={wickX} y2={y + height} stroke={color} strokeWidth={1} />
        <rect 
          x={x + 1} 
          y={Math.min(bodyTop, bodyBottom)} 
          width={Math.max(width - 2, 1)} 
          height={minBodyHeight} 
          fill={color} 
        />
      </g>
    );
  }, []);

  return (
    <div className="bg-terminal-bg rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-sm font-semibold text-terminal-text">Price Chart</h5>
        <div className="flex gap-2">
          {[
            { value: 7, label: '7D' },
            { value: 30, label: '30D' },
            { value: 90, label: '90D' },
            { value: 365, label: '1Y' },
          ].map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeframe === tf.value
                  ? 'bg-terminal-accent text-white'
                  : 'bg-terminal-border text-terminal-muted hover:bg-terminal-border/80'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-terminal-muted">
          Loading chart...
        </div>
      ) : chartData.length > 0 ? (
        <ResponsiveContainer width="100%" height={250}>
          <ComposedChart data={chartData}>
            <XAxis
              dataKey="time"
              tickFormatter={formatXAxis}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              domain={['dataMin', 'dataMax']}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => formatPrice(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="range" shape={renderCandlestick} />
          </ComposedChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="text-terminal-muted mb-2">📊 Chart data not available</div>
            <div className="text-xs text-terminal-muted">
              Add COINGECKO_API_KEY to server/.env
              <br />
              Real-time prices are updating above! ✅
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CryptoChart.displayName = 'CryptoChart';

export default CryptoChart;
