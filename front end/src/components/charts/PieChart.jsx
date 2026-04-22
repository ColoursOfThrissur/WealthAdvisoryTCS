import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const PieChart = ({ config }) => {
  const defaultOptions = {
    chart: { type: 'pie', height: 350 },
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  const options = { ...defaultOptions, ...config };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default PieChart;
