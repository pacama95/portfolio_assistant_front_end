import { useState, useEffect } from 'react';
import { X, Filter, Calendar, DollarSign, FileText, RotateCcw } from 'lucide-react';
import type { TransactionType, Currency } from '../types/api';

export interface TransactionFilters {
  transactionType?: TransactionType;
  ticker?: string;
  currency?: Currency;
  dateFrom?: string;
  dateTo?: string;
}

interface TransactionFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: TransactionFilters) => void;
  currentFilters: TransactionFilters;
}

const transactionTypes: { value: TransactionType; label: string; color: string }[] = [
  { value: 'BUY', label: 'Buy', color: 'text-green-700 bg-green-100' },
  { value: 'SELL', label: 'Sell', color: 'text-red-700 bg-red-100' },
  { value: 'DIVIDEND', label: 'Dividend', color: 'text-blue-700 bg-blue-100' },
];

const currencies: Currency[] = ['USD', 'EUR', 'GBP', 'CAD', 'JPY'];

export const TransactionFiltersModal = ({ 
  isOpen, 
  onClose, 
  onApply, 
  currentFilters 
}: TransactionFiltersModalProps) => {
  const [filters, setFilters] = useState<TransactionFilters>(currentFilters);

  // Reset filters when modal opens
  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    const clearedFilters: TransactionFilters = {};
    setFilters(clearedFilters);
    onApply(clearedFilters);
    onClose();
  };

  const handleClose = () => {
    setFilters(currentFilters); // Reset to current filters on cancel
    onClose();
  };

  const updateFilter = (key: keyof TransactionFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  // Count active filters
  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 pt-20 pb-20 sm:p-4 sm:pt-4 sm:pb-4 z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Filter className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Filter Transactions</h2>
            {activeFiltersCount > 0 && (
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {activeFiltersCount} active
              </span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-6 space-y-6">
          {/* Transaction Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <FileText className="h-4 w-4 inline mr-1" />
              Transaction Type
            </label>
            <div className="space-y-2">
              <div>
                <input
                  type="radio"
                  id="type-all"
                  name="transactionType"
                  checked={!filters.transactionType}
                  onChange={() => updateFilter('transactionType', undefined)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="type-all" className="ml-2 text-sm text-gray-700">
                  All Types
                </label>
              </div>
              {transactionTypes.map((type) => (
                <div key={type.value}>
                  <input
                    type="radio"
                    id={`type-${type.value}`}
                    name="transactionType"
                    checked={filters.transactionType === type.value}
                    onChange={() => updateFilter('transactionType', type.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor={`type-${type.value}`} className="ml-2 text-sm text-gray-700">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${type.color}`}>
                      {type.label}
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Ticker */}
          <div>
            <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Ticker Symbol
            </label>
            <input
              type="text"
              id="ticker"
              value={filters.ticker || ''}
              onChange={(e) => updateFilter('ticker', e.target.value.toUpperCase())}
              placeholder="e.g., AAPL, GOOGL"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Currency */}
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Currency
            </label>
            <select
              id="currency"
              value={filters.currency || ''}
              onChange={(e) => updateFilter('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Currencies</option>
              {currencies.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                From Date
              </label>
              <input
                type="date"
                id="dateFrom"
                value={filters.dateFrom || ''}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="dateTo" className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                To Date
              </label>
              <input
                type="date"
                id="dateTo"
                value={filters.dateTo || ''}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Date Filters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Filters</label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const thirtyDaysAgo = new Date(today);
                  thirtyDaysAgo.setDate(today.getDate() - 30);
                  updateFilter('dateFrom', thirtyDaysAgo.toISOString().split('T')[0]);
                  updateFilter('dateTo', today.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Last 30 days
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const ninetyDaysAgo = new Date(today);
                  ninetyDaysAgo.setDate(today.getDate() - 90);
                  updateFilter('dateFrom', ninetyDaysAgo.toISOString().split('T')[0]);
                  updateFilter('dateTo', today.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Last 3 months
              </button>
              <button
                type="button"
                onClick={() => {
                  const today = new Date();
                  const oneYearAgo = new Date(today);
                  oneYearAgo.setFullYear(today.getFullYear() - 1);
                  updateFilter('dateFrom', oneYearAgo.toISOString().split('T')[0]);
                  updateFilter('dateTo', today.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Last year
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={activeFiltersCount === 0}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Clear All
          </button>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
