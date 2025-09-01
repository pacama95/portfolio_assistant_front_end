import { TrendingUp, TrendingDown, PieChart } from 'lucide-react';
import { Cell, PieChart as RechartsPieChart, Pie, ResponsiveContainer, Tooltip } from 'recharts';
import { useActivePortfolioSummary, useActivePositions } from '../hooks/useApi';
import { formatCurrency, formatPercentage, getGainLossColor, getGainLossBgColor, getGainLossSign, generateChartColors } from '../utils/format';
import { PositionsGrid } from './PositionsGrid';

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: number;
  className?: string;
}

const MetricCard = ({ title, value, subtitle, trend, className = '' }: MetricCardProps) => {
  const trendColor = trend !== undefined ? getGainLossColor(trend) : '';
  const bgColor = trend !== undefined ? getGainLossBgColor(trend) : 'bg-white border-gray-200';
  
  return (
    <div className={`p-4 rounded-lg border ${bgColor} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <div className="flex items-center mt-1">
              {trend !== undefined && trend !== 0 && (
                <>
                  {trend > 0 ? (
                    <TrendingUp className="h-4 w-4 mr-1 text-profit-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 mr-1 text-loss-600" />
                  )}
                </>
              )}
              <p className={`text-sm font-medium ${trendColor}`}>
                {getGainLossSign(trend || 0)}{subtitle}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface ChartData {
  name: string;
  value: number;
  ticker: string;
  percentage: number;
}

const PortfolioChart = () => {
  const { data: positions, isLoading } = useActivePositions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <PieChart className="h-12 w-12 mb-2" />
        <p>No positions available</p>
      </div>
    );
  }

  const totalValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
  
  const chartData: ChartData[] = positions.map(position => ({
    name: position.ticker,
    value: position.marketValue,
    ticker: position.ticker,
    percentage: (position.marketValue / totalValue) * 100,
  }));

  const colors = generateChartColors(chartData.length);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ ticker, percentage }) => `${ticker} ${percentage.toFixed(1)}%`}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value: number, _name: string, props: any) => [
              formatCurrency(value),
              props.payload.ticker
            ]}
            labelFormatter={() => ''}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PortfolioSummary = () => {
  const { data: summary, isLoading, error } = useActivePortfolioSummary();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-20 rounded-lg"></div>
            </div>
          ))}
        </div>
        <div className="bg-gray-200 h-64 rounded-lg animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Failed to load portfolio data</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Total Value"
          value={formatCurrency(summary.totalMarketValue)}
          className="col-span-2 md:col-span-1"
        />
        
        <MetricCard
          title="Total Cost"
          value={formatCurrency(summary.totalCost)}
          className="col-span-2 md:col-span-1"
        />
        
        <MetricCard
          title="Gain/Loss"
          value={formatCurrency(Math.abs(summary.totalUnrealizedGainLoss))}
          subtitle={formatPercentage(summary.totalUnrealizedGainLossPercentage)}
          trend={summary.totalUnrealizedGainLoss}
          className="col-span-2 md:col-span-1"
        />
        
        <MetricCard
          title="Positions"
          value={`${summary.activePositions}`}
          subtitle={`of ${summary.totalPositions} total`}
          className="col-span-2 md:col-span-1"
        />
      </div>

      {/* Portfolio Allocation Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Allocation</h2>
        <PortfolioChart />
      </div>

      {/* Position Details Grid */}
      <PositionsGrid />
    </div>
  );
};
