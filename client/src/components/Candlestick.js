import React from 'react';

const Candlestick = ({ x, y, width, height, payload }) => {
  if (!payload || !payload.open || !payload.close || !payload.high || !payload.low) {
    return null;
  }

  const { open, close, high, low } = payload;
  const isGreen = close > open;
  const color = isGreen ? '#10b981' : '#ef4444';
  const ratio = height / (Math.max(open, close, high, low) - Math.min(open, close, high, low));
  
  const bodyHeight = Math.abs(close - open) * ratio;
  const bodyY = y + (Math.max(open, close) - Math.max(high, low, open, close)) * ratio;
  
  const wickTop = y;
  const wickBottom = y + height;
  const wickX = x + width / 2;

  return (
    <g>
      <line
        x1={wickX}
        y1={wickTop}
        x2={wickX}
        y2={wickBottom}
        stroke={color}
        strokeWidth={1}
      />
      <rect
        x={x}
        y={bodyY}
        width={width}
        height={bodyHeight || 1}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

export const renderCandlestick = (props) => {
  const { x, y, width, height, index } = props;
  const payload = props.payload;
  
  if (!payload || !payload.open || !payload.close) {
    return null;
  }

  const { open, close, high, low } = payload;
  const isGreen = close >= open;
  const color = isGreen ? '#10b981' : '#ef4444';
  
  const yHigh = y - (high - Math.max(open, close)) * (height / Math.abs(open - close || 1));
  const yLow = y + height + (Math.min(open, close) - low) * (height / Math.abs(open - close || 1));
  const bodyHeight = Math.abs(height);
  const wickX = x + width / 2;

  return (
    <g key={`candle-${index}`}>
      <line
        x1={wickX}
        y1={yHigh}
        x2={wickX}
        y2={y}
        stroke={color}
        strokeWidth={1}
      />
      <line
        x1={wickX}
        y1={y + height}
        x2={wickX}
        y2={yLow}
        stroke={color}
        strokeWidth={1}
      />
      <rect
        x={x}
        y={isGreen ? y + height : y}
        width={Math.max(width - 2, 1)}
        height={bodyHeight || 1}
        fill={color}
        stroke={color}
      />
    </g>
  );
};

export default Candlestick;

