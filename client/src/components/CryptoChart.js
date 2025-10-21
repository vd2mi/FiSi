import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { cryptoAPI } from '../services/api';

const CryptoChart = React.memo(({ coinId }) => {
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState(7);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

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
            };
          } else {
            candles[candleTime].high = Math.max(candles[candleTime].high, price);
            candles[candleTime].low = Math.min(candles[candleTime].low, price);
            candles[candleTime].close = price;
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

  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !chartData.length) return;

    const ctx = canvas.getContext('2d');
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 250;
    
    canvas.width = width;
    canvas.height = height;

    const padding = 40;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    const prices = chartData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    if (priceRange === 0) return;

    const candleWidth = Math.max(chartWidth / chartData.length - 2, 1);
    const candleSpacing = chartWidth / chartData.length;

    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px monospace';
    ctx.textAlign = 'right';
    
    const priceStep = (maxPrice - minPrice) / 5;
    for (let i = 0; i <= 5; i++) {
      const price = minPrice + (priceStep * i);
      const y = padding + (i * chartHeight / 5);
      ctx.fillText(`$${price.toFixed(2)}`, padding - 5, y + 4);
    }

    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;

    chartData.forEach((candle, index) => {
      const x = padding + (index * candleSpacing) + (candleSpacing / 2);
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#00ff41' : '#ff0055';
      const isHovered = hoveredCandle === index;

      const highY = padding + ((maxPrice - candle.high) / priceRange) * chartHeight;
      const lowY = padding + ((maxPrice - candle.low) / priceRange) * chartHeight;
      const openY = padding + ((maxPrice - candle.open) / priceRange) * chartHeight;
      const closeY = padding + ((maxPrice - candle.close) / priceRange) * chartHeight;

      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = Math.max(Math.abs(bodyBottom - bodyTop), 1);

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = isHovered ? 2 : 1;

      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, bodyTop);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, bodyBottom);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
    });

    if (hoveredCandle !== null) {
      const candle = chartData[hoveredCandle];
      const x = padding + (hoveredCandle * candleSpacing) + (candleSpacing / 2);
      
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(mousePos.x + 10, mousePos.y - 60, 120, 50);
      
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`O: $${candle.open.toFixed(2)}`, mousePos.x + 15, mousePos.y - 40);
      ctx.fillText(`H: $${candle.high.toFixed(2)}`, mousePos.x + 15, mousePos.y - 25);
      ctx.fillText(`L: $${candle.low.toFixed(2)}`, mousePos.x + 15, mousePos.y - 10);
      ctx.fillText(`C: $${candle.close.toFixed(2)}`, mousePos.x + 15, mousePos.y + 5);
    }
  }, [chartData, hoveredCandle, mousePos]);

  useEffect(() => {
    drawChart();
  }, [drawChart]);

  useEffect(() => {
    const handleResize = () => drawChart();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawChart]);

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !chartData.length) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x: e.clientX, y: e.clientY });

    const padding = 40;
    const chartWidth = rect.width - (padding * 2);
    const candleSpacing = chartWidth / chartData.length;
    
    const candleIndex = Math.floor((x - padding) / candleSpacing);
    
    if (candleIndex >= 0 && candleIndex < chartData.length) {
      setHoveredCandle(candleIndex);
    } else {
      setHoveredCandle(null);
    }
  }, [chartData]);

  const handleMouseLeave = useCallback(() => {
    setHoveredCandle(null);
  }, []);

  const formatPrice = useCallback((price) => {
    if (price >= 1) return `$${price.toFixed(2)}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  }, []);

  const formatXAxis = useCallback((timestamp) => {
    const date = new Date(timestamp);
    if (timeframe <= 7) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }, [timeframe]);

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
        <div ref={containerRef} className="w-full">
          <canvas
            ref={canvasRef}
            className="w-full border border-terminal-border rounded cursor-crosshair"
            style={{ height: '250px' }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <div className="text-terminal-muted mb-2">📊 Chart data not available</div>
            <div className="text-xs text-terminal-muted">
              Unable to load chart data for this cryptocurrency.
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

CryptoChart.displayName = 'CryptoChart';

export default CryptoChart;