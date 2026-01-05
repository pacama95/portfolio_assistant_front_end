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
  exchange?: string;
  country?: string;
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
  exchange: string;
  country: string;
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

// Enhanced Ticker Suggestions API Types
export interface TickerSuggestion {
  id: number;
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  country: string;
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

export interface AdvancedSearchParams {
  symbol?: string;
  companyName?: string;
  exchange?: string;
  country?: string;
  currency?: string;
  limit?: number;
}

// Currency API Types
export interface CurrencyDto {
  id: number;
  code: string;
  name: string;
  symbol?: string;
  countryCode?: string;
  active: boolean;
}

export interface CurrencyResponse {
  currencies: CurrencyDto[];
  count: number;
}

// Exchange API Types
export interface ExchangeDto {
  id: number;
  code: string;
  name: string;
  country?: string;
  timezone?: string;
  currencyCode?: string;
  active: boolean;
}

export interface ExchangeResponse {
  exchanges: ExchangeDto[];
  count: number;
}

// Stock Type API Types
export interface StockTypeDto {
  id: number;
  code: string;
  name: string;
  description?: string;
  active: boolean;
}

export interface StockTypeResponse {
  stockTypes: StockTypeDto[];
  count: number;
}

// Insights API Types (based on OpenAPI spec)
export interface InsightKeyNumber {
  label: string;
  value: number;
  unit: string;
}

export type InsightType = 'performance' | 'alert' | 'risk' | 'opportunity';

export interface Insight {
  type: InsightType;
  title: string;
  summary: string;
  details: string;
  tickers: string[];
  key_numbers: InsightKeyNumber[];
  sources: string[];
  priority: number;
}

export interface InsightsResponse {
  version: string;
  generated_at_utc: string;
  insights: Insight[];
}

export interface InsightsRequest {
  query: string;
  thread_id?: string;
}

// SSE Event Types (Version 3.0)
export type AgentPhase = 
  | "initializing" 
  | "data_fetching" 
  | "refinement" 
  | "cache_lookup" 
  | "generation" 
  | "evaluation" 
  | "cache_storage" 
  | "composition" 
  | "validation" 
  | "complete" 
  | "error";

export type AgentStatus = "started" | "in_progress" | "completed" | "skipped" | "error";

export interface ProgressEventDetails {
  phase_name?: string;
  positions_count?: number;
  tickers?: string[];
  total_tasks?: number;
  cache_hits?: number;
  cache_misses?: number;
  generated?: number;
  total_to_generate?: number;
  evaluated?: number;
  accepted?: number;
  rejected?: number;
  insights_count?: number;
  insight_types?: string[];
  final_count?: number;
}

export interface AgentProgressEvent {
  phase: AgentPhase;
  status: AgentStatus;
  message: string;
  progress_percent: number;
  node: string;
  step_current: number;
  step_total: number;
  timestamp: number;
  details: ProgressEventDetails;
  final_answer?: InsightsResponse;
  has_final_answer?: boolean;
}

// Legacy types for backwards compatibility
export interface SseProgressEvent {
  summary: string;
  step: string | null;
  ts: number;
}

export interface SseValidatorEvent {
  node: string;
  status: string;
  message: string;
  ts: number;
  meta?: {
    final_answer?: string;
    has_final_answer?: boolean;
  };
}

// Health endpoint
export interface HealthResponse {
  ok: boolean;
  service: string;
}
