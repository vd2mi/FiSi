import React from 'react';

function LoadingChart({ height = 250 }) {
  return (
    <div className="bg-terminal-bg rounded-lg p-4">
      <div className="animate-pulse">
        <div className="h-4 bg-terminal-border rounded w-24 mb-4"></div>
        <div style={{ height: `${height}px` }} className="bg-terminal-border rounded flex items-center justify-center">
          <div className="text-terminal-muted text-sm">Loading chart...</div>
        </div>
      </div>
    </div>
  );
}

export default LoadingChart;
