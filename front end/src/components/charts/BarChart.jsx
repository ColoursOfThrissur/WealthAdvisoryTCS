import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const BarChart = ({ config }) => {
  const defaultOptions = {
    chart: { type: 'column', height: 300 },
    credits: { enabled: false },
    exporting: { enabled: false }
  };

  const options = { ...defaultOptions, ...config };

  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default BarChart;
