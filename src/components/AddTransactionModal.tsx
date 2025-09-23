import { useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, DollarSign, FileText } from 'lucide-react';
import type { CreateTransactionRequest, TransactionResponse, TransactionType, Currency, TickerSuggestion } from '../types/api';
import { TickerAutocomplete } from './TickerAutocomplete';
import { SearchableSelect, type SelectOption } from './SearchableSelect';
import { suggestionsApi } from '../api/client';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransactionRequest) => void;
  transaction?: TransactionResponse; // For editing existing transactions
  isLoading?: boolean;
}

const transactionTypes: { value: TransactionType; label: string; description: string }[] = [
  { value: 'BUY', label: 'Buy', description: 'Purchase shares' },
  { value: 'SELL', label: 'Sell', description: 'Sell shares' },
  { value: 'DIVIDEND', label: 'Dividend', description: 'Dividend payment' },
];


export const AddTransactionModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  transaction, 
  isLoading = false 
}: AddTransactionModalProps) => {
  // Helper function to get default values
  const getDefaultValues = (transaction?: TransactionResponse): CreateTransactionRequest => {
    if (transaction) {
      return {
        ticker: transaction.ticker,
        exchange: transaction.exchange || '',
        country: transaction.country || '',
        transactionType: transaction.transactionType,
        quantity: transaction.quantity,
        price: transaction.price,
        fees: transaction.fees || 0,
        currency: transaction.currency,
        transactionDate: transaction.transactionDate,
        notes: transaction.notes || '',
        isFractional: transaction.isFractional || false,
        fractionalMultiplier: transaction.fractionalMultiplier || 1,
        commissionCurrency: transaction.commissionCurrency || 'USD',
      };
    }
    
    return {
      ticker: '',
      exchange: '',
      country: '',
      transactionType: 'BUY' as TransactionType,
      quantity: 0,
      price: 0,
      currency: '' as Currency,
      fees: 0,
      isFractional: false,
      fractionalMultiplier: 1,
      commissionCurrency: 'USD' as Currency,
      transactionDate: new Date().toISOString().split('T')[0],
      notes: '',
    };
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateTransactionRequest>({
    defaultValues: getDefaultValues(transaction)
  });

  // Add validation for form fields
  useEffect(() => {
    register('ticker', {
      required: 'Ticker is required',
      maxLength: { value: 10, message: 'Ticker must be 10 characters or less' }
    });
    register('currency', {
      required: 'Currency is required'
    });
    register('exchange', {
      required: 'Exchange is required'
    });
    register('country', {
      required: 'Country is required'
    });
  }, [register]);

  // Reset form when transaction changes or modal opens/closes
  useEffect(() => {
    if (isOpen) {
      const values = getDefaultValues(transaction);
      reset(values);
    }
  }, [isOpen, transaction, reset]);

  // Load options from API
  const { data: currencies } = useQuery({
    queryKey: ['currencies'],
    queryFn: () => suggestionsApi.getCurrencies(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: exchanges } = useQuery({
    queryKey: ['exchanges'],
    queryFn: () => suggestionsApi.getExchanges(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Get unique countries from exchanges
  const availableCountries: string[] = exchanges?.exchanges
    ? [...new Set(exchanges.exchanges.map(e => e.country).filter(Boolean))] as string[]
    : [];

  const watchQuantity = watch('quantity');
  const watchPrice = watch('price');
  const watchFees = watch('fees');
  const watchExchange = watch('exchange');

  // Get selected exchange data
  const selectedExchange = exchanges?.exchanges?.find(e => e.code === watchExchange);

  // Auto-populate currency and country when exchange is selected
  useEffect(() => {
    if (selectedExchange) {
      // Auto-populate currency if exchange has currencyCode and current currency is empty or different
      if (selectedExchange.currencyCode && watch('currency') !== selectedExchange.currencyCode) {
        setValue('currency', selectedExchange.currencyCode as Currency);
      }
      
      // Auto-populate country if exchange has country and current country is empty or different
      if (selectedExchange.country && watch('country') !== selectedExchange.country) {
        setValue('country', selectedExchange.country);
      }
    }
  }, [selectedExchange, setValue, watch]);
  
  // Transform API data to SelectOption format
  const currencyOptions: SelectOption[] = useMemo(() => {
    if (!currencies?.currencies) return [];
    
    // If an exchange is selected, filter currencies to only show the exchange's currency
    const availableCurrencies = selectedExchange && selectedExchange.currencyCode
      ? currencies.currencies.filter(c => c.code === selectedExchange.currencyCode)
      : currencies.currencies;
    
    return availableCurrencies
      .filter(c => c.active)
      .map(currency => ({
        value: currency.code,
        label: `${currency.code} - ${currency.name}`,
        searchText: `${currency.code} ${currency.name} ${currency.symbol || ''}`
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [currencies, selectedExchange]);

  const exchangeOptions: SelectOption[] = useMemo(() => {
    if (!exchanges?.exchanges) return [];
    return exchanges.exchanges
      .filter(e => e.active)
      .map(exchange => ({
        value: exchange.code,
        label: `${exchange.code} - ${exchange.name}`,
        searchText: `${exchange.code} ${exchange.name} ${exchange.country || ''}`
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [exchanges]);

  const countryOptions: SelectOption[] = useMemo(() => {
    // If an exchange is selected, filter countries to only show the exchange's country
    const availableCountriesList = selectedExchange && selectedExchange.country
      ? [selectedExchange.country]
      : availableCountries;
    
    return availableCountriesList
      .map(country => ({
        value: country,
        label: country,
        searchText: country
      }))
      .sort((a, b) => a.value.localeCompare(b.value));
  }, [availableCountries, selectedExchange]);

  // Calculate total value and cost
  const totalValue = (watchQuantity || 0) * (watchPrice || 0);
  const totalCost = totalValue + (watchFees || 0);

  const handleFormSubmit = (data: CreateTransactionRequest) => {
    onSubmit(data);
  };

  const handleClose = () => {
    // Reset form to clean state when closing
    reset(getDefaultValues());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 pt-20 pb-20 sm:p-4 sm:pt-4 sm:pb-4 z-[9999]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-full sm:max-h-[90vh] flex flex-col relative mx-auto my-auto">
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            {transaction ? 'Edit Transaction' : 'Add New Transaction'}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
            disabled={isLoading}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <form id="transaction-form" onSubmit={handleSubmit(handleFormSubmit)} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Market Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Market Information
            </h3>
            <p className="text-sm text-gray-600">
              Please select the market details first to get better ticker suggestions
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Currency *
                </label>
                <SearchableSelect
                  value={watch('currency') || ''}
                  onChange={(value) => setValue('currency', value as Currency)}
                  options={currencyOptions}
                  placeholder="Search and select currency..."
                  disabled={isLoading}
                  error={errors.currency?.message}
                  name="currency"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exchange *
                </label>
                <SearchableSelect
                  value={watch('exchange') || ''}
                  onChange={(value) => setValue('exchange', value)}
                  options={exchangeOptions}
                  placeholder="Search and select exchange..."
                  disabled={isLoading}
                  error={errors.exchange?.message}
                  name="exchange"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <SearchableSelect
                  value={watch('country') || ''}
                  onChange={(value) => setValue('country', value)}
                  options={countryOptions}
                  placeholder="Search and select country..."
                  disabled={isLoading}
                  error={errors.country?.message}
                  name="country"
                />
              </div>
            </div>
          </div>

          {/* Stock Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <DollarSign className="h-5 w-5 mr-2" />
              Stock Information
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Ticker *
                </label>
                <TickerAutocomplete
                  value={watch('ticker') || ''}
                  onChange={(value) => setValue('ticker', value)}
                  onSelect={(suggestion: TickerSuggestion) => {
                    setValue('ticker', suggestion.symbol);
                    // Auto-populate marketing information from selected stock
                    if (suggestion.exchange) {
                      setValue('exchange', suggestion.exchange);
                    }
                    if (suggestion.country) {
                      setValue('country', suggestion.country);
                    }
                    if (suggestion.currency) {
                      setValue('currency', suggestion.currency as Currency);
                    }
                  }}
                  placeholder={transaction ? transaction.ticker : "Start typing ticker or company name..."}
                  disabled={isLoading}
                  error={errors.ticker?.message}
                  filters={{
                    currency: watch('currency'),
                    exchange: watch('exchange'),
                    country: watch('country'),
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Type *
                </label>
                <select
                  {...register('transactionType', { required: 'Transaction type is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                >
                  {!transaction && <option value="">Select transaction type</option>}
                  {transactionTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label} - {type.description}
                    </option>
                  ))}
                </select>
                {errors.transactionType && (
                  <p className="mt-1 text-sm text-red-600">{errors.transactionType.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Transaction Details
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantity *
                </label>
                <input
                  {...register('quantity', { 
                    required: 'Quantity is required',
                    min: { value: 0.0001, message: 'Minimum quantity is 0.0001' },
                    valueAsNumber: true
                  })}
                  type="number"
                  step="0.0001"
                  placeholder={transaction ? transaction.quantity.toString() : "e.g., 100 or 10.5 for fractional"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                  onFocus={(e) => e.target.select()}
                />
                {errors.quantity && (
                  <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Share *
                </label>
                <input
                  {...register('price', { 
                    required: 'Price is required',
                    min: { value: 0.01, message: 'Minimum price is $0.01' },
                    valueAsNumber: true
                  })}
                  type="number"
                  step="0.01"
                  placeholder={transaction ? transaction.price.toString() : "e.g., 150.25"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                  onFocus={(e) => e.target.select()}
                />
                {errors.price && (
                  <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Fees
                </label>
                <input
                  {...register('fees', { 
                    min: { value: 0, message: 'Fees cannot be negative' },
                    valueAsNumber: true
                  })}
                  type="number"
                  step="0.01"
                  placeholder={transaction?.fees ? transaction.fees.toString() : "e.g., 9.99 (leave empty if no fees)"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                  onFocus={(e) => e.target.select()}
                />
                {errors.fees && (
                  <p className="mt-1 text-sm text-red-600">{errors.fees.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Transaction Date *
                </label>
                <input
                  {...register('transactionDate', { required: 'Transaction date is required' })}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isLoading}
                />
                {errors.transactionDate && (
                  <p className="mt-1 text-sm text-red-600">{errors.transactionDate.message}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                {...register('notes', { 
                  maxLength: { value: 500, message: 'Notes must be 500 characters or less' }
                })}
                rows={3}
                placeholder={
                  transaction?.notes 
                    ? transaction.notes 
                    : "Add any additional notes about this transaction (e.g., 'Monthly investment', 'Sold due to rebalancing', etc.)"
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                disabled={isLoading}
              />
              {errors.notes && (
                <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
              )}
            </div>
          </div>

          {/* Transaction Summary */}
          {(watchQuantity && watchPrice && watchQuantity > 0 && watchPrice > 0) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center mb-3">
                <DollarSign className="h-4 w-4 text-blue-600 mr-2" />
                <h4 className="text-sm font-medium text-blue-900">Transaction Summary</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Shares × Price:</span>
                  <span className="font-medium text-blue-900">${totalValue.toFixed(2)}</span>
                </div>
                {(watchFees && watchFees > 0) && (
                  <div className="flex justify-between">
                    <span className="text-blue-700">+ Fees:</span>
                    <span className="font-medium text-blue-900">${(watchFees || 0).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-blue-900 pt-2 border-t border-blue-200 col-span-full sm:col-span-2">
                  <span>Total Cost:</span>
                  <span>${totalCost.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          </form>
        </div>

        {/* Fixed Footer with Action Buttons */}
        <div className="flex-shrink-0 p-4 sm:p-6 border-t border-gray-200 bg-white rounded-b-lg relative z-10">
          <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-3 sm:py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 min-h-[44px] touch-manipulation"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              form="transaction-form"
              className="px-4 py-3 sm:py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] touch-manipulation"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {transaction ? 'Updating...' : 'Adding...'}
                </span>
              ) : (
                transaction ? 'Update Transaction' : 'Add Transaction'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
