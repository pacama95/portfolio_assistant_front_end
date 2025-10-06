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
  AdvancedSearchParams,
  CurrencyResponse,
  ExchangeResponse,
  StockTypeResponse,
  InsightsRequest,
  InsightsResponse,
  HealthResponse,
} from '../types/api';

const TRANSACTIONS_API_BASE_URL = import.meta.env.VITE_TRANSACTIONS_API_URL || 'http://localhost:8081/api';
const PORTFOLIO_API_BASE_URL = import.meta.env.VITE_PORTFOLIO_API_URL || 'http://localhost:8085/api';
const LOGO_API_BASE_URL = import.meta.env.VITE_LOGO_API_URL || 'http://0.0.0.0:8086';
const SUGGESTIONS_API_BASE_URL = import.meta.env.VITE_SUGGESTIONS_API_URL || 'http://localhost:8090';
const DIVIDENDS_API_BASE_URL = import.meta.env.VITE_DIVIDENDS_API_URL || 'http://localhost:8000';
const INSIGHTS_API_BASE_URL = import.meta.env.VITE_INSIGHTS_API_URL || 'http://localhost:8089';

class ApiError extends Error {
  public status: number;
  
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function apiRequest<T>(baseUrl: string, endpoint: string, options: RequestInit = {}): Promise<T> {
  let url = `${baseUrl}${endpoint}`;
  
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

// Helper functions for different API endpoints
async function transactionsApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(TRANSACTIONS_API_BASE_URL, endpoint, options);
}

async function portfolioApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(PORTFOLIO_API_BASE_URL, endpoint, options);
}

// Insights API helper
async function insightsApiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  return apiRequest<T>(INSIGHTS_API_BASE_URL, endpoint, options);
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

