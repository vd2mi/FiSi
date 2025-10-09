import React, { useState, useCallback, useEffect } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import Auth from './components/Auth';
import Header from './components/Header';
import StocksTab from './components/tabs/StocksTab';
import PortfolioTab from './components/tabs/PortfolioTab';
import OptionsTab from './components/tabs/OptionsTab';
import NewsTab from './components/tabs/NewsTab';
import CryptoTab from './components/tabs/CryptoTab';
import { useWebSocket } from './hooks/useWebSocket';
import { auth } from './config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const ResponsiveGridLayout = WidthProvider(Responsive);

const TABS = {
  STOCKS: 'stocks',
  PORTFOLIO: 'portfolio',
  OPTIONS: 'options',
  NEWS: 'news',
  CRYPTO: 'crypto',
};

const TAB_COMPONENTS = {
  [TABS.STOCKS]: StocksTab,
  [TABS.PORTFOLIO]: PortfolioTab,
  [TABS.OPTIONS]: OptionsTab,
  [TABS.NEWS]: NewsTab,
  [TABS.CRYPTO]: CryptoTab,
};

function App() {
  const { isConnected, subscribe } = useWebSocket();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [layouts, setLayouts] = useState({
    lg: [
      { i: TABS.STOCKS, x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: TABS.PORTFOLIO, x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: TABS.CRYPTO, x: 0, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
      { i: TABS.OPTIONS, x: 4, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
      { i: TABS.NEWS, x: 8, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
    ]
  });

  const [visibleTabs, setVisibleTabs] = useState(new Set(Object.values(TABS)));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = useCallback((userData) => {
    setUser(userData);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      localStorage.removeItem('fi-si-layouts');
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, []);

  const onLayoutChange = useCallback((layout, layouts) => {
    setLayouts(layouts);
    localStorage.setItem('fi-si-layouts', JSON.stringify(layouts));
  }, []);

  const toggleTab = useCallback((tabId) => {
    setVisibleTabs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tabId)) {
        newSet.delete(tabId);
      } else {
        newSet.add(tabId);
      }
      return newSet;
    });
  }, []);

  const resetLayout = useCallback(() => {
    setLayouts({
      lg: [
        { i: TABS.STOCKS, x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
        { i: TABS.PORTFOLIO, x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
        { i: TABS.CRYPTO, x: 0, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
        { i: TABS.OPTIONS, x: 4, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
        { i: TABS.NEWS, x: 8, y: 4, w: 4, h: 4, minW: 3, minH: 3 },
      ]
    });
    localStorage.removeItem('fi-si-layouts');
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('fi-si-layouts');
    if (saved) {
      try {
        setLayouts(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load saved layout:', error);
      }
    }
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-terminal-bg">
        <div className="text-terminal-accent text-xl font-mono">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-terminal-bg">
      <Header 
        isConnected={isConnected}
        visibleTabs={visibleTabs}
        toggleTab={toggleTab}
        resetLayout={resetLayout}
        userId={user.displayName}
        onLogout={handleLogout}
      />
      
      <div className="flex-1 overflow-auto p-4">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          onLayoutChange={onLayoutChange}
          draggableHandle=".drag-handle"
          isDraggable={true}
          isResizable={true}
          margin={[16, 16]}
        >
          {Object.entries(TABS).map(([key, tabId]) => {
            if (!visibleTabs.has(tabId)) return null;
            
            const TabComponent = TAB_COMPONENTS[tabId];
            return (
              <div key={tabId}>
                <TabComponent 
                  userId={user.uid}
                  subscribe={subscribe}
                  onClose={() => toggleTab(tabId)}
                />
              </div>
            );
          })}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
}

export default App;
