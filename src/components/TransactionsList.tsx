import { Edit, Trash2 } from 'lucide-react';
import { useAllTransactions } from '../hooks/useApi';
import { formatCurrency, formatNumber } from '../utils/format';
import type { TransactionResponse, TransactionType } from '../types/api';
import type { TransactionFilters } from './TransactionFilters';

interface TransactionsListProps {
  searchQuery?: string;
  filters?: TransactionFilters;
  onEdit?: (transaction: TransactionResponse) => void;
  onDelete?: (transactionId: string) => void;
}

const getTransactionTypeColor = (type: TransactionType): string => {
  switch (type) {
    case 'BUY':
      return 'bg-profit-100 text-profit-700 border-profit-200';
    case 'SELL':
      return 'bg-loss-100 text-loss-700 border-loss-200';
    case 'DIVIDEND':
      return 'bg-blue-100 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getTransactionIcon = (type: TransactionType): string => {
  switch (type) {
    case 'BUY':
      return '↗️';
    case 'SELL':
      return '↘️';
    case 'DIVIDEND':
      return '💰';
    default:
      return '📊';
  }
};

export const TransactionsList = ({ searchQuery = '', filters = {}, onEdit, onDelete }: TransactionsListProps) => {
  const { data: transactions, isLoading, error } = useAllTransactions();

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <div className="text-red-500 text-sm">Failed to load transactions</div>
        </div>
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions yet</h3>
          <p className="text-sm text-gray-500">
            Get started by adding your first transaction
          </p>
        </div>
      </div>
    );
  }

  // Filter transactions based on search query and filters
  const filteredTransactions = transactions.filter(transaction => {
    // Search filter
    const searchMatch = !searchQuery || 
      transaction.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.transactionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Transaction type filter
    const typeMatch = !filters.transactionType || 
      transaction.transactionType === filters.transactionType;
    
    // Ticker filter
    const tickerMatch = !filters.ticker || 
      transaction.ticker.toLowerCase().includes(filters.ticker.toLowerCase());
    
    // Currency filter
    const currencyMatch = !filters.currency || 
      transaction.currency === filters.currency;
    
    // Date range filter
    const transactionDate = new Date(transaction.transactionDate);
    const dateFromMatch = !filters.dateFrom || 
      transactionDate >= new Date(filters.dateFrom);
    const dateToMatch = !filters.dateTo || 
      transactionDate <= new Date(filters.dateTo + 'T23:59:59'); // Include the entire end date
    
    return searchMatch && typeMatch && tickerMatch && currencyMatch && dateFromMatch && dateToMatch;
  });

  // Show empty state if no transactions match filters
  if (filteredTransactions.length === 0) {
    const hasActiveFilters = Object.values(filters).some(v => v !== undefined && v !== '') || searchQuery;
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {hasActiveFilters ? 'No matching transactions' : 'No transactions yet'}
          </h3>
          <p className="text-sm text-gray-500">
            {hasActiveFilters 
              ? 'Try adjusting your search or filters to find transactions'
              : 'Get started by adding your first transaction'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Results Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {filteredTransactions.length === transactions.length 
              ? `${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''}`
              : `${filteredTransactions.length} of ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`
            }
          </p>
          {filteredTransactions.length !== transactions.length && (
            <p className="text-xs text-gray-500">
              Filtered by {searchQuery ? 'search' : ''}{searchQuery && Object.values(filters).some(v => v) ? ' and ' : ''}
              {Object.values(filters).some(v => v) ? 'filters' : ''}
            </p>
          )}
        </div>
      </div>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock & Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity & Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Value
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{getTransactionIcon(transaction.transactionType)}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{transaction.ticker}</div>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getTransactionTypeColor(transaction.transactionType)}`}>
                        {transaction.transactionType}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {formatNumber(transaction.quantity)} shares
                  </div>
                  <div className="text-sm text-gray-500">
                    @ {formatCurrency(transaction.price)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {formatCurrency(transaction.totalCost)}
                  </div>
                  {transaction.fees > 0 && (
                    <div className="text-xs text-gray-500">
                      Fees: {formatCurrency(transaction.fees)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(transaction.transactionDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(transaction)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                        title="Edit transaction"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(transaction.id)}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete transaction"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden divide-y divide-gray-200">
        {filteredTransactions.map((transaction) => (
          <div key={transaction.id} className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="text-lg mr-2">{getTransactionIcon(transaction.transactionType)}</span>
                  <h3 className="text-lg font-medium text-gray-900">{transaction.ticker}</h3>
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-medium rounded-md border ${getTransactionTypeColor(transaction.transactionType)}`}>
                    {transaction.transactionType}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Quantity:</span>
                    <span className="ml-1 font-medium">{formatNumber(transaction.quantity)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <span className="ml-1 font-medium">{formatCurrency(transaction.price)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Total:</span>
                    <span className="ml-1 font-medium">{formatCurrency(transaction.totalCost)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Date:</span>
                    <span className="ml-1">{new Date(transaction.transactionDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {transaction.notes && (
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="text-gray-500">Notes:</span> {transaction.notes}
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-1 ml-4">
                {onEdit && (
                  <button
                    onClick={() => onEdit(transaction)}
                    className="text-blue-600 hover:text-blue-900 p-2 rounded hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(transaction.id)}
                    className="text-red-600 hover:text-red-900 p-2 rounded hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTransactions.length === 0 && searchQuery && (
        <div className="text-center py-8 px-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">No transactions found</h3>
          <p className="text-sm text-gray-500">
            Try adjusting your search criteria
          </p>
        </div>
      )}
    </div>
  );
};
