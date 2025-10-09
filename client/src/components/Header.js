import React, { useState } from 'react';
import { Activity, TrendingUp, DollarSign, Newspaper, Bitcoin, Settings, RefreshCw, LogOut, User } from 'lucide-react';

const TAB_ICONS = {
  stocks: TrendingUp,
  portfolio: DollarSign,
  options: Activity,
  news: Newspaper,
  crypto: Bitcoin,
};

const TAB_LABELS = {
  stocks: 'STONKS',
  portfolio: 'MY $$$',
  options: 'OPTS',
  news: 'NEWS',
  crypto: 'CRYPTO',
};

function Header({ isConnected, visibleTabs, toggleTab, resetLayout, userId, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="bg-terminal-panel border-b border-terminal-border px-6 py-4 flex items-center justify-between shadow-neon-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold text-terminal-accent font-mono neon-text">Fi‑Si</h1>
        <span className="text-sm text-terminal-muted">[ LIVE TERMINAL ]</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-terminal-muted">
          <User size={16} />
          <span className="text-xs font-mono">&gt; {userId}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-terminal-green shadow-neon-sm' : 'bg-terminal-red'} animate-pulse`}></div>
          <span className="text-xs text-terminal-text font-mono">
            {isConnected ? '[CONNECTED]' : '[OFFLINE]'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {Object.entries(TAB_ICONS).map(([tabId, Icon]) => (
            <button
              key={tabId}
              onClick={() => toggleTab(tabId)}
              className={`p-2 rounded transition-colors ${
                visibleTabs.has(tabId)
                  ? 'bg-terminal-accent text-white'
                  : 'bg-terminal-border text-terminal-muted hover:bg-terminal-border/80'
              }`}
              title={TAB_LABELS[tabId]}
            >
              <Icon size={18} />
            </button>
          ))}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded bg-terminal-border text-terminal-muted hover:bg-terminal-border/80 transition-colors"
          >
            <Settings size={18} />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-terminal-panel border border-terminal-border rounded-lg shadow-xl z-50">
              <button
                onClick={() => {
                  resetLayout();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-terminal-text hover:bg-terminal-border flex items-center gap-2 rounded-t-lg"
              >
                <RefreshCw size={14} />
                Reset Layout
              </button>
              <button
                onClick={() => {
                  onLogout();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-terminal-red hover:bg-terminal-border flex items-center gap-2 border-t border-terminal-border rounded-b-lg"
              >
                <LogOut size={14} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
