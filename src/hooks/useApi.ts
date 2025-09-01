import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { portfolioApi } from '../api/client';
import type { UpdateMarketDataRequest } from '../types/api';

// Portfolio hooks
export const usePortfolioSummary = () => {
  return useQuery({
    queryKey: ['portfolio', 'summary'],
    queryFn: portfolioApi.getPortfolioSummary,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useActivePortfolioSummary = () => {
  return useQuery({
    queryKey: ['portfolio', 'summary', 'active'],
    queryFn: portfolioApi.getActivePortfolioSummary,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Position hooks
export const useAllPositions = () => {
  return useQuery({
    queryKey: ['positions', 'all'],
    queryFn: portfolioApi.getAllPositions,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useActivePositions = () => {
  return useQuery({
    queryKey: ['positions', 'active'],
    queryFn: portfolioApi.getActivePositions,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const usePositionByTicker = (ticker: string) => {
  return useQuery({
    queryKey: ['positions', 'ticker', ticker],
    queryFn: () => portfolioApi.getPositionByTicker(ticker),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

// Transaction hooks
export const useAllTransactions = () => {
  return useQuery({
    queryKey: ['transactions', 'all'],
    queryFn: portfolioApi.getAllTransactions,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useTransactionsByTicker = (ticker: string) => {
  return useQuery({
    queryKey: ['transactions', 'ticker', ticker],
    queryFn: () => portfolioApi.getTransactionsByTicker(ticker),
    enabled: !!ticker,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Transaction mutation hooks
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: portfolioApi.createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
};

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      portfolioApi.updateTransaction(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: portfolioApi.deleteTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
};

// Position mutation hooks
export const useUpdateMarketPrice = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticker, data }: { ticker: string; data: UpdateMarketDataRequest }) => 
      portfolioApi.updateMarketPrice(ticker, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['positions'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
};