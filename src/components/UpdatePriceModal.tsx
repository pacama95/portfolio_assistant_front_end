import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { X, DollarSign, TrendingUp } from 'lucide-react';
import { usePositionByTicker } from '../hooks/useApi';
import { formatCurrency } from '../utils/format';
import { portfolioApi } from '../api/client';
import { useQueryClient } from '@tanstack/react-query';
import { StockLogo } from './StockLogo';

interface UpdatePriceModalProps {
  isOpen: boolean;
  ticker: string;
  onClose: () => void;
}

interface UpdatePriceForm {
  price: number;
}

export const UpdatePriceModal = ({ isOpen, ticker, onClose }: UpdatePriceModalProps) => {
  const { data: position, isLoading: positionLoading } = usePositionByTicker(ticker);
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<UpdatePriceForm>({
    defaultValues: {
      price: position?.currentPrice || 0
    }
  });

  // Reset form when position data changes
  useEffect(() => {
    if (position) {
      reset({ price: position.currentPrice });
    }
  }, [position, reset]);

  const handleFormSubmit = async (data: UpdatePriceForm) => {
    try {
      await portfolioApi.updateMarketPrice(ticker, { price: data.price });
      
      // Invalidate related queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['positions'] }),
        queryClient.invalidateQueries({ queryKey: ['portfolio'] }),
      ]);
      
      onClose();
    } catch (error) {
      console.error('Failed to update price:', error);
      alert('Failed to update price. Please try again.');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  if (positionLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 pt-20 pb-20 sm:p-4 sm:pt-4 sm:pb-4 z-[9999]">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!position) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 pt-20 pb-20 sm:p-4 sm:pt-4 sm:pb-4 z-[9999]">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="text-center">
            <p className="text-red-600">Position not found</p>
            <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 pt-20 pb-20 sm:p-4 sm:pt-4 sm:pb-4 z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Update {ticker} Price
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
            disabled={isSubmitting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Current Position Info */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <StockLogo ticker={ticker} size="sm" />
              <div>
                <p className="text-sm font-medium text-gray-900">{ticker}</p>
                <p className="text-xs text-gray-500">{position.totalQuantity} shares</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">{formatCurrency(position.currentPrice)}</p>
              <p className="text-xs text-gray-500">Current Price</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Market Price *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">$</span>
                </div>
                <input
                  {...register('price', {
                    required: 'Price is required',
                    min: { value: 0.01, message: 'Price must be at least $0.01' },
                    valueAsNumber: true
                  })}
                  type="number"
                  step="0.01"
                  placeholder="Enter new price"
                  className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-md text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSubmitting}
                />
              </div>
              {errors.price && (
                <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
              )}
            </div>

            {/* Price Comparison */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-center text-blue-700 mb-2">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">Price Update Impact</span>
              </div>
              <p className="text-xs text-blue-600">
                This will update the market price for your {ticker} position and recalculate 
                your portfolio's market value and unrealized gains/losses.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </span>
              ) : (
                'Update Price'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
