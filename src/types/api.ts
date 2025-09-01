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
