import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Newspaper, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';
import clientDataService from '../services/clientDataService';
import './PortfolioRebalancing/PortfolioRebalancingNative.css';

const InvestmentDetailsView = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTickers, setExpandedTickers] = useState({});

  useEffect(() => {
    const fetchInvestmentDetails = async () => {
      try {
        setLoading(true);
        
        console.log(`[InvestmentDetailsView] Fetching data for client ${clientId}`);
        
        // Use production-ready service
        const response = await clientDataService.getInvestmentDetails(clientId);
        
        setData(response.data);
      } catch (err) {
        console.error(`[InvestmentDetailsView] Error:`, err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvestmentDetails();
  }, [clientId]);

  const tickerNames = (data?.current_holdings || []).reduce((acc, holding) => {
    acc[holding.ticker] = holding.name;
    return acc;
  }, {});

  const toggleTicker = (ticker) => {
    setExpandedTickers(prev => ({ ...prev, [ticker]: !prev[ticker] }));
  };

  const getSentimentBadge = (sentiment) => {
    const badges = {
      positive: { class: 'positive', text: 'Positive' },
      negative: { class: 'negative', text: 'Negative' },
      neutral: { class: 'neutral', text: 'Neutral' }
    };
    return badges[sentiment] || badges.neutral;
  };

  if (loading) {
    return (
      <div className="pr-page">
        <div className="pr-header">
          <button onClick={() => navigate(-1)} className="pr-back-btn">
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center' }}>Loading investment details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pr-page">
        <div className="pr-header">
          <button onClick={() => navigate(-1)} className="pr-back-btn">
            <ArrowLeft size={18} />
            Back
          </button>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--error)' }}>
          Error: {error}
        </div>
      </div>
    );
  }

  if (!data || !data.detailed_news_data) return null;

  return (
    <div className="pr-page">
      <div className="pr-header">
        <button onClick={() => navigate(-1)} className="pr-back-btn">
          <ArrowLeft size={18} />
          Back
        </button>
      </div>
      <div className="pr-content">
        <motion.section
          className="pr-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="pr-section-header">
            <Newspaper size={22} />
            <h2>News Analysis and Portfolio Impact</h2>
          </div>
          <div className="pr-news-grid">
            {Object.entries(data.detailed_news_data).map(([ticker, newsData]) => {
              const badge = getSentimentBadge(newsData.sentiment_summary.dominant_sentiment);
              const isExpanded = expandedTickers[ticker];
              return (
                <div key={ticker} className="ticker-section">
                  <div className="ticker-header-collapsible" onClick={() => toggleTicker(ticker)}>
                    <div className="ticker-left">
                      <div className="ticker-info-group">
                        <span className="ticker-symbol">{ticker}</span>
                        <span className="ticker-divider">|</span>
                        <span className="ticker-name">{tickerNames[ticker] || ticker}</span>
                      </div>
                    </div>
                    <div className="ticker-right">
                      <span className={`news-badge sentiment-${badge.class}`}>{badge.text}</span>
                      <div className="ticker-stats-compact">
                        <div className="stat-group">
                          <span className="stat-label">Articles</span>
                          <span className="stat-value">{newsData.total_articles}</span>
                        </div>
                        <span className="stat-separator">•</span>
                        <div className="sentiment-tags">
                          <span className="sentiment-tag positive" title="Positive">{newsData.sentiment_summary.sentiment_distribution?.positive ?? '—'}</span>
                          <span className="sentiment-tag neutral" title="Neutral">{newsData.sentiment_summary.sentiment_distribution?.neutral ?? '—'}</span>
                          <span className="sentiment-tag negative" title="Negative">{newsData.sentiment_summary.sentiment_distribution?.negative ?? '—'}</span>
                        </div>
                        <span className="stat-separator">•</span>
                        <div className="stat-group">
                          <span className="stat-label">Polarity</span>
                          <span className={`stat-value polarity-value ${newsData.sentiment_summary.avg_polarity > 0 ? 'positive' : newsData.sentiment_summary.avg_polarity < 0 ? 'negative' : 'neutral'}`}>
                            {newsData.sentiment_summary.avg_polarity > 0 ? '+' : ''}{newsData.sentiment_summary.avg_polarity.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      <motion.div 
                        className="expand-icon"
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronDown size={20} />
                      </motion.div>
                    </div>
                  </div>
                  <motion.div
                    initial={false}
                    animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="news-cards-grid">
                      {newsData.articles.slice(0, 3).map((article, idx) => (
                        <motion.div
                          key={idx}
                          className="news-impact-card"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          whileHover={{ scale: 1.02, y: -4 }}
                        >
                          <div className="news-card-header">
                            <span className={`sentiment-badge ${article.sentiment_analysis.sentiment.toLowerCase()}`}>
                              {article.sentiment_analysis.sentiment}
                            </span>
                            <span className="news-date">{article.formatted_date}</span>
                          </div>
                          <h4 className="news-headline">{article.headline}</h4>
                          <p className="news-summary">{article.summary}</p>
                          <div className="news-impact">
                            <span className="impact-label">Market Impact:</span>
                            <span className="impact-value">{article.sentiment_analysis.market_impact}</span>
                          </div>
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="news-link"
                          >
                            Read Full Article →
                          </a>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default InvestmentDetailsView;
