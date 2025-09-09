import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Grid3X3, AlertCircle, ArrowUpDown, ChevronDown, Search, X } from 'lucide-react';
import { PositionCard } from './PositionCard';
import { useActivePositions } from '../hooks/useApi';
import { useLogoPreload } from '../hooks/useLogoPreload';
import type { PositionResponse } from '../types/api';

type SortOption = {
  value: string;
  label: string;
  sortFn: (a: PositionResponse, b: PositionResponse) => number;
};

const sortOptions: SortOption[] = [
  {
    value: 'marketValue-desc',
    label: 'Market Value (High to Low)',
    sortFn: (a, b) => b.marketValue - a.marketValue,
  },
  {
    value: 'marketValue-asc',
    label: 'Market Value (Low to High)',
    sortFn: (a, b) => a.marketValue - b.marketValue,
  },
  {
    value: 'gainLoss-desc',
    label: 'Gain/Loss $ (High to Low)',
    sortFn: (a, b) => b.unrealizedGainLoss - a.unrealizedGainLoss,
  },
  {
    value: 'gainLoss-asc',
    label: 'Gain/Loss $ (Low to High)',
    sortFn: (a, b) => a.unrealizedGainLoss - b.unrealizedGainLoss,
  },
  {
    value: 'gainLossPercent-desc',
    label: 'Gain/Loss % (High to Low)',
    sortFn: (a, b) => b.unrealizedGainLossPercentage - a.unrealizedGainLossPercentage,
  },
  {
    value: 'gainLossPercent-asc',
    label: 'Gain/Loss % (Low to High)',
    sortFn: (a, b) => a.unrealizedGainLossPercentage - b.unrealizedGainLossPercentage,
  },
  {
    value: 'ticker-asc',
    label: 'Ticker (A to Z)',
    sortFn: (a, b) => a.ticker.localeCompare(b.ticker),
  },
  {
    value: 'ticker-desc',
    label: 'Ticker (Z to A)',
    sortFn: (a, b) => b.ticker.localeCompare(a.ticker),
  },
  {
    value: 'quantity-desc',
    label: 'Quantity (High to Low)',
    sortFn: (a, b) => b.totalQuantity - a.totalQuantity,
  },
  {
    value: 'quantity-asc',
    label: 'Quantity (Low to High)',
    sortFn: (a, b) => a.totalQuantity - b.totalQuantity,
  },
];

export const PositionsGrid = () => {
  const { data: positions, isLoading, error } = useActivePositions();
  const [sortBy, setSortBy] = useState<string>('marketValue-desc');
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Preload logos for better performance
  const tickers = positions?.map(position => position.ticker) || [];
  useLogoPreload(tickers);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSortDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewTransactions = (ticker: string) => {
    // Navigate to transactions page with ticker filter
    navigate(`/transactions?ticker=${ticker}`);
  };

  const handleSortChange = (sortValue: string) => {
    setSortBy(sortValue);
    setShowSortDropdown(false);
  };

  const currentSortOption = sortOptions.find(option => option.value === sortBy) || sortOptions[0];

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Grid3X3 className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Position Details</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 h-64 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Position Details</h2>
        </div>
        <div className="text-center py-8">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Failed to Load Positions</h3>
          <p className="text-sm text-red-600">
            Unable to fetch position data. Please try refreshing the page.
          </p>
        </div>
      </div>
    );
  }

  if (!positions || positions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Grid3X3 className="h-5 w-5 text-gray-600 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">Position Details</h2>
        </div>
        <div className="text-center py-12">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Positions</h3>
          <p className="text-sm text-gray-500">
            Add your first transaction to start tracking your positions
          </p>
        </div>
      </div>
    );
  }

  // Filter positions based on search term, then sort
  const filteredPositions = positions.filter(position => 
    position.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const sortedAndFilteredPositions = [...filteredPositions].sort(currentSortOption.sortFn);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <Grid3X3 className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">Position Details</h2>
            <span className="ml-3 text-sm text-gray-500">
              {filteredPositions.length} of {positions.length} position{positions.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          {/* Sort Controls */}
          <div className="flex items-center space-x-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Sort by: {currentSortOption.label}
              <ChevronDown className="h-4 w-4 ml-2" />
            </button>
            
            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        sortBy === option.value 
                          ? 'bg-blue-50 text-blue-700 font-medium' 
                          : 'text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
        
        {/* Search Box */}
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search positions by ticker..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      {sortedAndFilteredPositions.length === 0 && searchTerm ? (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No positions found</h3>
          <p className="text-sm text-gray-500 mb-4">
            No positions match "{searchTerm}". Try a different search term.
          </p>
          <button
            onClick={() => setSearchTerm('')}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-500"
          >
            <X className="h-4 w-4 mr-1" />
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedAndFilteredPositions.map((position) => (
            <PositionCard
              key={position.id}
              ticker={position.ticker}
              onViewTransactions={handleViewTransactions}
            />
          ))}
        </div>
      )}
    </div>
  );
};
