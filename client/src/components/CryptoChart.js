import React, { useState, useEffect, useCallback, useRef } from 'react';
import { cryptoAPI } from '../services/api';

const CryptoChart = React.memo(({ coinId }) => {
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState(7);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [mousePos, setMousePos] = useState(null);

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
              volume: 0,
            };
          } else {
            candles[candleTime].high = Math.max(candles[candleTime].high, price);
            candles[candleTime].low = Math.min(candles[candleTime].low, price);
            candles[candleTime].close = price;
          }
        });

        if (data.total_volumes) {
          data.total_volumes.forEach(([timestamp, volume]) => {
            const candleTime = Math.floor(timestamp / candleSize) * candleSize;
            if (candles[candleTime]) {
              candles[candleTime].volume = volume;
            }
          });
        }
        
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

    const padding = { left: 70, right: 10, top: 20, bottom: 80 };
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

    const maxVolume = Math.max(...chartData.map(d => d.volume || 0));

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
      const priceText = price >= 1 ? `$${price.toFixed(2)}` : 
                       price >= 0.01 ? `$${price.toFixed(4)}` : 
                       `$${price.toFixed(8)}`;
      ctx.fillText(priceText, padding.left - 8, y);
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

      if (candle.volume && maxVolume > 0) {
        const volumeBarHeight = (candle.volume / maxVolume) * volumeHeight;
        const volumeY = padding.top + candleChartHeight + 10;
        
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = color;
        ctx.fillRect(x - candleWidth/2, volumeY + volumeHeight - volumeBarHeight, candleWidth, volumeBarHeight);
      }
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
        ctx.fillRect(padding.left - 68, mousePos.y - 10, 66, 20);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px monospace';
        ctx.textAlign = 'right';
        const priceText = price >= 1 ? `$${price.toFixed(2)}` : 
                         price >= 0.01 ? `$${price.toFixed(4)}` : 
                         `$${price.toFixed(8)}`;
        ctx.fillText(priceText, padding.left - 8, mousePos.y);
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
      
      if (timeframe <= 7) {
        timeStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        timeStr = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      }
      
      ctx.fillText(timeStr, x, height - 60);
    }

    if (hoveredCandle !== null && chartData[hoveredCandle]) {
      const candle = chartData[hoveredCandle];
      const x = padding.left + (hoveredCandle * candleSpacing) + (candleSpacing / 2);
      
      const isGreen = candle.close >= candle.open;
      const change = candle.close - candle.open;
      const changePercent = (change / candle.open) * 100;
      
      const tooltipWidth = 200;
      const tooltipHeight = 130;
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

      const formatPrice = (price) => {
        if (price >= 1) return `$${price.toFixed(2)}`;
        if (price >= 0.01) return `$${price.toFixed(4)}`;
        return `$${price.toFixed(8)}`;
      };

      ctx.font = 'bold 11px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`O: ${formatPrice(candle.open)}`, tooltipX + 10, tooltipY + 35);
      ctx.fillText(`H: ${formatPrice(candle.high)}`, tooltipX + 10, tooltipY + 50);
      ctx.fillText(`L: ${formatPrice(candle.low)}`, tooltipX + 10, tooltipY + 65);
      ctx.fillText(`C: ${formatPrice(candle.close)}`, tooltipX + 10, tooltipY + 80);
      
      if (candle.volume) {
        ctx.fillStyle = '#9ca3af';
        ctx.font = '10px monospace';
        const volText = candle.volume >= 1e9 ? `${(candle.volume / 1e9).toFixed(2)}B` :
                       candle.volume >= 1e6 ? `${(candle.volume / 1e6).toFixed(2)}M` :
                       candle.volume >= 1e3 ? `${(candle.volume / 1e3).toFixed(2)}K` :
                       candle.volume.toFixed(0);
        ctx.fillText(`Vol: ${volText}`, tooltipX + 10, tooltipY + 95);
      }
      
      ctx.fillStyle = isGreen ? '#00ff41' : '#ff0055';
      ctx.font = 'bold 11px monospace';
      const changeText = `${change >= 0 ? '+' : ''}${formatPrice(Math.abs(change))} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
      ctx.fillText(changeText, tooltipX + 10, tooltipY + 110);
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

    const padding = 70;
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
          {[
            { value: 7, label: '7D' },
            { value: 30, label: '30D' },
            { value: 90, label: '90D' },
            { value: 365, label: '1Y' },
          ].map((tf) => (
            <button
              key={tf.value}
              onClick={() => setTimeframe(tf.value)}
              className={`px-3 py-1.5 text-xs rounded transition-all ${
                timeframe === tf.value
                  ? 'bg-terminal-accent text-white shadow-neon-sm'
                  : 'bg-terminal-border text-terminal-muted hover:bg-terminal-border/80 hover:text-white'
              }`}
            >
              {tf.label}
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