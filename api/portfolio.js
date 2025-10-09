const admin = require('firebase-admin');

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
      })
    });
  } catch (error) {
    console.error('Firebase admin init error:', error);
  }
}

const db = admin.firestore();

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { userId } = req.query;
  const { action } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const portfolioRef = db.collection('portfolios').doc(userId);

    if (req.method === 'GET') {
      if (action === 'favorites') {
        const doc = await portfolioRef.get();
        const data = doc.exists ? doc.data() : { favorites: [] };
        return res.status(200).json({ data: data.favorites || [] });
      }

      const doc = await portfolioRef.get();
      
      if (!doc.exists) {
        const initialPortfolio = {
          cash: 100000,
          holdings: [],
          transactions: [],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        };
        await portfolioRef.set(initialPortfolio);
        return res.status(200).json({ data: initialPortfolio });
      }

      return res.status(200).json({ data: doc.data() });
    }

    if (req.method === 'POST') {
      const body = req.body;

      if (action === 'favorites') {
        await portfolioRef.set(
          { favorites: body.favorites || [] },
          { merge: true }
        );
        return res.status(200).json({ success: true });
      }

      if (action === 'trade') {
        const { symbol, quantity, price, type } = body;

        if (!symbol || !quantity || !price || !type) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const doc = await portfolioRef.get();
        const portfolio = doc.exists ? doc.data() : {
          cash: 100000,
          holdings: [],
          transactions: []
        };

        const totalCost = quantity * price;

        if (type === 'buy') {
          if (portfolio.cash < totalCost) {
            return res.status(400).json({ error: 'Insufficient funds' });
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
            return res.status(400).json({ error: 'Insufficient shares' });
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

        await portfolioRef.set(portfolio);
        return res.status(200).json({ data: portfolio });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Portfolio API error:', error);
    res.status(500).json({ error: error.message });
  }
};

