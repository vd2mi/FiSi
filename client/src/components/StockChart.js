import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import { stocksAPI } from '../services/api';

const StockChart = React.memo(({ symbol }) => {
  const [timeframe, setTimeframe] = useState('1D');
  const [loading, setLoading] = useState(false);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const loadChartData = useCallback(async () => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;
    
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
        const candleData = data.t.map((timestamp, i) => ({
          time: timestamp,
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
        }));

        const volumeData = data.t.map((timestamp, i) => ({
          time: timestamp,
          value: data.v[i] || 0,
          color: data.c[i] >= data.o[i] ? 'rgba(0, 255, 65, 0.5)' : 'rgba(255, 0, 85, 0.5)',
        }));

        candleSeriesRef.current.setData(candleData);
        volumeSeriesRef.current.setData(volumeData);
      }
    } catch (error) {
      if (error.response?.status === 403) {
      }
    } finally {
      setLoading(false);
    }
  }, [symbol, timeframe]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 350,
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
      color: 'rgba(38, 166, 154, 0.25)',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
      scaleMargins: {
        top: 0.97,
        bottom: 0,
      },
      base: 0,
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Keep volume anchored to the bottom by forcing min to 0
    if (volumeSeries && typeof volumeSeries.setAutoscaleInfoProvider === 'function') {
      volumeSeries.setAutoscaleInfoProvider((original) => {
        const res = original();
        if (res && res.priceRange) {
          return {
            ...res,
            priceRange: {
              minValue: 0,
              maxValue: res.priceRange.maxValue,
            },
          };
        }
        return res;
      });
    }

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
    if (symbol) {
      loadChartData();
    }
  }, [symbol, loadChartData]);

  useEffect(() => {
    if (!symbol) return;
    const intervalId = setInterval(() => {
      loadChartData();
    }, 60000);

    return () => clearInterval(intervalId);
  }, [symbol, timeframe, loadChartData]);

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
        <div className="h-[350px] flex items-center justify-center text-terminal-muted">
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

StockChart.displayName = 'StockChart';

export default StockChart;