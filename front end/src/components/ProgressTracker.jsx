import './ProgressTracker.css';

const SECTIONS = [
  { id: 1, name: 'Parameters', icon: 'settings' },
  { id: 2, name: 'Performance', icon: 'trending_up' },
  { id: 3, name: 'Allocation', icon: 'pie_chart' },
  { id: 4, name: 'Holdings', icon: 'account_balance_wallet' },
  { id: 5, name: 'Commentary', icon: 'article' },
  { id: 6, name: 'Activity', icon: 'receipt' },
  { id: 7, name: 'Planning', icon: 'lightbulb' },
  { id: 8, name: 'Output', icon: 'description' }
];

const ProgressTracker = ({ progress }) => {
  if (!progress) return null;

  const { completed_steps, total_steps, percentage } = progress;

  return (
    <div className="progress-tracker">
      <div className="progress-header">
        <h3>Report Progress</h3>
        <span className="progress-percentage">{percentage}%</span>
      </div>
      
      <div className="progress-bar-container">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      <div className="progress-sections">
        {SECTIONS.map((section) => {
          const isCompleted = progress.completed_sections?.includes(section.name.toLowerCase());
          
          return (
            <div 
              key={section.id} 
              className={`progress-section ${isCompleted ? 'completed' : ''}`}
            >
              <i className="material-icons">{section.icon}</i>
              <span>{section.name}</span>
            </div>
          );
        })}
      </div>

      <div className="progress-summary">
        {completed_steps} of {total_steps} sections complete
      </div>
    </div>
  );
};

export default ProgressTracker;
