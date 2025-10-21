import React, { useState, useEffect, useCallback, useRef } from 'react';
import { stocksAPI } from '../services/api';

const StockChart = React.memo(({ symbol }) => {
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState('1D');
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [mousePos, setMousePos] = useState(null);

  const loadChartData = useCallback(async () => {
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
          volume: data.v[i] || 0,
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
  }, [symbol, timeframe]);

  useEffect(() => {
    if (symbol) {
      loadChartData();
    }
  }, [symbol, loadChartData]);

  const drawChart = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !chartData.length) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 400;
    
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const padding = { left: 60, right: 10, top: 20, bottom: 80 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const volumeHeight = 60;
    const candleChartHeight = chartHeight - volumeHeight - 10;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    const prices = chartData.flatMap(d => [d.high, d.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;

    const maxVolume = Math.max(...chartData.map(d => d.volume));

    if (priceRange === 0) return;

    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    
    for (let i = 0; i <= 8; i++) {
      const y = padding.top + (i * candleChartHeight / 8);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    ctx.fillStyle = '#6b7280';
    ctx.font = '11px monospace';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i <= 8; i++) {
      const price = maxPrice - (priceRange * i / 8);
      const y = padding.top + (i * candleChartHeight / 8);
      ctx.fillText(`$${price.toFixed(2)}`, padding.left - 8, y);
    }

    const candleWidth = Math.max(chartWidth / chartData.length - 2, 1);
    const candleSpacing = chartWidth / chartData.length;

    chartData.forEach((candle, index) => {
      const x = padding.left + (index * candleSpacing) + (candleSpacing / 2);
      const isGreen = candle.close >= candle.open;
      const color = isGreen ? '#00ff41' : '#ff0055';
      const isHovered = hoveredCandle === index;

      const highY = padding.top + ((maxPrice - candle.high) / priceRange) * candleChartHeight;
      const lowY = padding.top + ((maxPrice - candle.low) / priceRange) * candleChartHeight;
      const openY = padding.top + ((maxPrice - candle.open) / priceRange) * candleChartHeight;
      const closeY = padding.top + ((maxPrice - candle.close) / priceRange) * candleChartHeight;

      const bodyTop = Math.min(openY, closeY);
      const bodyBottom = Math.max(openY, closeY);
      const bodyHeight = Math.max(Math.abs(bodyBottom - bodyTop), 1);

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.globalAlpha = isHovered ? 1 : 0.9;
      ctx.lineWidth = isHovered ? 2 : 1;

      ctx.beginPath();
      ctx.moveTo(x, highY);
      ctx.lineTo(x, bodyTop);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x, bodyBottom);
      ctx.lineTo(x, lowY);
      ctx.stroke();

      if (isGreen) {
        ctx.strokeRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
      } else {
        ctx.fillRect(x - candleWidth/2, bodyTop, candleWidth, bodyHeight);
      }

      const volumeBarHeight = (candle.volume / maxVolume) * volumeHeight;
      const volumeY = padding.top + candleChartHeight + 10;
      
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = color;
      ctx.fillRect(x - candleWidth/2, volumeY + volumeHeight - volumeBarHeight, candleWidth, volumeBarHeight);
    });

    ctx.globalAlpha = 1;

    if (mousePos && mousePos.x >= padding.left && mousePos.x <= width - padding.right) {
      ctx.strokeStyle = '#6b7280';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      
      ctx.beginPath();
      ctx.moveTo(mousePos.x, padding.top);
      ctx.lineTo(mousePos.x, padding.top + candleChartHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding.left, mousePos.y);
      ctx.lineTo(width - padding.right, mousePos.y);
      ctx.stroke();

      ctx.setLineDash([]);

      if (mousePos.y >= padding.top && mousePos.y <= padding.top + candleChartHeight) {
        const price = maxPrice - ((mousePos.y - padding.top) / candleChartHeight) * priceRange;
        
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(padding.left - 58, mousePos.y - 10, 56, 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(`$${price.toFixed(2)}`, padding.left - 8, mousePos.y);
      }
    }

    const timeStep = Math.max(1, Math.floor(chartData.length / 8));
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i < chartData.length; i += timeStep) {
      const candle = chartData[i];
      const x = padding.left + (i * candleSpacing) + (candleSpacing / 2);
      const date = new Date(candle.time);
      let timeStr;
      
      if (timeframe === '1D') {
        timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
      } else {
        timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      ctx.fillText(timeStr, x, height - 60);
    }

    if (hoveredCandle !== null && chartData[hoveredCandle]) {
      const candle = chartData[hoveredCandle];
      const x = padding.left + (hoveredCandle * candleSpacing) + (candleSpacing / 2);
      
      const isGreen = candle.close >= candle.open;
      const change = candle.close - candle.open;
      const changePercent = (change / candle.open) * 100;
      
      const tooltipWidth = 180;
      const tooltipHeight = 110;
      let tooltipX = x + 15;
      let tooltipY = padding.top + 10;
      
      if (tooltipX + tooltipWidth > width - padding.right) {
        tooltipX = x - tooltipWidth - 15;
      }

      ctx.fillStyle = 'rgba(10, 10, 10, 0.95)';
      ctx.strokeStyle = isGreen ? '#00ff41' : '#ff0055';
      ctx.lineWidth = 2;
      ctx.fillRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);
      ctx.strokeRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px monospace';
      ctx.textAlign = 'left';
      
      const date = new Date(candle.time);
      const dateStr = date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });
      
      ctx.fillText(dateStr, tooltipX + 10, tooltipY + 15);

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`O: $${candle.open.toFixed(2)}`, tooltipX + 10, tooltipY + 35);
      ctx.fillText(`H: $${candle.high.toFixed(2)}`, tooltipX + 10, tooltipY + 50);
      ctx.fillText(`L: $${candle.low.toFixed(2)}`, tooltipX + 10, tooltipY + 65);
      ctx.fillText(`C: $${candle.close.toFixed(2)}`, tooltipX + 10, tooltipY + 80);
      
      ctx.fillStyle = isGreen ? '#00ff41' : '#ff0055';
      const changeText = `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
      ctx.fillText(changeText, tooltipX + 10, tooltipY + 95);
    }
  }, [chartData, hoveredCandle, mousePos, timeframe]);

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

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setMousePos({ x, y });

    const padding = 60;
    const chartWidth = rect.width - padding - 10;
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
    setMousePos(null);
  }, []);

  return (
    <div className="bg-terminal-bg rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-sm font-semibold text-terminal-text">Price Chart</h5>
        <div className="flex gap-2">
          {['1D', '1W', '1M', '3M', '1Y'].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 text-xs rounded transition-all ${
                timeframe === tf
                  ? 'bg-terminal-accent text-white shadow-neon-sm'
                  : 'bg-terminal-border text-terminal-muted hover:bg-terminal-border/80 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-96 flex items-center justify-center text-terminal-muted">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-terminal-accent border-t-transparent rounded-full animate-spin"></div>
            <div>Loading chart data...</div>
          </div>
        </div>
      ) : chartData.length > 0 ? (
        <div ref={containerRef} className="w-full">
          <canvas
            ref={canvasRef}
            className="w-full border border-terminal-border rounded cursor-crosshair bg-terminal-panel"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          />
        </div>
      ) : (
        <div className="h-96 flex items-center justify-center">
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
});

StockChart.displayName = 'StockChart';

export default StockChart;