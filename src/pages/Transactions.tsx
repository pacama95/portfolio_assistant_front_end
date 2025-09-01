import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Filter, Search } from 'lucide-react';
import { TransactionsList } from '../components/TransactionsList';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { TransactionFiltersModal } from '../components/TransactionFilters';
import type { TransactionFilters } from '../components/TransactionFilters';
import { useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '../hooks/useApi';
import type { CreateTransactionRequest, TransactionResponse } from '../types/api';

export const Transactions = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [editingTransaction, setEditingTransaction] = useState<TransactionResponse | undefined>();

  // Handle URL search params for ticker filtering (from position cards)
  useEffect(() => {
    const ticker = searchParams.get('ticker');
    if (ticker) {
      setFilters((prev: TransactionFilters) => ({ ...prev, ticker: ticker.toUpperCase() }));
      // Clear the URL parameter after setting the filter
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);
  
  // Mutations
  const createTransactionMutation = useCreateTransaction();
  const updateTransactionMutation = useUpdateTransaction();
  const deleteTransactionMutation = useDeleteTransaction();

  const handleAddTransaction = () => {
    setEditingTransaction(undefined);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: TransactionResponse) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      try {
        await deleteTransactionMutation.mutateAsync(transactionId);
      } catch (error) {
        console.error('Failed to delete transaction:', error);
        alert('Failed to delete transaction. Please try again.');
      }
    }
  };

  const handleSubmitTransaction = async (data: CreateTransactionRequest) => {
    try {
      if (editingTransaction) {
        await updateTransactionMutation.mutateAsync({
          id: editingTransaction.id,
          data
        });
      } else {
        await createTransactionMutation.mutateAsync(data);
      }
      setIsModalOpen(false);
      setEditingTransaction(undefined);
    } catch (error) {
      console.error('Failed to save transaction:', error);
      alert('Failed to save transaction. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(undefined);
  };

  const handleOpenFilters = () => {
    setIsFiltersOpen(true);
  };

  const handleCloseFilters = () => {
    setIsFiltersOpen(false);
  };

  const handleApplyFilters = (newFilters: TransactionFilters) => {
    setFilters(newFilters);
  };

  // Count active filters for display
  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length;

  const isLoading = createTransactionMutation.isPending || 
                   updateTransactionMutation.isPending || 
                   deleteTransactionMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="mt-2 text-gray-600">
            Manage your investment transactions and trading history
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0">
          <button 
            onClick={handleAddTransaction}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Transaction
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleOpenFilters}
              className={`inline-flex items-center px-3 py-2 border text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                activeFiltersCount > 0 
                  ? 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100' 
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <TransactionsList
        searchQuery={searchQuery}
        filters={filters}
        onEdit={handleEditTransaction}
        onDelete={handleDeleteTransaction}
      />

      {/* Add/Edit Transaction Modal */}
      <AddTransactionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitTransaction}
        transaction={editingTransaction}
        isLoading={isLoading}
      />

      {/* Filters Modal */}
      <TransactionFiltersModal
        isOpen={isFiltersOpen}
        onClose={handleCloseFilters}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />
    </div>
  );
};
