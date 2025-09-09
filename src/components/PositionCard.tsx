import { TrendingUp, TrendingDown, RefreshCw, Eye } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { formatCurrency, formatNumber, getGainLossColor, getGainLossBgColor, getGainLossSign } from '../utils/format';
import { usePositionByTicker } from '../hooks/useApi';
import { portfolioApi } from '../api/client';
import { StockLogo } from './StockLogo';

interface PositionCardProps {
  ticker: string;
  onViewTransactions?: (ticker: string) => void;
}

export const PositionCard = ({ ticker, onViewTransactions }: PositionCardProps) => {
  const { data: position, isLoading, error } = usePositionByTicker(ticker);
  const queryClient = useQueryClient();

  const handleRefreshPosition = async () => {
    try {
      // Fetch updated data for this specific position only
      const updatedPosition = await portfolioApi.getPositionByTicker(ticker);
      
      // Update only this position's cache
      queryClient.setQueryData(['positions', 'ticker', ticker], updatedPosition);
      
      // Invalidate portfolio summary to update overall metrics
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    } catch (error) {
      console.error('Failed to refresh position:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 rounded"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !position) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="text-center text-gray-500">
          <p>Failed to load position data for {ticker}</p>
          <button
            onClick={handleRefreshPosition}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
  const gainLossColor = getGainLossColor(position.unrealizedGainLoss);
  const gainLossBg = getGainLossBgColor(position.unrealizedGainLoss);
  const isPositive = position.unrealizedGainLoss > 0;
  const isNeutral = position.unrealizedGainLoss === 0;

  return (
    <div className={`bg-white rounded-lg border-2 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
      isPositive ? 'border-profit-200 hover:border-profit-300' : 
      isNeutral ? 'border-gray-200 hover:border-gray-300' : 
      'border-loss-200 hover:border-loss-300'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        isPositive ? 'bg-profit-50 border-profit-100' : 
        isNeutral ? 'bg-gray-50 border-gray-100' : 
        'bg-loss-50 border-loss-100'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Stock Logo */}
            <StockLogo 
              ticker={position.ticker}
              size="md"
              fallbackClassName={
                isPositive ? 'bg-profit-600' : 
                isNeutral ? 'bg-gray-600' : 
                'bg-loss-600'
              }
            />
            <div>
              <h3 className="text-lg font-bold text-gray-900">{position.ticker}</h3>
              <p className="text-sm text-gray-600">{formatNumber(position.totalQuantity, 4)} shares</p>
            </div>
          </div>
          
          {/* Performance Icon */}
          <div className={`p-2 rounded-full ${
            isPositive ? 'bg-profit-100' : 
            isNeutral ? 'bg-gray-100' : 
            'bg-loss-100'
          }`}>
            {isPositive ? (
              <TrendingUp className="h-5 w-5 text-profit-600" />
            ) : isNeutral ? (
              <div className="h-5 w-5 bg-gray-400 rounded-full"></div>
            ) : (
              <TrendingDown className="h-5 w-5 text-loss-600" />
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-4">
        {/* Price Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Current Price</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(position.currentPrice)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg Cost</p>
            <p className="text-lg font-semibold text-gray-700">{formatCurrency(position.averagePrice)}</p>
          </div>
        </div>

        {/* Market Value */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Market Value</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(position.marketValue)}</p>
          <p className="text-sm text-gray-600">Total Cost: {formatCurrency(position.totalCost)}</p>
        </div>

        {/* Performance */}
        <div className={`rounded-lg p-3 border ${gainLossBg.replace('bg-', 'border-').replace('-50', '-200')}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Unrealized P&L</p>
              <p className={`text-lg font-bold ${gainLossColor}`}>
                {getGainLossSign(position.unrealizedGainLoss)}{formatCurrency(Math.abs(position.unrealizedGainLoss))}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-xl font-bold ${gainLossColor}`}>
                {getGainLossSign(position.unrealizedGainLossPercentage)}{position.unrealizedGainLossPercentage.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500">
                Since {new Date(position.lastUpdated).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2 pt-2 border-t border-gray-100">
                      <button
              onClick={handleRefreshPosition}
              className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </button>
          <button
            onClick={() => onViewTransactions?.(position.ticker)}
            className="flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
          >
            <Eye className="h-4 w-4 mr-1" />
            View Trades
          </button>
        </div>
      </div>

      {/* Status Indicator */}
      {!position.isActive && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
          <p className="text-xs text-yellow-700 font-medium">⚠️ Inactive Position</p>
        </div>
      )}
    </div>
  );
};
