import BarChart from '../charts/BarChart';
import { formatPercent, formatCurrency } from '../../utils/formatters';
import { formatText } from '../../utils/textFormatter.jsx';
import './PerformanceSection.css';

const PerformanceSection = ({ data }) => {
  if (!data) return null;
  
  const { performance_table, account_table, chart_data, benchmark_name, executive_highlights } = data;

  // Safe format — handle null/undefined from failed period calculations
  const safePercent = (val) => formatPercent(val ?? 0);

  return (
    <div className="performance-section">
      {/* Executive Highlights */}
      {executive_highlights && executive_highlights.length > 0 && (
        <div className="executive-highlights">
          <ul>
            {executive_highlights.map((highlight, idx) => (
              <li key={idx} dangerouslySetInnerHTML={{ __html: formatText(highlight) }} />
            ))}
          </ul>
        </div>
      )}

      {/* Performance Table */}
      {performance_table && performance_table.periods && (
      <div className="performance-table-container">
        <table className="performance-table">
          <thead>
            <tr>
              <th></th>
              {performance_table.periods.map((period, idx) => (
                <th key={idx}>{period}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Portfolio (Net of Fees)</strong></td>
              {performance_table.portfolio.map((val, idx) => (
                <td key={idx}>{safePercent(val)}</td>
              ))}
            </tr>
            <tr>
              <td><strong>{benchmark_name || 'S&P 500'} Index</strong></td>
              {performance_table.benchmark.map((val, idx) => (
                <td key={idx}>{safePercent(val)}</td>
              ))}
            </tr>
            <tr className="difference-row">
              <td><strong>+/- vs Benchmark</strong></td>
              {performance_table.difference.map((val, idx) => (
                <td key={idx} className={(val ?? 0) >= 0 ? 'positive' : 'negative'}>
                  {safePercent(val)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        <p className="table-note">
          Returns for periods greater than one year are annualized. Net of advisory fees. 
          Benchmark: {benchmark_name || 'S&P 500'} Total Return Index.
        </p>
      </div>
      )}

      {/* Account Performance Table */}
      {account_table && account_table.accounts && (
        <div className="account-table-container">
          <h4>Performance by Account</h4>
          <table className="account-table">
            <thead>
              <tr>
                <th>Account</th>
                <th>Type</th>
                <th>Mkt Value</th>
                <th>QTD</th>
                <th>YTD</th>
                <th>Benchmark</th>
              </tr>
            </thead>
            <tbody>
              {account_table.accounts.map((acc, idx) => (
                <tr key={idx} className={acc.name === 'Total' ? 'total-row' : ''}>
                  <td><strong>{acc.name}</strong></td>
                  <td>{acc.type}</td>
                  <td>{formatCurrency(acc.value)}</td>
                  <td>{safePercent(acc.qtd)}</td>
                  <td>{safePercent(acc.ytd)}</td>
                  <td>{acc.benchmark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Chart */}
      {chart_data && (
        <div className="chart-container">
          <BarChart config={chart_data} />
        </div>
      )}
    </div>
  );
};

export default PerformanceSection;
