import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarIcon, TrendingUpIcon, DollarSignIcon } from 'lucide-react';
import { portfolioApi, dividendsApi } from '../api/client';
import type { DividendResponse, DividendSearchParams } from '../types/api';
import { formatCurrency, formatDate } from '../utils/format';

interface DividendCardProps {
  ticker: string;
  dividends: DividendResponse[];
  totalDividends: number;
  latestDividend: DividendResponse | null;
}

const DividendCard: React.FC<DividendCardProps> = ({ ticker, dividends, totalDividends, latestDividend }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">{ticker}</h3>
        <div className="flex items-center text-green-600">
          <DollarSignIcon className="h-5 w-5 mr-1" />
          <span className="font-semibold">{formatCurrency(totalDividends)}</span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{dividends.length}</div>
          <div className="text-sm text-gray-600">Payments</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">{formatCurrency(totalDividends / dividends.length)}</div>
          <div className="text-sm text-gray-600">Avg Payment</div>
        </div>
      </div>

      {latestDividend && (
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Latest Payment:</span>
            <span className="font-medium">{formatCurrency(latestDividend.amount)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Ex-Date:</span>
            <span className="font-medium">{formatDate(latestDividend.exDate)}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600">Exchange:</span>
            <span className="font-medium">{latestDividend.exchange}</span>
          </div>
        </div>
      )}

      <div className="mt-4">
        <details className="group">
          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All Payments ({dividends.length})
          </summary>
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {dividends.map((dividend, index) => (
              <div key={index} className="flex justify-between items-center text-sm border-b border-gray-100 pb-1">
                <span className="text-gray-600">{formatDate(dividend.exDate)}</span>
                <span className="font-medium">{formatCurrency(dividend.amount)}</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
};

const DateRangeSelector: React.FC<{
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
}> = ({ startDate, endDate, onStartDateChange, onEndDateChange }) => {
  return (
    <div className="flex items-center space-x-4 mb-6">
      <div className="flex items-center space-x-2">
        <CalendarIcon className="h-5 w-5 text-gray-500" />
        <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
          From:
        </label>
        <input
          type="date"
          id="startDate"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex items-center space-x-2">
        <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
          To:
        </label>
        <input
          type="date"
          id="endDate"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
};

const Dividends: React.FC = () => {
  // Default to current year
  const currentYear = new Date().getFullYear();
  const [startDate, setStartDate] = useState(`${currentYear}-01-01`);
  const [endDate, setEndDate] = useState(`${currentYear}-12-31`);

  const searchParams: DividendSearchParams = {
    startDate,
    endDate,
  };

  // First get portfolio positions to know which tickers to fetch dividends for
  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ['active-positions'],
    queryFn: () => portfolioApi.getActivePositions(),
  });

  const { data: dividendsData, isLoading: dividendsLoading, error } = useQuery({
    queryKey: ['new-dividends', searchParams, positions?.map(p => p.ticker)],
    queryFn: async () => {
      if (!positions || positions.length === 0) return {};

      const dividendPromises = positions.map(async (position) => {
        try {
          const response = await dividendsApi.getDividends({
            symbol: position.ticker,
            sources: 'yahoo'
          });
          
          // Transform DividendEntry to DividendResponse format and filter by date range
          const transformedDividends = response.dividends
            .filter((dividend) => {
              const exDate = new Date(dividend.ex_date);
              const start = new Date(startDate);
              const end = new Date(endDate);
              return exDate >= start && exDate <= end;
            })
            .map((dividend): DividendResponse => ({
              symbol: dividend.symbol,
              micCode: '', // Not available in new API
              exchange: '', // Not available in new API  
              exDate: dividend.ex_date,
              amount: dividend.amount,
            }));

          return { ticker: position.ticker, dividends: transformedDividends };
        } catch (error) {
          console.warn(`Failed to fetch dividends for ${position.ticker}:`, error);
          return { ticker: position.ticker, dividends: [] };
        }
      });

      const results = await Promise.all(dividendPromises);
      
      // Convert to the expected format: Record<string, DividendResponse[]>
      const dividendsByTicker: Record<string, DividendResponse[]> = {};
      results.forEach(({ ticker, dividends }) => {
        if (dividends.length > 0) {
          dividendsByTicker[ticker] = dividends;
        }
      });

      return dividendsByTicker;
    },
    enabled: !!startDate && !!endDate && !!positions && positions.length > 0,
  });

  const processedData = useMemo(() => {
    if (!dividendsData) return [];

    return Object.entries(dividendsData).map(([ticker, dividends]) => {
      const totalDividends = dividends.reduce((sum, div) => sum + div.amount, 0);
      const latestDividend = dividends.length > 0 
        ? dividends.reduce((latest, current) => 
            new Date(current.exDate) > new Date(latest.exDate) ? current : latest
          )
        : null;

      return {
        ticker,
        dividends,
        totalDividends,
        latestDividend,
      };
    }).sort((a, b) => b.totalDividends - a.totalDividends);
  }, [dividendsData]);

  const totalPortfolioDividends = useMemo(() => {
    return processedData.reduce((sum, item) => sum + item.totalDividends, 0);
  }, [processedData]);

  const totalPayments = useMemo(() => {
    return processedData.reduce((sum, item) => sum + item.dividends.length, 0);
  }, [processedData]);

  const isLoading = positionsLoading || dividendsLoading;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-red-800 font-medium">Error loading dividends</h3>
          <p className="text-red-600 text-sm mt-1">
            {error instanceof Error ? error.message : 'Failed to load dividend data'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dividend History</h1>
        <p className="text-gray-600">Track dividend payments across your portfolio</p>
      </div>

      <DateRangeSelector
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Dividends</p>
              <p className="text-3xl font-bold">{formatCurrency(totalPortfolioDividends)}</p>
            </div>
            <DollarSignIcon className="h-12 w-12 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Payments</p>
              <p className="text-3xl font-bold">{totalPayments}</p>
            </div>
            <TrendingUpIcon className="h-12 w-12 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg per Payment</p>
              <p className="text-3xl font-bold">
                {totalPayments > 0 ? formatCurrency(totalPortfolioDividends / totalPayments) : formatCurrency(0)}
              </p>
            </div>
            <CalendarIcon className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Dividend Cards */}
      {processedData.length === 0 ? (
        <div className="text-center py-12">
          <DollarSignIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No dividends found</h3>
          <p className="text-gray-600">
            No dividend payments found for the selected date range.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedData.map((item) => (
            <DividendCard
              key={item.ticker}
              ticker={item.ticker}
              dividends={item.dividends}
              totalDividends={item.totalDividends}
              latestDividend={item.latestDividend}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dividends;
