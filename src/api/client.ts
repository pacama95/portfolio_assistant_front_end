import type {
  PortfolioSummaryResponse,
  PositionResponse,
  TransactionResponse,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  UpdateMarketDataRequest,
  TransactionSearchParams,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

class ApiError extends Error {
  public status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
  }

  // Handle 204 No Content responses
  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}

export const portfolioApi = {
  // Portfolio endpoints
  getPortfolioSummary: (): Promise<PortfolioSummaryResponse> =>
    apiRequest('/portfolio/summary'),
    
  getActivePortfolioSummary: (): Promise<PortfolioSummaryResponse> =>
    apiRequest('/portfolio/summary/active'),

  // Position endpoints
  getAllPositions: (): Promise<PositionResponse[]> =>
    apiRequest('/positions'),
    
  getActivePositions: (): Promise<PositionResponse[]> =>
    apiRequest('/positions/active'),
    
  getPositionByTicker: (ticker: string): Promise<PositionResponse> =>
    apiRequest(`/positions/ticker/${ticker}`),
    
  getPositionById: (id: string): Promise<PositionResponse> =>
    apiRequest(`/positions/${id}`),
    
  checkPositionExists: (ticker: string): Promise<boolean> =>
    apiRequest(`/positions/ticker/${ticker}/exists`),
    
  getPositionCount: (): Promise<number> =>
    apiRequest('/positions/count'),
    
  getActivePositionCount: (): Promise<number> =>
    apiRequest('/positions/count/active'),
    
  updateMarketPrice: (ticker: string, request: UpdateMarketDataRequest): Promise<PositionResponse> =>
    apiRequest(`/positions/ticker/${ticker}/price`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }),
    
  recalculatePosition: (ticker: string): Promise<PositionResponse> =>
    apiRequest(`/positions/ticker/${ticker}/recalculate`, {
      method: 'POST',
    }),

  // Transaction endpoints
  getAllTransactions: (): Promise<TransactionResponse[]> =>
    apiRequest('/transactions'),
    
  getTransactionsByTicker: (ticker: string): Promise<TransactionResponse[]> =>
    apiRequest(`/transactions/ticker/${ticker}`),
    
  getTransactionById: (id: string): Promise<TransactionResponse> =>
    apiRequest(`/transactions/${id}`),
    
  searchTransactions: (params: TransactionSearchParams): Promise<TransactionResponse[]> => {
    const searchParams = new URLSearchParams();
    if (params.fromDate) searchParams.append('fromDate', params.fromDate);
    if (params.toDate) searchParams.append('toDate', params.toDate);
    if (params.ticker) searchParams.append('ticker', params.ticker);
    if (params.type) searchParams.append('type', params.type);
    
    return apiRequest(`/transactions/search?${searchParams.toString()}`);
  },
    
  createTransaction: (request: CreateTransactionRequest): Promise<TransactionResponse> =>
    apiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
    
  updateTransaction: (id: string, request: UpdateTransactionRequest): Promise<TransactionResponse> =>
    apiRequest(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }),
    
  deleteTransaction: (id: string): Promise<void> =>
    apiRequest(`/transactions/${id}`, {
      method: 'DELETE',
    }),
    
  getTransactionCount: (): Promise<number> =>
    apiRequest('/transactions/count'),
    
  getTransactionCountByTicker: (ticker: string): Promise<number> =>
    apiRequest(`/transactions/count/${ticker}`),
};

export { ApiError };
