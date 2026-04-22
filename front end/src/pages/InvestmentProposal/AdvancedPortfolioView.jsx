import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, GitCompare, TrendingUp, Shield, Target, MessageSquare, Send, Sparkles, BarChart3, X, CheckCircle, PieChart } from 'lucide-react';
import { portfolioData, generatePerformanceData } from './portfolioData';
import './AdvancedPortfolioView.css';

const AdvancedPortfolioView = ({ mockData, onBack }) => {
    const [selectedForComparison, setSelectedForComparison] = useState([]);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [chatMessages, setChatMessages] = useState([{ role: 'assistant', content: 'Select portfolios to compare or ask me questions like "Compare Conservative vs Aggressive"' }]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    const toggleComparison = (portfolio) => {
        setSelectedForComparison(prev => {
            const exists = prev.find(p => p.name === portfolio.name);
            if (exists) return prev.filter(p => p.name !== portfolio.name);
            return [...prev, portfolio];
        });
    };

    const handleChatSubmit = (e) => {
        e.preventDefault();
        if (!chatInput.trim()) return;

        const userMsg = chatInput.trim();
        setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setChatInput('');
        setIsTyping(true);

        setTimeout(() => {
            const response = generateAgenticResponse(userMsg);
            setChatMessages(prev => [...prev, { role: 'assistant', content: response.text }]);
            if (response.action) executeAction(response.action);
            setIsTyping(false);
        }, 800);
    };

    const generateAgenticResponse = (input) => {
        const lower = input.toLowerCase();
        
        if (lower.includes('compare') || lower.includes('vs')) {
            const portfolioNames = portfolioData.map(p => p.name.toLowerCase());
            const mentioned = portfolioNames.filter(name => lower.includes(name));
            if (mentioned.length >= 2) {
                const toCompare = portfolioData.filter(p => mentioned.includes(p.name.toLowerCase()));
                return {
                    text: `I've selected ${toCompare.map(p => p.name).join(', ')} for comparison.`,
                    action: { type: 'compare', portfolios: toCompare }
                };
            }
        }
        
        if (lower.includes('low risk') || lower.includes('conservative')) {
            return { text: 'For low-risk: Conservative or Capital Preservation with 3-5% returns.' };
        }
        
        if (lower.includes('high return') || lower.includes('aggressive')) {
            return { text: 'For maximum growth: Aggressive or Dynamic Growth with 8-12% returns.' };
        }
        
        return { text: 'I can help compare portfolios or filter by risk!' };
    };

    const executeAction = (action) => {
        if (action.type === 'compare') {
            setSelectedForComparison(action.portfolios);
        }
    };

    const recommendedPortfolio = portfolioData.find(p => p.recommended);

    return (
        <div className="apv-container">
            <div className="apv-header">
                <button onClick={onBack} className="apv-back-btn">
                    <ArrowLeft size={20} /> Back
                </button>
                <h2><Sparkles size={24} /> AI-Powered Portfolio Analysis</h2>
                {selectedForComparison.length > 0 && (
                    <div className="apv-selected-count">
                        <CheckCircle size={16} /> {selectedForComparison.length} Selected
                    </div>
                )}
            </div>

            <div className="apv-main-layout">
                <div className="apv-content-area">
                    <div className="apv-panel apv-goals-panel">
                        <h3>Investment Goals</h3>
                        <div className="apv-goals-grid">
                            {mockData.client_profile.investment_goals.map((goal, idx) => (
                                <div key={idx} className="apv-goal-card">
                                    <Target size={16} />
                                    <span>{goal}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="apv-panel apv-recommended-panel">
                        <div className="apv-panel-header">
                            <h3>Recommended Portfolio</h3>
                            <span className="apv-badge apv-badge-recommended">AI Recommended</span>
                        </div>
                        <div className="apv-recommended-content">
                            <div className="apv-recommended-info">
                                <h4>{recommendedPortfolio.name}</h4>
                                <span className={`apv-risk-badge risk-${recommendedPortfolio.risk.toLowerCase().replace(/[- ]/g, '')}`}>
                                    {recommendedPortfolio.risk} Risk
                                </span>
                                <div className="apv-allocation-bars">
                                    <div className="apv-bar-item">
                                        <span>Stocks</span>
                                        <div className="apv-bar"><div className="apv-bar-fill stocks" style={{width: `${recommendedPortfolio.stocks}%`}}></div></div>
                                        <span>{recommendedPortfolio.stocks}%</span>
                                    </div>
                                    <div className="apv-bar-item">
                                        <span>Bonds</span>
                                        <div className="apv-bar"><div className="apv-bar-fill bonds" style={{width: `${recommendedPortfolio.bonds}%`}}></div></div>
                                        <span>{recommendedPortfolio.bonds}%</span>
                                    </div>
                                    <div className="apv-bar-item">
                                        <span>Cash</span>
                                        <div className="apv-bar"><div className="apv-bar-fill cash" style={{width: `${recommendedPortfolio.cash}%`}}></div></div>
                                        <span>{recommendedPortfolio.cash}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="apv-recommended-chart">
                                <svg viewBox="0 0 200 200" className="apv-pie-svg">
                                    <circle cx="100" cy="100" r="80" fill="none" stroke="#3b82f6" strokeWidth="40" strokeDasharray={`${recommendedPortfolio.stocks * 5.03} 502.4`} transform="rotate(-90 100 100)" />
                                    <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" strokeWidth="40" strokeDasharray={`${recommendedPortfolio.bonds * 5.03} 502.4`} strokeDashoffset={`-${recommendedPortfolio.stocks * 5.03}`} transform="rotate(-90 100 100)" />
                                    <circle cx="100" cy="100" r="80" fill="none" stroke="#f59e0b" strokeWidth="40" strokeDasharray={`${recommendedPortfolio.cash * 5.03} 502.4`} strokeDashoffset={`-${(recommendedPortfolio.stocks + recommendedPortfolio.bonds) * 5.03}`} transform="rotate(-90 100 100)" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="apv-panel">
                        <h3>All Available Portfolios <span className="apv-subtitle">Hover to add to comparison</span></h3>
                        <div className="apv-portfolios-grid">
                            {portfolioData.map((portfolio, idx) => (
                                <motion.div
                                    key={idx}
                                    className={`apv-portfolio-card apv-card-compact ${selectedForComparison.find(p => p.name === portfolio.name) ? 'selected' : ''}`}
                                    whileHover={{ scale: 1.02 }}
                                    onMouseEnter={() => setHoveredCard(portfolio.name)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    {hoveredCard === portfolio.name && (
                                        <button 
                                            className="apv-add-compare-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleComparison(portfolio);
                                            }}
                                        >
                                            {selectedForComparison.find(p => p.name === portfolio.name) ? 'Remove' : 'Add to Compare'}
                                        </button>
                                    )}
                                    <div className="apv-card-header">
                                        <h5>{portfolio.name}</h5>
                                        {portfolio.recommended && <span className="apv-badge-mini">Recommended</span>}
                                    </div>
                                    <div className="apv-compact-allocation">
                                        <div className="apv-allocation-row">
                                            <span className="apv-dot stocks"></span>
                                            <span>S: {portfolio.stocks}%</span>
                                        </div>
                                        <div className="apv-allocation-row">
                                            <span className="apv-dot bonds"></span>
                                            <span>B: {portfolio.bonds}%</span>
                                        </div>
                                        <div className="apv-allocation-row">
                                            <span className="apv-dot cash"></span>
                                            <span>C: {portfolio.cash}%</span>
                                        </div>
                                    </div>
                                    <div className="apv-compact-metrics">
                                        <span className={`apv-risk-tag risk-${portfolio.risk.toLowerCase().replace(/[- ]/g, '')}`}>
                                            {portfolio.risk}
                                        </span>
                                        <span className="apv-return-tag">{portfolio.return}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence>
                        {selectedForComparison.length > 0 && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="apv-panel apv-details-panel"
                                >
                                    <div className="apv-panel-header">
                                        <h3><BarChart3 size={20} /> Portfolio Details ({selectedForComparison.length})</h3>
                                        <button onClick={() => setSelectedForComparison([])} className="apv-clear-btn">
                                            Clear All
                                        </button>
                                    </div>
                                    <div className="apv-details-grid">
                                        {selectedForComparison.map((portfolio, idx) => (
                                            <div key={idx} className="apv-detail-card">
                                                <div className="apv-detail-header">
                                                    <h4>{portfolio.name}</h4>
                                                    <button onClick={() => toggleComparison(portfolio)} className="apv-remove-btn">
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                                <div className="apv-detail-metrics">
                                                    <div><span>Risk:</span><strong className={`risk-${portfolio.risk.toLowerCase().replace(/[- ]/g, '')}`}>{portfolio.risk}</strong></div>
                                                    <div><span>Return:</span><strong>{portfolio.return}</strong></div>
                                                    <div><span>Sharpe Ratio:</span><strong>{portfolio.sharpeRatio}</strong></div>
                                                    <div><span>Max Drawdown:</span><strong>{portfolio.maxDrawdown}</strong></div>
                                                    <div><span>Expense Ratio:</span><strong>{portfolio.expenseRatio}</strong></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="apv-panel apv-chart-panel"
                                >
                                    <h3><TrendingUp size={20} /> Performance Comparison Over Time</h3>
                                    <div className="apv-line-chart">
                                        <svg viewBox="0 0 800 400" className="apv-chart-svg">
                                            <line x1="60" y1="350" x2="750" y2="350" stroke="var(--color-border-primary)" strokeWidth="2" />
                                            <line x1="60" y1="50" x2="60" y2="350" stroke="var(--color-border-primary)" strokeWidth="2" />
                                            {selectedForComparison.map((portfolio, idx) => {
                                                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                                                const perfData = generatePerformanceData(portfolio);
                                                const points = perfData.map((val, i) => {
                                                    const x = 60 + (i * 60);
                                                    const y = 350 - (val * 25);
                                                    return `${x},${y}`;
                                                }).join(' ');
                                                return <polyline key={idx} points={points} fill="none" stroke={colors[idx]} strokeWidth="3" />;
                                            })}
                                        </svg>
                                        <div className="apv-chart-labels">
                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, i) => (
                                                <span key={i}>{month}</span>
                                            ))}
                                        </div>
                                        <div className="apv-chart-legend">
                                            {selectedForComparison.map((portfolio, idx) => {
                                                const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                                                return (
                                                    <div key={idx} className="apv-legend-item">
                                                        <span className="apv-legend-line" style={{background: colors[idx]}}></span>
                                                        <span>{portfolio.name}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="apv-panel apv-distribution-panel"
                                >
                                    <h3><PieChart size={20} /> Asset Distribution Comparison</h3>
                                    <div className="apv-distribution-grid">
                                        {selectedForComparison.map((portfolio, idx) => (
                                            <div key={idx} className="apv-distribution-card">
                                                <h4>{portfolio.name}</h4>
                                                <svg viewBox="0 0 200 200" className="apv-pie-svg">
                                                    <circle cx="100" cy="100" r="80" fill="none" stroke="#3b82f6" strokeWidth="40" strokeDasharray={`${portfolio.stocks * 5.03} 502.4`} transform="rotate(-90 100 100)" />
                                                    <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" strokeWidth="40" strokeDasharray={`${portfolio.bonds * 5.03} 502.4`} strokeDashoffset={`-${portfolio.stocks * 5.03}`} transform="rotate(-90 100 100)" />
                                                    <circle cx="100" cy="100" r="80" fill="none" stroke="#f59e0b" strokeWidth="40" strokeDasharray={`${portfolio.cash * 5.03} 502.4`} strokeDashoffset={`-${(portfolio.stocks + portfolio.bonds) * 5.03}`} transform="rotate(-90 100 100)" />
                                                </svg>
                                                <div className="apv-distribution-legend">
                                                    <div><span className="apv-legend-dot stocks"></span> Stocks {portfolio.stocks}%</div>
                                                    <div><span className="apv-legend-dot bonds"></span> Bonds {portfolio.bonds}%</div>
                                                    <div><span className="apv-legend-dot cash"></span> Cash {portfolio.cash}%</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>

                <div className="apv-chat-panel">
                    <div className="apv-chat-header">
                        <MessageSquare size={18} />
                        <span>AI Portfolio Assistant</span>
                    </div>
                    <div className="apv-chat-messages">
                        {chatMessages.map((msg, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`apv-chat-message ${msg.role}`}
                            >
                                {msg.role === 'assistant' && <Sparkles size={14} />}
                                <span>{msg.content}</span>
                            </motion.div>
                        ))}
                        {isTyping && (
                            <div className="apv-chat-message assistant typing">
                                <Sparkles size={14} />
                                <span className="apv-typing-dots">
                                    <span></span><span></span><span></span>
                                </span>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                    <form onSubmit={handleChatSubmit} className="apv-chat-input-form">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Ask about portfolios..."
                            className="apv-chat-input"
                        />
                        <button type="submit" className="apv-chat-send">
                            <Send size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdvancedPortfolioView;
