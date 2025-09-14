import type {
  PortfolioSummaryResponse,
  PositionResponse,
  TransactionResponse,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  UpdateMarketDataRequest,
  TransactionSearchParams,
  DividendResponse,
  DividendSearchParams,
  DividendServiceResponse,
  DividendServiceParams,
  TickerSuggestionsResponse,
  TickerSuggestionsParams,
} from '../types/api';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';
const LOGO_API_BASE_URL = import.meta.env.VITE_LOGO_API_URL || 'http://0.0.0.0:8085';
const SUGGESTIONS_API_BASE_URL = import.meta.env.VITE_SUGGESTIONS_API_URL || 'http://localhost:8090';
const DIVIDENDS_API_BASE_URL = import.meta.env.VITE_DIVIDENDS_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  public status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let url = `${BASE_URL}${endpoint}`;
  
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

interface CachedLogo {
  url: string;
  timestamp: number;
  ticker: string;
}

class LogoCache {
  private cache = new Map<string, CachedLogo>();
  private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private readonly MAX_CACHE_SIZE = 100; // Limit cache size to prevent memory issues

  private isExpired(cachedLogo: CachedLogo): boolean {
    return Date.now() - cachedLogo.timestamp > this.TTL;
  }

  private evictExpired(): void {
    const now = Date.now();
    for (const [ticker, cachedLogo] of this.cache.entries()) {
      if (now - cachedLogo.timestamp > this.TTL) {
        URL.revokeObjectURL(cachedLogo.url);
        this.cache.delete(ticker);
      }
    }
  }

  private evictOldest(): void {
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      // Find and remove the oldest entry
      let oldestTicker: string | null = null;
      let oldestTimestamp = Date.now();

      for (const [ticker, cachedLogo] of this.cache.entries()) {
        if (cachedLogo.timestamp < oldestTimestamp) {
          oldestTimestamp = cachedLogo.timestamp;
          oldestTicker = ticker;
        }
      }

      if (oldestTicker) {
        const oldestLogo = this.cache.get(oldestTicker);
        if (oldestLogo) {
          URL.revokeObjectURL(oldestLogo.url);
          this.cache.delete(oldestTicker);
        }
      }
    }
  }

  get(ticker: string): string | null {
    const cachedLogo = this.cache.get(ticker.toUpperCase());
    if (cachedLogo && !this.isExpired(cachedLogo)) {
      return cachedLogo.url;
    }
    
    // Clean up expired entry if it exists
    if (cachedLogo && this.isExpired(cachedLogo)) {
      URL.revokeObjectURL(cachedLogo.url);
      this.cache.delete(ticker.toUpperCase());
    }
    
    return null;
  }

  set(ticker: string, url: string): void {
    // Clean up expired entries periodically
    this.evictExpired();
    
    // Ensure we don't exceed max cache size
    this.evictOldest();

    this.cache.set(ticker.toUpperCase(), {
      url,
      timestamp: Date.now(),
      ticker: ticker.toUpperCase()
    });
  }

  clear(): void {
    // Clean up all blob URLs before clearing
    for (const cachedLogo of this.cache.values()) {
      URL.revokeObjectURL(cachedLogo.url);
    }
    this.cache.clear();
  }

  getCacheStats(): { size: number; tickers: string[] } {
    return {
      size: this.cache.size,
      tickers: Array.from(this.cache.keys())
    };
  }
}

// Create a singleton cache instance
const logoCache = new LogoCache();

async function fetchStockLogo(ticker: string): Promise<string | null> {
  // Check cache first
  const cachedUrl = logoCache.get(ticker);
  if (cachedUrl) {
    return cachedUrl;
  }

  try {
    const response = await fetch(`${LOGO_API_BASE_URL}/api/v1/logos/external/${ticker.toUpperCase()}`);
    
    if (!response.ok) {
      return null;
    }
    
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    
    // Cache the result
    logoCache.set(ticker, url);
    
    return url;
  } catch (error) {
    console.error(`Failed to fetch logo for ${ticker}:`, error);
    return null;
  }
}

export const logoApi = {
  getStockLogo: fetchStockLogo,
  clearCache: () => logoCache.clear(),
  getCacheStats: () => logoCache.getCacheStats(),
};

// Ticker suggestions API function
async function fetchTickerSuggestions(params: TickerSuggestionsParams): Promise<TickerSuggestionsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('q', params.q);
  if (params.limit) {
    searchParams.append('limit', params.limit.toString());
  }

  const response = await fetch(`${SUGGESTIONS_API_BASE_URL}/suggestions?${searchParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const suggestionsApi = {
  getTickerSuggestions: fetchTickerSuggestions,
};

// Dividend service API function
async function fetchDividendData(params: DividendServiceParams): Promise<DividendServiceResponse> {
  const searchParams = new URLSearchParams();
  if (params.sources) {
    searchParams.append('sources', params.sources);
  }

  const url = `${DIVIDENDS_API_BASE_URL}/api/v1/dividend/${params.symbol}${
    searchParams.toString() ? `?${searchParams.toString()}` : ''
  }`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

export const dividendsApi = {
  getDividends: fetchDividendData,
};

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

  // Dividend endpoints
  getPortfolioDividends: (params: DividendSearchParams): Promise<Record<string, DividendResponse[]>> => {
    const searchParams = new URLSearchParams();
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);
    
    return apiRequest(`/dividends/portfolio?${searchParams.toString()}`);
  },
    
  getDividendsByTicker: (ticker: string, params: DividendSearchParams): Promise<DividendResponse[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);
    
    return apiRequest(`/dividends/ticker/${ticker}?${searchParams.toString()}`);
  },
};

export { ApiError };
