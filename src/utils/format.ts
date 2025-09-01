import type { Currency } from '../types/api';

export const formatCurrency = (amount: number, currency: Currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatPercentage = (percentage: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(percentage / 100);
};

export const formatNumber = (number: number, decimals = 2): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(number);
};

export const getGainLossColor = (value: number): string => {
  if (value > 0) return 'text-profit-600';
  if (value < 0) return 'text-loss-600';
  return 'text-gray-600';
};

export const getGainLossBgColor = (value: number): string => {
  if (value > 0) return 'bg-profit-50 border-profit-200';
  if (value < 0) return 'bg-loss-50 border-loss-200';
  return 'bg-gray-50 border-gray-200';
};

export const getGainLossSign = (value: number): string => {
  return value > 0 ? '+' : '';
};

// Generate colors for the pie chart
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const generateChartColors = (count: number): string[] => {
  const baseColors = [
    '#3b82f6', // blue
    '#10b981', // emerald
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316', // orange
    '#ec4899', // pink
    '#6b7280', // gray
  ];

  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  // If we need more colors, generate variations
  const colors = [...baseColors];
  const variations = ['50', '400', '600', '800'];
  
  for (let i = baseColors.length; i < count; i++) {
    const baseIndex = i % baseColors.length;
    const variationIndex = Math.floor(i / baseColors.length) % variations.length;
    colors.push(baseColors[baseIndex] + variations[variationIndex]);
  }

  return colors;
};
