import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = process.env.REACT_APP_WS_URL;

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const listenersRef = useRef(new Map());

  const connect = useCallback(() => {
    if (!WS_URL) {
      console.error('❌ REACT_APP_WS_URL is not configured');
      console.error('   Set this in your .env file or Vercel environment variables');
      return;
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    console.log('🔌 Connecting to WebSocket:', WS_URL);
    
    try {
      const ws = new WebSocket(WS_URL);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected to:', WS_URL);
        setIsConnected(true);
        
        listenersRef.current.forEach((callbacks, key) => {
          const [channel, symbol] = key.split(':');
          ws.send(JSON.stringify({
            type: 'subscribe',
            payload: { channel, symbols: [symbol] }
          }));
        });
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          
          if (message.type === 'update') {
            const key = `${message.channel}:${message.symbol}`;
            const callbacks = listenersRef.current.get(key);
            if (callbacks) {
              callbacks.forEach(callback => callback(message.data));
            }
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        console.log('❌ WebSocket disconnected');
        setIsConnected(false);
        
        if (WS_URL) {
          console.log('🔄 Reconnecting in 10 seconds...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 10000);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        console.error('   Check if WebSocket server is running at:', WS_URL);
        setIsConnected(false);
      };

      wsRef.current = ws;
    } catch (error) {
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const subscribe = useCallback((channel, symbol, callback) => {
    if (!WS_URL) {
      return () => {};
    }

    const key = `${channel}:${symbol}`;
    
    if (!listenersRef.current.has(key)) {
      listenersRef.current.set(key, new Set());
    }
    listenersRef.current.get(key).add(callback);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        payload: { channel, symbols: [symbol] }
      }));
    }

    return () => {
      const callbacks = listenersRef.current.get(key);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          listenersRef.current.delete(key);
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
              type: 'unsubscribe',
              payload: { channel, symbols: [symbol] }
            }));
          }
        }
      }
    };
  }, []);

  useEffect(() => {
    if (WS_URL) {
      connect();
    }
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    subscribe,
    reconnect: connect,
  };
}

export default useWebSocket;
