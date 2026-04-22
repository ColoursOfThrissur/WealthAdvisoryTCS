import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import PerformanceSection from './sections/PerformanceSection';
import AllocationSection from './sections/AllocationSection';
import { FormattedText } from '../utils/textFormatter.jsx';
import apiService from '../services/apiService';
import './SectionResult.css';

const SectionResult = ({ section, data }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!data) return null;

  const getSectionTitle = () => {
    const titles = {
      'performance_summary': 'Performance Summary',
      'allocation_overview': 'Allocation Overview',
      'holdings_detail': 'Holdings Detail',
      'market_commentary': 'Market Commentary',
      'activity_summary': 'Activity Summary',
      'planning_notes': 'Planning Notes',
      'output': 'Report Output'
    };
    return titles[section] || section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderPerformance = () => (
    <div className="section-data">
      {data.portfolio_value && (
        <div className="metric-card">
          <span className="metric-label">Portfolio Value</span>
          <span className="metric-value">${data.portfolio_value.toLocaleString()}</span>
        </div>
      )}
      {data.metrics && (
        <div className="metrics-grid">
          {Object.entries(data.metrics).map(([key, value]) => (
            <div key={key} className="metric-item">
              <span className="metric-key">{key.replace(/_/g, ' ')}</span>
              <span className="metric-val">{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAllocation = () => (
    <div className="section-data">
      {data.allocation_table && (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                {Object.keys(data.allocation_table[0] || {}).map(key => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.allocation_table.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i}>{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderHoldings = () => (
    <div className="section-data">
      {data.total_positions && (
        <div className="info-badge">
          Total Positions: {data.total_positions}
        </div>
      )}
      {data.holdings_table && (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Security</th>
                <th>Name</th>
                <th>Shares</th>
                <th>Price</th>
                <th>Value</th>
                <th>% Port</th>
                <th>QTD Return</th>
              </tr>
            </thead>
            <tbody>
              {data.holdings_table.slice(0, 10).map((h, idx) => (
                <tr key={idx}>
                  <td><strong>{h.security}</strong></td>
                  <td>{h.name}</td>
                  <td>{h.shares.toLocaleString()}</td>
                  <td>${h.price.toFixed(2)}</td>
                  <td>${h.value.toLocaleString(undefined, {maximumFractionDigits: 0})}</td>
                  <td>{h.percentage.toFixed(1)}%</td>
                  <td className={h.qtd_return >= 0 ? 'positive' : 'negative'}>
                    {h.qtd_return >= 0 ? '+' : ''}{h.qtd_return.toFixed(2)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.holdings_table.length > 10 && (
            <p className="table-note">Showing 10 of {data.holdings_table.length} holdings</p>
          )}
        </div>
      )}
    </div>
  );

  const renderCommentary = () => (
    <div className="section-data commentary-section">
      {data.market_summary && (
        <div className="commentary-block">
          <FormattedText text={data.market_summary} />
        </div>
      )}
      {data.portfolio_impact && (
        <div className="commentary-block">
          <FormattedText text={data.portfolio_impact} />
        </div>
      )}
      {data.outlook && (
        <div className="commentary-block">
          <FormattedText text={data.outlook} />
        </div>
      )}
    </div>
  );

  const renderActivity = () => (
    <div className="section-data">
      {data.transaction_table && data.transaction_table.length > 0 && (
        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.transaction_table.map((txn, idx) => {
                const txnType = txn.type.toLowerCase();
                const isContribution = txnType.includes('contribution') || txnType.includes('deposit');
                const isFee = txnType.includes('fee') || txnType.includes('charge');
                const showSign = isContribution || isFee;
                
                return (
                  <tr key={idx}>
                    <td>{txn.date}</td>
                    <td>{txn.type}</td>
                    <td>{txn.description}</td>
                    <td>{txn.quantity || '—'}</td>
                    <td className={showSign ? (isContribution ? 'positive' : 'negative') : ''}>
                      {showSign ? (isContribution ? '+' : '-') : ''}${Math.abs(txn.amount).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {(data.net_contributions || data.total_dividends || data.realized_gains_losses || data.total_fees) && (
        <div className="activity-summary-boxes">
          {data.net_contributions !== undefined && data.net_contributions !== 0 && (
            <div className="activity-summary-box">
              <div className="activity-summary-value">{data.net_contributions > 0 ? '+' : ''}${data.net_contributions.toLocaleString()}</div>
              <div className="activity-summary-label">Net Contributions</div>
            </div>
          )}
          {data.total_dividends !== undefined && data.total_dividends !== 0 && (
            <div className="activity-summary-box">
              <div className="activity-summary-value">+${data.total_dividends.toLocaleString()}</div>
              <div className="activity-summary-label">Dividends & Income</div>
            </div>
          )}
          {data.realized_gains_losses !== undefined && data.realized_gains_losses !== 0 && (
            <div className="activity-summary-box">
              <div className="activity-summary-value">{data.realized_gains_losses > 0 ? '+' : ''}${data.realized_gains_losses.toLocaleString()}</div>
              <div className="activity-summary-label">Realized Gains/Losses</div>
            </div>
          )}
          {data.total_fees !== undefined && data.total_fees !== 0 && (
            <div className="activity-summary-box">
              <div className="activity-summary-value">-${data.total_fees.toLocaleString()}</div>
              <div className="activity-summary-label">Advisory Fees Paid</div>
            </div>
          )}
        </div>
      )}
      {data.summary && (
        <div className="activity-summary">
          <FormattedText text={data.summary} />
        </div>
      )}
    </div>
  );

  const renderPlanning = () => (
    <div className="section-data planning-section">
      {data.recommendations && (
        <div className="planning-recommendations">
          <FormattedText text={data.recommendations} />
        </div>
      )}
      {data.action_items && data.action_items.length > 0 && (
        <div className="action-items">
          <ul>
            {data.action_items.map((item, idx) => (
              <li key={idx}><FormattedText text={item} /></li>
            ))}
          </ul>
        </div>
      )}
      {data.next_review && (
        <div className="next-review">
          <p><strong>Next Review:</strong> {data.next_review}</p>
        </div>
      )}
    </div>
  );

  const renderOutput = () => (
    <div className="section-data output-section">
      {data.pdf_path && (
        <div className="pdf-success">
          <p>{data.message}</p>
          <a 
            href={apiService.getDownloadUrl(data.pdf_path.split(/[\/\\]/).pop())}
            download
            className="pdf-download-btn"
            target="_blank"
            rel="noopener noreferrer"
          >
            Download PDF Report
          </a>
        </div>
      )}
      {data.summary && (
        <p className="report-summary">{data.summary}</p>
      )}
    </div>
  );

  const renderDefault = () => (
    <div className="section-data">
      <pre className="json-preview">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );

  const renderContent = () => {
    switch(section) {
      case 'performance_summary':
        return <PerformanceSection data={data} />;
      case 'allocation_overview':
        return <AllocationSection data={data} />;
      case 'holdings_detail':
        return renderHoldings();
      case 'market_commentary':
        return renderCommentary();
      case 'activity_summary':
        return renderActivity();
      case 'planning_notes':
        return renderPlanning();
      case 'output':
        return renderOutput();
      case 'performance':
        return renderPerformance();
      case 'allocation':
        return renderAllocation();
      case 'holdings':
        return renderHoldings();
      case 'commentary':
        return renderCommentary();
      default:
        return renderDefault();
    }
  };

  return (
    <div className="section-result">
      <div className="section-result-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h4>{getSectionTitle()}</h4>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </div>
      {isExpanded && (
        <div className="section-result-content">
          {renderContent()}
        </div>
      )}
    </div>
  );
};

export default SectionResult;
