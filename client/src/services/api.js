import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
});

export const stocksAPI = {
  getQuote: (symbol) => api.get(`/stocks/quote/${symbol}`),
  getProfile: (symbol) => api.get(`/stocks/profile/${symbol}`),
  getCandles: (symbol, params) => api.get(`/stocks/candles/${symbol}`, { params }),
  search: (query) => api.get('/stocks/search', { params: { q: query } }),
  getPopular: () => api.get('/stocks/popular'),
  getMarketStatus: () => api.get('/stocks/market-status'),
};

export const cryptoAPI = {
  getTop: (limit = 20) => api.get('/crypto/top', { params: { limit } }),
  getDetails: (coinId) => api.get(`/crypto/details/${coinId}`),
  getChart: (coinId, days = 1) => api.get(`/crypto/chart/${coinId}`, { params: { days } }),
  search: (query) => api.get('/crypto/search', { params: { q: query } }),
  getGlobal: () => api.get('/crypto/global'),
  getTrending: () => api.get('/crypto/trending'),
};

export const optionsAPI = {
  getChain: (symbol, expiration) => api.get(`/options/chain/${symbol}`, { params: { expiration } }),
  getExpirations: (symbol) => api.get(`/options/expirations/${symbol}`),
  getQuote: (symbol, params) => api.get(`/options/quote/${symbol}`, { params }),
  getGreeks: (symbol, params) => api.get(`/options/greeks/${symbol}`, { params }),
  getIV: (symbol) => api.get(`/options/iv/${symbol}`),
};

export const newsAPI = {
  getMarket: (category = 'general') => api.get('/news/market', { params: { category } }),
  getCompany: (symbol, params) => api.get(`/news/company/${symbol}`, { params }),
};

export const portfolioAPI = {
  get: (userId) => api.get(`/portfolio/${userId}`),
  trade: (userId, tradeData) => api.post(`/portfolio/${userId}/trade`, tradeData),
  getFavorites: (userId) => api.get(`/portfolio/${userId}/favorites`),
  updateFavorites: (userId, data) => api.post(`/portfolio/${userId}/favorites`, data),
};

export default api;
