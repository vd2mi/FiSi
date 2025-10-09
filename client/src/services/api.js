import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || window.location.origin;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
});

export const stocksAPI = {
  getQuote: (symbol) => api.get('/stocks', { params: { action: 'quote', symbol } }),
  getProfile: (symbol) => api.get('/stocks', { params: { action: 'profile', symbol } }),
  getCandles: (symbol, params) => api.get('/stocks', { params: { action: 'candles', symbol, ...params } }),
  search: (query) => api.get('/stocks', { params: { action: 'search', q: query } }),
  getPopular: () => api.get('/stocks', { params: { action: 'popular' } }),
  getMarketStatus: () => api.get('/stocks', { params: { action: 'market-status' } }),
};

export const cryptoAPI = {
  getTop: (limit = 20) => api.get('/crypto', { params: { action: 'top', limit } }),
  getDetails: (coinId) => api.get('/crypto', { params: { action: 'details', coinId } }),
  getChart: (coinId, days = 1) => api.get('/crypto', { params: { action: 'chart', coinId, days } }),
  search: (query) => api.get('/crypto', { params: { action: 'search', q: query } }),
  getGlobal: () => api.get('/crypto', { params: { action: 'global' } }),
  getTrending: () => api.get('/crypto', { params: { action: 'trending' } }),
};

export const optionsAPI = {
  getChain: (symbol, expiration) => api.get('/options', { params: { action: 'chain', symbol, expiration } }),
  getExpirations: (symbol) => api.get('/options', { params: { action: 'expirations', symbol } }),
  getQuote: (symbol, params) => api.get('/options', { params: { action: 'quote', symbol, ...params } }),
  getGreeks: (symbol, params) => api.get('/options', { params: { action: 'greeks', symbol, ...params } }),
  getIV: (symbol) => api.get('/options', { params: { action: 'iv', symbol } }),
};

export const newsAPI = {
  getMarket: (category = 'general') => api.get('/news', { params: { action: 'market', category } }),
  getCompany: (symbol, params) => api.get('/news', { params: { action: 'company', symbol, ...params } }),
};

export const portfolioAPI = {
  get: (userId) => api.get('/portfolio', { params: { userId } }),
  trade: (userId, tradeData) => api.post('/portfolio', { ...tradeData }, { params: { userId, action: 'trade' } }),
  getFavorites: (userId) => api.get('/portfolio', { params: { userId, action: 'favorites' } }),
  updateFavorites: (userId, data) => api.post('/portfolio', data, { params: { userId, action: 'favorites' } }),
};

export default api;
