import PieChart from '../charts/PieChart';
import { formatPercent, formatCurrency } from '../../utils/formatters';
import './AllocationSection.css';

const AllocationSection = ({ data }) => {
  const { allocation_table, chart_data } = data;

  return (
    <div className="allocation-section">
      <div className="allocation-content">
        {/* Allocation Table */}
        <div className="allocation-table-container">
          <table className="allocation-table">
            <thead>
              <tr>
                <th>Asset Class</th>
                <th>Portfolio %</th>
                <th>Market Value</th>
                <th>Target %</th>
                <th>Drift</th>
              </tr>
            </thead>
            <tbody>
              {allocation_table.map((item, idx) => (
                <tr key={idx}>
                  <td><strong>{item.asset_class}</strong></td>
                  <td>{formatPercent(item.portfolio_pct, 2, false)}</td>
                  <td>{formatCurrency(item.market_value)}</td>
                  <td>{formatPercent(item.target_pct, 2, false)}</td>
                  <td className={item.drift > 0 ? 'positive' : item.drift < 0 ? 'negative' : ''}>
                    {item.drift !== 0 ? formatPercent(item.drift) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="table-note">
            Drift represents the difference between current and target allocation. 
            Minor drift will be addressed at the next scheduled rebalance.
          </p>
        </div>

        {/* Pie Chart */}
        {chart_data && (
          <div className="chart-container">
            <PieChart config={chart_data} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AllocationSection;
