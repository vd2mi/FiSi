import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, DollarSign, Newspaper, Bitcoin, Settings, RefreshCw, LogOut, User, Clock, Palette } from 'lucide-react';

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

function Header({ isConnected, visibleTabs, toggleTab, resetLayout, userId, onLogout, userUid }) {
  const [showMenu, setShowMenu] = useState(false);
  const [marketStatus, setMarketStatus] = useState({ isOpen: false, status: 'Checking...' });
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [accentColor, setAccentColor] = useState('#3b82f6');
  const [isProfessionalMode, setIsProfessionalMode] = useState(true);

  useEffect(() => {
    const savedColor = localStorage.getItem(`fi-si-color-${userUid}`);
    const savedMode = localStorage.getItem(`fi-si-professional-${userUid}`);
    
    const isPro = savedMode !== null ? savedMode === 'true' : true;
    setIsProfessionalMode(isPro);
    
    if (isPro) {
      document.body.classList.add('professional-mode');
    } else {
      document.body.classList.remove('professional-mode');
    }
    
    const defaultColor = isPro ? '#3b82f6' : '#00ff41';
    const colorToUse = savedColor || defaultColor;
    setAccentColor(colorToUse);
    applyColor(colorToUse);
  }, [userUid]);

  useEffect(() => {
    const checkMarketStatus = () => {
      const nyTime = new Date().toLocaleString('en-US', { timeZone: 'America/New_York' });
      const now = new Date(nyTime);
      const day = now.getDay();
      const hour = now.getHours();
      const minutes = now.getMinutes();
      const timeInMinutes = hour * 60 + minutes;
      const marketOpen = 570; 
      const marketClose = 960; 

      const isWeekday = day >= 1 && day <= 5;
      const isDuringMarketHours = timeInMinutes >= marketOpen && timeInMinutes < marketClose;

      if (!isWeekday) {
        setMarketStatus({ isOpen: false, status: 'CLOSED (Weekend)' });
      } else if (!isDuringMarketHours) {
        if (timeInMinutes < marketOpen) {
          setMarketStatus({ isOpen: false, status: 'PRE-MARKET' });
        } else {
          setMarketStatus({ isOpen: false, status: 'AFTER-HOURS' });
        }
      } else {
        setMarketStatus({ isOpen: true, status: 'MARKET OPEN' });
      }
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000);

    return () => clearInterval(interval);
  }, []);

  const applyColor = (color) => {
    document.documentElement.style.setProperty('--color-accent', color);
  };

  const handleColorChange = (color) => {
    setAccentColor(color);
    applyColor(color);
    localStorage.setItem(`fi-si-color-${userUid}`, color);
  };

  const toggleProfessionalMode = () => {
    const newMode = !isProfessionalMode;
    setIsProfessionalMode(newMode);
    localStorage.setItem(`fi-si-professional-${userUid}`, newMode.toString());
    
    if (newMode) {
      document.body.classList.add('professional-mode');
      handleColorChange('#3b82f6');
    } else {
      document.body.classList.remove('professional-mode');
      handleColorChange('#00ff41');
    }
  };

  const NEON_COLORS = [
    { name: 'Matrix Green', value: '#00ff41' },
    { name: 'Cyan', value: '#00ffff' },
    { name: 'Neon Pink', value: '#ff10f0' },
    { name: 'Electric Blue', value: '#0080ff' },
    { name: 'Toxic Yellow', value: '#dfff00' },
    { name: 'Hot Orange', value: '#ff6600' },
    { name: 'Purple Haze', value: '#9d00ff' },
    { name: 'Lime', value: '#ccff00' },
  ];

  const PROFESSIONAL_COLORS = [
    { name: 'Professional Blue', value: '#3b82f6' },
    { name: 'Corporate Navy', value: '#1e40af' },
    { name: 'Teal', value: '#14b8a6' },
    { name: 'Indigo', value: '#6366f1' },
    { name: 'Purple', value: '#a855f7' },
    { name: 'Sky Blue', value: '#0ea5e9' },
    { name: 'Emerald', value: '#10b981' },
    { name: 'Slate', value: '#64748b' },
  ];

  const PRESET_COLORS = isProfessionalMode ? PROFESSIONAL_COLORS : NEON_COLORS;

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
          <Clock size={14} />
          <span className={`text-xs font-mono ${marketStatus.isOpen ? 'text-terminal-accent' : 'text-terminal-muted'}`}>
            [{marketStatus.status}]
          </span>
        </div>

        <div className="flex items-center gap-2" title={isConnected ? 'WebSocket connected' : 'WebSocket disconnected - prices may not update'}>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-terminal-accent shadow-neon-sm' : 'bg-terminal-red'} animate-pulse`}></div>
          <span className="text-xs text-terminal-text font-mono">
            {isConnected ? '[WS: LIVE]' : '[WS: OFFLINE]'}
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
            <div className="absolute right-0 mt-2 w-64 bg-terminal-panel border border-terminal-border rounded-lg shadow-xl z-50">
              <button
                onClick={toggleProfessionalMode}
                className="w-full px-4 py-2 text-left text-sm text-terminal-text hover:bg-terminal-border flex items-center justify-between rounded-t-lg"
              >
                <span className="flex items-center gap-2">
                  <Settings size={14} />
                  Matrix Mode
                </span>
                <div className={`w-10 h-5 rounded-full transition-colors ${!isProfessionalMode ? 'bg-terminal-accent' : 'bg-terminal-border'} relative`}>
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${!isProfessionalMode ? 'transform translate-x-5' : ''}`}></div>
                </div>
              </button>
              
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="w-full px-4 py-2 text-left text-sm text-terminal-text hover:bg-terminal-border flex items-center gap-2 border-t border-terminal-border"
              >
                <Palette size={14} />
                Theme Color
              </button>
              
              {showColorPicker && (
                <div className="px-4 py-3 border-t border-terminal-border bg-terminal-bg">
                  <p className="text-xs font-semibold text-terminal-text mb-2">Theme Color:</p>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {PRESET_COLORS.map((preset) => (
                      <button
                        key={preset.value}
                        onClick={() => handleColorChange(preset.value)}
                        className="w-12 h-12 rounded-lg border-2 transition-all hover:scale-110 relative"
                        style={{
                          backgroundColor: preset.value,
                          borderColor: accentColor === preset.value ? '#fff' : 'transparent',
                          boxShadow: accentColor === preset.value ? `0 0 10px ${preset.value}` : 'none'
                        }}
                        title={preset.name}
                      >
                        {accentColor === preset.value && (
                          <span className="absolute inset-0 flex items-center justify-center text-white text-xl">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-full h-10 rounded cursor-pointer border-2 border-terminal-border"
                    />
                    <span className="text-xs text-terminal-muted font-mono">{accentColor}</span>
                  </div>
                </div>
              )}
              
              <button
                onClick={() => {
                  resetLayout();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm text-terminal-text hover:bg-terminal-border flex items-center gap-2 border-t border-terminal-border"
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
