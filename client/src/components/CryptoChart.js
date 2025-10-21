import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { cryptoAPI } from '../services/api';

const CryptoChart = React.memo(({ coinId }) => {
  const [timeframe, setTimeframe] = useState(7);
  const [loading, setLoading] = useState(false);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const loadChartData = useCallback(async () => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;
    
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
              time: Math.floor(candleTime / 1000),
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
        
        const candleData = Object.values(candles)
          .sort((a, b) => a.time - b.time)
          .map(({ time, open, high, low, close }) => ({
            time,
            open,
            high,
            low,
            close,
          }));

        const volumeData = Object.values(candles)
          .sort((a, b) => a.time - b.time)
          .map(({ time, volume, open, close }) => ({
            time,
            value: volume,
            color: close >= open ? 'rgba(0, 255, 65, 0.5)' : 'rgba(255, 0, 85, 0.5)',
          }));

        candleSeriesRef.current.setData(candleData);
        volumeSeriesRef.current.setData(volumeData);
      }
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  }, [coinId, timeframe]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: '#0a0a0a' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#1a1a1a' },
        horzLines: { color: '#1a1a1a' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: '#6b7280',
          style: 1,
          labelBackgroundColor: '#1a1a1a',
        },
        horzLine: {
          width: 1,
          color: '#6b7280',
          style: 1,
          labelBackgroundColor: '#1a1a1a',
        },
      },
      timeScale: {
        borderColor: '#1a1a1a',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#1a1a1a',
      },
      localization: {
        priceFormatter: (price) => {
          if (price >= 1) return `$${price.toFixed(2)}`;
          if (price >= 0.01) return `$${price.toFixed(4)}`;
          return `$${price.toFixed(8)}`;
        },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00ff41',
      downColor: '#ff0055',
      borderUpColor: '#00ff41',
      borderDownColor: '#ff0055',
      wickUpColor: '#00ff41',
      wickDownColor: '#ff0055',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.9,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (coinId) {
      loadChartData();
    }
  }, [coinId, loadChartData]);

  return (
    <div className="bg-terminal-bg rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h5 className="text-sm font-semibold text-terminal-text">Price Chart</h5>
        <div className="flex gap-2">
          {[
            { value: 1, label: '1D' },
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
        <div className="h-[500px] flex items-center justify-center text-terminal-muted">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-terminal-accent border-t-transparent rounded-full animate-spin"></div>
            <div>Loading chart data...</div>
          </div>
        </div>
      ) : (
        <div
          ref={chartContainerRef}
          className="border border-terminal-border rounded"
        />
      )}
    </div>
  );
});

CryptoChart.displayName = 'CryptoChart';

export default CryptoChart;