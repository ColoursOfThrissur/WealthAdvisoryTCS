import BentoGrid, { BentoItem } from '../components/BentoGrid';
import MorningNoteCard from '../components/MorningNoteCard';

const Dashboard = () => {
  console.log('Dashboard rendering');
  return (
    <BentoGrid>
      <BentoItem span={2}>
        <MorningNoteCard />
      </BentoItem>
    </BentoGrid>
  );
};

export default Dashboard;
