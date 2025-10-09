const PORTFOLIO_KEY = 'fisi_portfolio_';

export const portfolioService = {
  get: (userId) => {
    const key = PORTFOLIO_KEY + userId;
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {
      holdings: [],
      transactions: [],
      cash: 100000
    };
  },

  save: (userId, portfolio) => {
    const key = PORTFOLIO_KEY + userId;
    localStorage.setItem(key, JSON.stringify(portfolio));
  },

  trade: (userId, tradeData) => {
    const portfolio = portfolioService.get(userId);
    const { symbol, quantity, price, type } = tradeData;
    const totalCost = quantity * price;

    if (type === 'buy') {
      if (portfolio.cash < totalCost) {
        throw new Error('Insufficient funds');
      }

      portfolio.cash -= totalCost;
      
      const existingHolding = portfolio.holdings.find(h => h.symbol === symbol);
      if (existingHolding) {
        const totalQuantity = existingHolding.quantity + quantity;
        existingHolding.averagePrice = 
          ((existingHolding.averagePrice * existingHolding.quantity) + (price * quantity)) / totalQuantity;
        existingHolding.quantity = totalQuantity;
      } else {
        portfolio.holdings.push({
          symbol,
          quantity,
          averagePrice: price
        });
      }
    } else if (type === 'sell') {
      const holding = portfolio.holdings.find(h => h.symbol === symbol);
      
      if (!holding || holding.quantity < quantity) {
        throw new Error('Insufficient shares');
      }

      portfolio.cash += totalCost;
      holding.quantity -= quantity;

      if (holding.quantity === 0) {
        portfolio.holdings = portfolio.holdings.filter(h => h.symbol !== symbol);
      }
    }

    portfolio.transactions.push({
      symbol,
      quantity,
      price,
      type,
      timestamp: new Date().toISOString()
    });

    portfolioService.save(userId, portfolio);
    return portfolio;
  }
};

