import React, { useState, useEffect } from 'react';
import { ComposedChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { stocksAPI } from '../services/api';

function StockChart({ symbol }) {
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState('1D');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (symbol) {
      loadChartData();
    }
  }, [symbol, timeframe]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      const now = Math.floor(Date.now() / 1000);
      const timeframes = {
        '1D': { from: now - 86400, resolution: '5' },
        '1W': { from: now - 604800, resolution: '60' },
        '1M': { from: now - 2592000, resolution: 'D' },
        '3M': { from: now - 7776000, resolution: 'D' },
        '1Y': { from: now - 31536000, resolution: 'W' },
      };

      const { from, resolution } = timeframes[timeframe] || timeframes['1D'];
      
      const res = await stocksAPI.getCandles(symbol, { resolution, from, to: now });
      const data = res.data.data;

      if (data && data.t && data.c && data.s === 'ok') {
        const formatted = data.t.map((timestamp, i) => ({
          time: timestamp * 1000,
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          range: [data.l[i], data.h[i]],
        }));
        setChartData(formatted);
      } else {
        setChartData([]);
      }
    } catch (error) {
      if (error.response?.status === 403) {
      }
      setChartData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatXAxis = (timestamp) => {
    const date = new Date(timestamp);
    if (timeframe === '1D') {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-terminal-panel border border-terminal-border rounded p-2 text-xs">
          <p className="text-terminal-muted mb-1">{new Date(data.time).toLocaleString()}</p>
          <p className="text-terminal-text">O: ${data.open?.toFixed(2)}</p>
          <p className="text-terminal-text">H: ${data.high?.toFixed(2)}</p>
          <p className="text-terminal-text">L: ${data.low?.toFixed(2)}</p>
          <p className="text-terminal-text">C: ${data.close?.toFixed(2)}</p>
        </div>
      );
    }
    return null;
  };

  const renderCandlestick = (props) => {
    const { x, y, width, height, index } = props;
    const data = chartData[index];
    
    if (!data || !data.open || !data.close) return null;

    const { open, close, high, low } = data;
    const isGreen = close >= open;
    const color = isGreen ? '#00ff41' : '#ff0055';
    
    const maxPrice = Math.max(open, close);
    const minPrice = Math.min(open, close);
    const priceRange = high - low;
    
    if (priceRange === 0) return null;

    const wickX = x + width / 2;
    const bodyTop = y + ((high - maxPrice) / priceRange) * height;
    const bodyBottom = y + ((high - minPrice) / priceRange) * height;
    const bodyHeight = bodyBottom - bodyTop;
    const wickTop = y;
    const wickBottom = y + height;

    return (
      <g key={`candle-${index}`}>
        <line x1={wickX} y1={wickTop} x2={wickX} y2={bodyTop} stroke={color} strokeWidth={1} />
        <line x1={wickX} y1={bodyBottom} x2={wickX} y2={wickBottom} stroke={color} strokeWidth={1} />
        <rect x={x + 1} y={bodyTop} width={Math.max(width - 2, 1)} height={Math.max(bodyHeight, 1)} fill={color} />
      </g>
    );
  };

  return (
    <div className="bg-terminal-bg rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-sm font-semibold text-terminal-text">Price Chart</h5>
        <div className="flex gap-2">
          {['1D', '1W', '1M', '3M', '1Y'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeframe === tf
                  ? 'bg-terminal-accent text-white'
                  : 'bg-terminal-border text-terminal-muted hover:bg-terminal-border/80'
              }`}
            >
              {tf}
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
              tickFormatter={(value) => `$${value.toFixed(2)}`}
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
              Finnhub free tier doesn't include historical chart data.
              <br />
              Real-time prices are updating above! ✅
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StockChart;
