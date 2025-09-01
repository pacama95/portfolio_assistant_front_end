import { PortfolioSummary } from '../components/PortfolioSummary';

export const Dashboard = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Overview of your portfolio performance and allocation
        </p>
      </div>
      
      <PortfolioSummary />
    </div>
  );
};