// Ticker suggestions API functions
async function fetchTickerSuggestions(params: TickerSuggestionsParams): Promise<TickerSuggestionsResponse> {
  const searchParams = new URLSearchParams();
  searchParams.append('q', params.q);
  if (params.limit) {
    searchParams.append('limit', params.limit.toString());
  }

  const response = await fetch(`${SUGGESTIONS_API_BASE_URL}/v1/suggestions?${searchParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchAdvancedSearch(params: AdvancedSearchParams): Promise<TickerSuggestionsResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.symbol) searchParams.append('symbol', params.symbol);
  if (params.companyName) searchParams.append('companyName', params.companyName);
  if (params.exchange) searchParams.append('exchange', params.exchange);
  if (params.country) searchParams.append('country', params.country);
  if (params.currency) searchParams.append('currency', params.currency);
  if (params.limit) searchParams.append('limit', params.limit.toString());

  const response = await fetch(`${SUGGESTIONS_API_BASE_URL}/v1/suggestions/search?${searchParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchCurrencies(): Promise<CurrencyResponse> {
  const response = await fetch(`${SUGGESTIONS_API_BASE_URL}/v1/currencies`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchExchanges(): Promise<ExchangeResponse> {
  const response = await fetch(`${SUGGESTIONS_API_BASE_URL}/v1/exchanges`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, `HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function fetchStockTypes(): Promise<StockTypeResponse> {
  const response = await fetch(`${SUGGESTIONS_API_BASE_URL}/v1/stock-types`, {
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
  getAdvancedSearch: fetchAdvancedSearch,
  getCurrencies: fetchCurrencies,
  getExchanges: fetchExchanges,
  getStockTypes: fetchStockTypes,
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

// Insights API
export const insightsApi = {
  // Health check
  getHealth: (): Promise<HealthResponse> => insightsApiRequest('/health'),

  // Non-streaming insights generation (final JSON)
  postInsights: (request: InsightsRequest): Promise<InsightsResponse> =>
    insightsApiRequest('/insights', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
};

export const portfolioApi = {
  // Portfolio endpoints
  getPortfolioSummary: (): Promise<PortfolioSummaryResponse> =>
    portfolioApiRequest('/portfolio/summary'),
    
  getActivePortfolioSummary: (): Promise<PortfolioSummaryResponse> =>
    portfolioApiRequest('/portfolio/summary/active'),

  // Position endpoints
  getAllPositions: (): Promise<PositionResponse[]> =>
    portfolioApiRequest('/positions'),
    
  getActivePositions: (): Promise<PositionResponse[]> =>
    portfolioApiRequest('/positions/active'),
    
  getPositionByTicker: (ticker: string): Promise<PositionResponse> =>
    portfolioApiRequest(`/positions/ticker/${ticker}`),
    
  getPositionById: (id: string): Promise<PositionResponse> =>
    portfolioApiRequest(`/positions/${id}`),
    
  checkPositionExists: (ticker: string): Promise<boolean> =>
    portfolioApiRequest(`/positions/ticker/${ticker}/exists`),
    
  getPositionCount: (): Promise<number> =>
    portfolioApiRequest('/positions/count'),
    
  getActivePositionCount: (): Promise<number> =>
    portfolioApiRequest('/positions/count/active'),
    
  updateMarketPrice: (ticker: string, request: UpdateMarketDataRequest): Promise<PositionResponse> =>
    portfolioApiRequest(`/positions/ticker/${ticker}/price`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }),
    
  recalculatePosition: (ticker: string): Promise<PositionResponse> =>
    portfolioApiRequest(`/positions/ticker/${ticker}/recalculate`, {
      method: 'POST',
    }),

  // Transaction endpoints
  getAllTransactions: (): Promise<TransactionResponse[]> =>
    transactionsApiRequest('/transactions'),
    
  getTransactionsByTicker: (ticker: string): Promise<TransactionResponse[]> =>
    transactionsApiRequest(`/transactions/ticker/${ticker}`),
    
  getTransactionById: (id: string): Promise<TransactionResponse> =>
    transactionsApiRequest(`/transactions/${id}`),
    
  searchTransactions: (params: TransactionSearchParams): Promise<TransactionResponse[]> => {
    const searchParams = new URLSearchParams();
    if (params.fromDate) searchParams.append('fromDate', params.fromDate);
    if (params.toDate) searchParams.append('toDate', params.toDate);
    if (params.ticker) searchParams.append('ticker', params.ticker);
    if (params.type) searchParams.append('type', params.type);
    
    return transactionsApiRequest(`/transactions/search?${searchParams.toString()}`);
  },
    
  createTransaction: (request: CreateTransactionRequest): Promise<TransactionResponse> =>
    transactionsApiRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify(request),
    }),
    
  updateTransaction: (id: string, request: UpdateTransactionRequest): Promise<TransactionResponse> =>
    transactionsApiRequest(`/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    }),
    
  deleteTransaction: (id: string): Promise<void> =>
    transactionsApiRequest(`/transactions/${id}`, {
      method: 'DELETE',
    }),
    
  getTransactionCount: (): Promise<number> =>
    transactionsApiRequest('/transactions/count'),
    
  getTransactionCountByTicker: (ticker: string): Promise<number> =>
    transactionsApiRequest(`/transactions/count/${ticker}`),

  // Dividend endpoints
  getPortfolioDividends: (params: DividendSearchParams): Promise<Record<string, DividendResponse[]>> => {
    const searchParams = new URLSearchParams();
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);
    
    return portfolioApiRequest(`/dividends/portfolio?${searchParams.toString()}`);
  },
    
  getDividendsByTicker: (ticker: string, params: DividendSearchParams): Promise<DividendResponse[]> => {
    const searchParams = new URLSearchParams();
    searchParams.append('startDate', params.startDate);
    searchParams.append('endDate', params.endDate);
    
    return portfolioApiRequest(`/dividends/ticker/${ticker}?${searchParams.toString()}`);
  },
};

export { ApiError };
