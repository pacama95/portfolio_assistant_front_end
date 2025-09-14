// API Types based on OpenAPI schema

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'JPY';

export type TransactionType = 'BUY' | 'SELL' | 'DIVIDEND';

export interface PortfolioSummaryResponse {
  totalMarketValue: number;
  totalCost: number;
  totalUnrealizedGainLoss: number;
  totalUnrealizedGainLossPercentage: number;
  totalPositions: number;
  activePositions: number;
}

export interface PositionResponse {
  id: string;
  ticker: string;
  totalQuantity: number;
  averagePrice: number;
  currentPrice: number;
  totalCost: number;
  currency: Currency;
  lastUpdated: string;
  isActive: boolean;
  marketValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercentage: number;
}

export interface TransactionResponse {
  id: string;
  ticker: string;
  transactionType: TransactionType;
  quantity: number;
  price: number;
  fees: number;
  currency: Currency;
  transactionDate: string;
  notes?: string;
  isActive: boolean;
  totalValue: number;
  totalCost: number;
  isFractional: boolean;
  fractionalMultiplier: number;
  commissionCurrency?: Currency;
}

export interface CreateTransactionRequest {
  ticker: string;
  transactionType: TransactionType;
  quantity: number;
  price: number;
  fees?: number;
  currency: Currency;
  transactionDate: string;
  notes?: string;
  isFractional?: boolean;
  fractionalMultiplier?: number;
  commissionCurrency?: Currency;
}

export interface UpdateTransactionRequest extends CreateTransactionRequest {}

export interface UpdateMarketDataRequest {
  price: number;
}

export interface TransactionSearchParams {
  fromDate?: string;
  toDate?: string;
  ticker?: string;
  type?: TransactionType;
}

// New Dividend Service API Types
export interface DividendEntry {
  symbol: string;
  company_name: string;
  ex_date: string;
  record_date: string | null;
  pay_date: string | null;
  announcement_date: string | null;
  amount: number;
  currency: string;
  dividend_type: string | null;
  frequency: string;
  yield_percentage: number;
  source: string;
  scraped_at: string;
}

export interface DividendServiceResponse {
  symbol: string;
  dividends: DividendEntry[];
  total_count: number;
  cached: boolean;
  cache_expires_at: string | null;
  sources_attempted: string[];
  successful_source: string;
}

export interface DividendServiceParams {
  symbol: string;
  sources?: string;
}

// Legacy dividend types (keeping for compatibility)
export interface DividendResponse {
  symbol: string;
  micCode: string;
  exchange: string;
  exDate: string;
  amount: number;
}

export interface DividendSearchParams {
  startDate: string;
  endDate: string;
}

// Ticker Suggestions API Types
export interface TickerSuggestion {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  region: string;
  marketCap: string;
  currency: string;
}

export interface TickerSuggestionsResponse {
  suggestions: TickerSuggestion[];
  query: string;
  count: number;
}

export interface TickerSuggestionsParams {
  q: string;
  limit?: number;
}
