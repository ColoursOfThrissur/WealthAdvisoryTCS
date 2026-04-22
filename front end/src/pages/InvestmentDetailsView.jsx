import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Newspaper, TrendingUp, ChevronDown, ChevronUp, ExternalLink, AlertTriangle, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import clientDataService from '../services/clientDataService';
import AIBadge from '../components/AIBadge';
import './InvestmentDetailsView.css';

const InvestmentDetailsView = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedTickers, setExpandedTickers] = useState({});
  const [activeTab, setActiveTab] = useState('sentiment');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await clientDataService.getInvestmentDetails(clientId);
        setData(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [clientId]);

  const toggleTicker = (ticker) =>
    setExpandedTickers(prev => ({ ...prev, [ticker]: !prev[ticker] }));

  const getSentimentColor = (s) => {
    if (!s) return 'neutral';
    const l = s.toLowerCase();
    if (l === 'positive') return 'positive';
    if (l === 'negative') return 'negative';
    return 'neutral';
  };

  if (loading) return (
    <div className="idv-page">
      <div className="idv-header">
        <button onClick={() => navigate(-1)} className="idv-back-btn"><ArrowLeft size={18} />Back</button>
        <h1 className="idv-title">Market Sentiment & Holdings</h1>
      </div>
      <div className="idv-loading">
        <div className="idv-spinner" />
        <p>Loading investment details...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="idv-page">
      <div className="idv-header">
        <button onClick={() => navigate(-1)} className="idv-back-btn"><ArrowLeft size={18} />Back</button>
        <h1 className="idv-title">Market Sentiment & Holdings</h1>
      </div>
      <div className="idv-error"><AlertTriangle size={20} /> {error}</div>
    </div>
  );

  const holdings = data?.current_holdings || [];
  const newsData = data?.detailed_news_data || {};
  const newsEntries = Object.entries(newsData);
  const hasHoldings = holdings.length > 0;
  const hasNews = newsEntries.length > 0;

  // Overall sentiment summary — count actual articles by sentiment
  const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };
  let totalArticles = 0;
  newsEntries.forEach(([, nd]) => {
    (nd.articles || []).forEach(a => {
      const s = a.sentiment_analysis?.sentiment?.toLowerCase();
      if (s in sentimentCounts) sentimentCounts[s]++;
      totalArticles++;
    });
  });

  return (
    <div className="idv-page">
      <div className="idv-header">
        <button onClick={() => navigate(-1)} className="idv-back-btn">
          <ArrowLeft size={18} />Back
        </button>
        <h1 className="idv-title">Market Sentiment & Holdings</h1>
        <div className="idv-header-badge"><AIBadge size="sm" /></div>
      </div>

      {/* Tabs */}
      <div className="idv-tabs">
        <button className={`idv-tab ${activeTab === 'sentiment' ? 'active' : ''}`} onClick={() => setActiveTab('sentiment')}>
          <Newspaper size={16} />News & Sentiment
        </button>
        <button className={`idv-tab ${activeTab === 'holdings' ? 'active' : ''}`} onClick={() => setActiveTab('holdings')}>
          <TrendingUp size={16} />Current Holdings
        </button>
      </div>

      {/* Sentiment Tab */}
      {activeTab === 'sentiment' && (
        <div className="idv-content">
          {/* Sentiment Summary Bar */}
          {hasNews && (
            <div className="idv-sentiment-summary">
              <div className="idv-sentiment-kpi positive">
                <span className="idv-sentiment-kpi-value">{sentimentCounts.positive}</span>
                <span className="idv-sentiment-kpi-label">Positive</span>
              </div>
              <div className="idv-sentiment-kpi neutral">
                <span className="idv-sentiment-kpi-value">{sentimentCounts.neutral}</span>
                <span className="idv-sentiment-kpi-label">Neutral</span>
              </div>
              <div className="idv-sentiment-kpi negative">
                <span className="idv-sentiment-kpi-value">{sentimentCounts.negative}</span>
                <span className="idv-sentiment-kpi-label">Negative</span>
              </div>
              <div className="idv-sentiment-kpi">
                <span className="idv-sentiment-kpi-value">{totalArticles}</span>
                <span className="idv-sentiment-kpi-label">Total Articles</span>
              </div>
            </div>
          )}

          {!hasNews ? (
            <div className="idv-empty">
              <Newspaper size={40} />
              <p>No sentiment data available</p>
              <span>Sentiment analysis requires the agent to run with sentiment enabled</span>
            </div>
          ) : (
            <div className="idv-news-list">
              {newsEntries.map(([ticker, nd], idx) => {
                const isExpanded = expandedTickers[ticker];
                const dominant = nd.sentiment_summary?.dominant_sentiment || 'neutral';
                const polarity = nd.sentiment_summary?.avg_polarity ?? 0;
                const articles = nd.articles || [];
                const fundName = holdings.find(h => h.ticker === ticker)?.name || ticker;

                return (
                  <motion.div
                    key={ticker}
                    className="idv-fund-card"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    {/* Fund Header */}
                    <div className="idv-fund-header" onClick={() => toggleTicker(ticker)}>
                      <div className="idv-fund-left">
                        <span className="idv-fund-ticker">{ticker}</span>
                        <span className="idv-fund-name">{fundName}</span>
                      </div>
                      <div className="idv-fund-right">
                        <span className={`idv-sentiment-badge ${getSentimentColor(dominant)}`}>
                          {dominant.charAt(0).toUpperCase() + dominant.slice(1)}
                        </span>
                        <div className="idv-fund-stats">
                          <span className="idv-stat">
                            <span className="idv-stat-label">Articles</span>
                            <span className="idv-stat-value">{articles.length}</span>
                          </span>
                          <span className="idv-stat-sep">·</span>
                          <span className="idv-stat">
                            <span className="idv-stat-label">Polarity</span>
                            <span className={`idv-stat-value ${getSentimentColor(dominant)}`}>
                              {polarity > 0 ? '+' : ''}{polarity.toFixed(3)}
                            </span>
                          </span>
                        </div>
                        <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                          <ChevronDown size={18} />
                        </motion.div>
                      </div>
                    </div>

                    {/* Polarity Bar */}
                    <div className="idv-polarity-bar">
                      <div className="idv-polarity-track">
                        <div className="idv-polarity-center" />
                        {polarity >= 0 ? (
                          <div
                            className="idv-polarity-fill positive"
                            style={{ left: '50%', width: `${Math.min(Math.abs(polarity) / 0.7 * 50, 50)}%` }}
                          />
                        ) : (
                          <div
                            className="idv-polarity-fill negative"
                            style={{ right: '50%', width: `${Math.min(Math.abs(polarity) / 0.7 * 50, 50)}%` }}
                          />
                        )}
                      </div>
                    </div>

                    {/* Articles */}
                    <motion.div
                      initial={false}
                      animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      {articles.length === 0 ? (
                        <div className="idv-no-articles">No articles available for this fund</div>
                      ) : (
                        <div className="idv-articles-grid">
                          {articles.map((article, i) => (
                            <div key={i} className="idv-article-card">
                              <div className="idv-article-meta">
                                <span className={`idv-article-sentiment ${getSentimentColor(article.sentiment_analysis?.sentiment)}`}>
                                  {article.sentiment_analysis?.sentiment || 'Neutral'}
                                </span>
                                <span className="idv-article-date">{article.formatted_date}</span>
                              </div>
                              <p className="idv-article-headline">{article.headline}</p>
                              {article.url && (
                                <a href={article.url} target="_blank" rel="noopener noreferrer" className="idv-article-link">
                                  Read Article <ExternalLink size={12} />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Holdings Tab */}
      {activeTab === 'holdings' && (
        <div className="idv-content">
          {!hasHoldings ? (
            <div className="idv-empty">
              <TrendingUp size={40} />
              <p>No holdings data available</p>
              <span>Holdings data is populated when the agent runs successfully</span>
            </div>
          ) : (
            <div className="idv-holdings-table-wrapper">
              <table className="idv-table">
                <thead>
                  <tr>
                    <th>Ticker</th>
                    <th>Fund Name</th>
                    <th>Price</th>
                    <th>Total Return</th>
                    <th>Volatility</th>
                    <th>Max Drawdown</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, i) => (
                    <motion.tr
                      key={h.ticker}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <td className="idv-ticker">{h.ticker}</td>
                      <td>{h.name}</td>
                      <td>${typeof h.current_price === 'number' ? h.current_price.toFixed(2) : h.current_price}</td>
                      <td className={h.total_return_pct > 0 ? 'positive' : 'negative'}>
                        {h.total_return_pct > 0 ? '+' : ''}{typeof h.total_return_pct === 'number' ? h.total_return_pct.toFixed(2) : h.total_return_pct}%
                      </td>
                      <td>{typeof h.volatility_pct === 'number' ? h.volatility_pct.toFixed(2) : h.volatility_pct}%</td>
                      <td className="negative">
                        {typeof h.max_drawdown_pct === 'number' ? h.max_drawdown_pct.toFixed(2) : h.max_drawdown_pct}%
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InvestmentDetailsView;
