import { ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { formatCurrency, formatPercent } from '../utils/helpers';
import AIBadge from './AIBadge';
import './UniversalCard.css';

const UniversalCard = ({ type, data, className = '' }) => {
  const renderContent = () => {
    switch (type) {
      case 'metric':
        return (
          <div className="ucard__metric">
            {data.icon && <div className="ucard__icon">{data.icon}</div>}
            <div className="ucard__metric-content">
              <span className="ucard__label">{data.label}</span>
              <div className="ucard__metric-row">
                <div className="ucard__metric-item">
                  <span className="ucard__metric-sublabel">Total Clients</span>
                  <span className="ucard__value">{data.clients}</span>
                </div>
                <div className="ucard__metric-divider"></div>
                <div className="ucard__metric-item">
                  <span className="ucard__metric-sublabel">AUM</span>
                  <div className="ucard__value-row">
                    <span className="ucard__value">{data.aum}</span>
                    {data.change !== undefined && (
                      <span className={`ucard__change ${data.change >= 0 ? 'ucard__change--up' : 'ucard__change--down'}`}>
                        {data.change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {Math.abs(data.change)}%
                      </span>
                    )}
                  </div>
                </div>
                <div className="ucard__metric-divider"></div>
                <div className="ucard__metric-item">
                  <span className="ucard__metric-sublabel">Tax Losses</span>
                  <span className="ucard__value-sm">{data.taxLosses}</span>
                </div>
                <div className="ucard__metric-divider"></div>
                <div className="ucard__metric-item">
                  <span className="ucard__metric-sublabel">RMD 2025</span>
                  <span className="ucard__value-sm">{data.rmd}</span>
                </div>
                <div className="ucard__metric-divider"></div>
                <div className="ucard__metric-item">
                  <span className="ucard__metric-sublabel">Distribution YTD</span>
                  <span className="ucard__value-sm">{data.distribution}</span>
                </div>
                <div className="ucard__metric-divider"></div>
                <div className="ucard__metric-item">
                  <span className="ucard__metric-sublabel">Cash in Hand</span>
                  <span className="ucard__value-sm">{data.cashInHand}</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'chart':
        return (
          <div className="ucard__chart">
            <div className="ucard__chart-header">
              <h3 className="ucard__title">{data.title}</h3>
              <div className="ucard__chart-meta">
                {data.metrics && (
                  <div className="ucard__chart-metrics">
                    <div className="ucard__chart-metric">
                      <span className="ucard__chart-metric-label">Clients</span>
                      <span className="ucard__chart-metric-value">{data.metrics.clients}</span>
                    </div>
                    <div className="ucard__chart-metric">
                      <span className="ucard__chart-metric-label">AUM</span>
                      <span className="ucard__chart-metric-value">{data.metrics.aum}</span>
                    </div>
                    <div className="ucard__chart-metric">
                      <span className="ucard__chart-metric-label">Change</span>
                      <span className={`ucard__chart-metric-value ${(data.chartOptions.percentageChange || data.metrics.change) >= 0 ? 'ucard__chart-metric-value--up' : 'ucard__chart-metric-value--down'}`}>
                        {(data.chartOptions.percentageChange || data.metrics.change) >= 0 ? '+' : ''}{data.chartOptions.percentageChange || data.metrics.change}%
                      </span>
                    </div>
                  </div>
                )}
                <div className="ucard__chart-controls">
                  {data.ranges?.map((range) => (
                    <button
                      key={range}
                      className={`ucard__range-btn ${data.activeRange === range ? 'ucard__range-btn--active' : ''}`}
                      onClick={() => data.onRangeChange?.(range)}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <HighchartsReact highcharts={Highcharts} options={data.chartOptions} />
          </div>
        );

      case 'action-list':
        return (
          <div className="ucard__action-list" onClick={data.onClick}>
            <div className="ucard__action-list-header">
              {data.icon && <div className="ucard__action-list-icon">{data.icon}</div>}
              <div className="ucard__action-list-info">
                <h4 className="ucard__action-list-name">{data.name}</h4>
                <p className="ucard__action-list-clients">{data.clients}</p>
              </div>
            </div>
            <button className="ucard__action-list-btn">
              <ArrowRight size={18} />
            </button>
            <AIBadge size="sm" />
          </div>
        );

      case 'agent':
        return (
          <div className="ucard__agent" onClick={data.onClick}>
            <div className="ucard__agent-header">
              <div className="ucard__agent-info">
                {data.icon && <div className="ucard__agent-icon">{data.icon}</div>}
                <div>
                  <h4 className="ucard__agent-name">{data.name}</h4>
                  {data.label && <p className="ucard__agent-label">{data.label}</p>}
                </div>
              </div>
              <div className={`ucard__priority ucard__priority--${data.priority}`}>
                {data.priority}
              </div>
            </div>
            {data.description && <p className="ucard__agent-desc">{data.description}</p>}
            {data.linkText && <span className="ucard__agent-link">{data.linkText}</span>}
            {data.clientsNeedingAction && (
              <div className="ucard__agent-stats">
                <div className="ucard__agent-stat">
                  <span className="ucard__agent-stat-value">{data.clientsNeedingAction}</span>
                  <span className="ucard__agent-stat-label">Need Action</span>
                </div>
                {data.totalClients && (
                  <div className="ucard__agent-stat">
                    <span className="ucard__agent-stat-value">{data.totalClients}</span>
                    <span className="ucard__agent-stat-label">Total Clients</span>
                  </div>
                )}
              </div>
            )}
            <ArrowRight size={20} className="ucard__arrow" />
          </div>
        );

      case 'stat':
        return (
          <div className="ucard__stat">
            {data.icon && <div className="ucard__stat-icon">{data.icon}</div>}
            <span className="ucard__label">{data.label}</span>
            <span className="ucard__value">{data.type === 'currency' ? formatCurrency(data.value) : data.value}</span>
          </div>
        );

      case 'list':
        return (
          <div className="ucard__list">
            <div className="ucard__list-header">
              {data.icon && <div className="ucard__icon">{data.icon}</div>}
              <h3 className="ucard__title">{data.title}</h3>
            </div>
            <div className="ucard__list-header-badge">
              <AIBadge size="sm" />
            </div>
            <div className="ucard__list-items">
              {data.items?.map((item, index) => (
                <div 
                  key={index} 
                  className={`ucard__list-item ${item.onClick ? 'ucard__list-item--clickable' : ''}`}
                  onClick={item.onClick && data.onItemClick ? () => data.onItemClick(item.onClick()) : undefined}
                  data-completed={item.isCompleted || undefined}
                >
                  {item.dot && <div className="ucard__dot" style={{ backgroundColor: item.dotColor }} />}
                  <div className="ucard__list-item-content">
                    <p className="ucard__list-text">{item.text}</p>
                    {item.subtext && <span className="ucard__list-subtext">{item.subtext}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`universal-card universal-card--${type} ${className}`} data-priority={data?.priority}>
      {renderContent()}
    </div>
  );
};

export default UniversalCard;
