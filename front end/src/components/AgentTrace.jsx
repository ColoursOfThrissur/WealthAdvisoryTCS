import { useEffect, useState, useRef } from 'react';
import { CheckCircle2, Loader2, Bot, Search, UserCheck, Rocket,
  ClipboardList, TrendingUp, PieChart, Briefcase,
  Newspaper, ArrowLeftRight, CalendarCheck, FileText
} from 'lucide-react';
import './AgentTrace.css';

const STEP_MAP = {
  'Understanding your request': { label: 'Analyzing your request', Icon: Search },
  'Starting report generation': { label: 'Preparing client report', Icon: Rocket },
  'Parsing portfolio file and extracting holdings': { label: 'Reading portfolio holdings', Icon: ClipboardList },
  'Calculating performance metrics and returns': { label: 'Evaluating portfolio returns', Icon: TrendingUp },
  'Analyzing asset allocation and diversification': { label: 'Reviewing asset allocation', Icon: PieChart },
  'Processing individual holdings and positions': { label: 'Assessing individual positions', Icon: Briefcase },
  'Fetching market news and generating commentary': { label: 'Gathering market insights', Icon: Newspaper },
  'Analyzing transactions, dividends, and fees': { label: 'Reviewing account activity', Icon: ArrowLeftRight },
  'Generating planning recommendations': { label: 'Building advisory recommendations', Icon: CalendarCheck },
  'Assembling final PDF report': { label: 'Compiling final report', Icon: FileText },
};

function resolveStep(msg) {
  // Exact match first
  if (STEP_MAP[msg]) return STEP_MAP[msg];
  // Prefix match for dynamic messages like "Loading portfolio for Sarah Mitchell"
  if (msg.startsWith('Loading portfolio')) return { label: 'Retrieving client portfolio', Icon: UserCheck };
  return { label: msg, Icon: Circle };
}

const AgentTrace = ({ statusHistory = [], isProcessing, researchMode }) => {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isProcessing) {
      if (!startRef.current) startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      startRef.current = null;
      setElapsed(0);
    }
    return () => clearInterval(timerRef.current);
  }, [isProcessing]);

  // Get the latest status
  const current = researchMode
    ? { label: 'Researching', Icon: Search }
    : statusHistory.length > 0 ? resolveStep(statusHistory[statusHistory.length - 1]) : null;

  if (!isProcessing && !current) return null;

  const done = !isProcessing;
  const formatTime = (s) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
  const StepIcon = current?.Icon || Bot;
  const label = current?.label || 'Initializing';

  return (
    <div className={`agent-trace-v2 ${done ? 'finishing' : ''}`}>
      <div className="trace-step active">
        <div className="trace-status-icon">
          {done ? <CheckCircle2 size={14} /> : <Loader2 size={14} className="spinning" />}
        </div>
        <div className="trace-step-icon">
          <StepIcon size={14} />
        </div>
        <span className="trace-step-label">{done ? 'Complete' : label}</span>
        {isProcessing && elapsed > 0 && (
          <span className="trace-timer">{formatTime(elapsed)}</span>
        )}
      </div>
    </div>
  );
};

export default AgentTrace;
