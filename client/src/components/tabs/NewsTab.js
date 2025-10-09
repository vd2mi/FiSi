import React, { useState, useEffect, useCallback } from 'react';
import { Newspaper, ExternalLink } from 'lucide-react';
import TabContainer from '../TabContainer';
import { newsAPI } from '../../services/api';

function NewsTab({ onClose }) {
  const [news, setNews] = useState([]);
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);

  const loadNews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await newsAPI.getMarket(category);
      setNews(res.data.data || []);
    } catch (error) {
      console.error('Error loading news:', error);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    loadNews();
  }, [loadNews]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const categories = [
    { value: 'general', label: 'General' },
    { value: 'forex', label: 'Forex' },
    { value: 'crypto', label: 'Crypto' },
    { value: 'merger', label: 'M&A' },
  ];

  return (
    <TabContainer
      title="Financial News"
      icon={Newspaper}
      onClose={onClose}
      actions={
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setCategory(cat.value)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                category === cat.value
                  ? 'bg-terminal-accent text-white'
                  : 'bg-terminal-border text-terminal-muted hover:bg-terminal-border/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      }
    >
      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-terminal-muted">Loading news...</div>
        </div>
      ) : (
        <div className="space-y-3">
          {news.length === 0 ? (
            <div className="text-center text-terminal-muted py-8">
              No news articles available
            </div>
          ) : (
            news.map((article, index) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-terminal-bg rounded-lg p-4 hover:bg-terminal-panel transition-colors group"
              >
                <div className="flex gap-4">
                  {article.image && (
                    <img
                      src={article.image}
                      alt={article.headline}
                      className="w-32 h-24 object-cover rounded flex-shrink-0"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-terminal-text group-hover:text-terminal-accent transition-colors line-clamp-2">
                        {article.headline}
                      </h4>
                      <ExternalLink size={14} className="text-terminal-muted flex-shrink-0 mt-1" />
                    </div>
                    <p className="text-xs text-terminal-muted line-clamp-2 mb-2">
                      {article.summary}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-terminal-muted">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{formatDate(article.datetime)}</span>
                      {article.related && (
                        <>
                          <span>•</span>
                          <span className="text-terminal-accent">{article.related}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      )}
    </TabContainer>
  );
}

export default NewsTab;
