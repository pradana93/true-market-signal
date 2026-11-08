import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getMarketColor(market: string): string {
  const colors: Record<string, string> = {
    crypto: 'text-green-500',
    stocks: 'text-blue-500',
    forex: 'text-purple-500',
    commodities: 'text-orange-500',
    indices: 'text-indigo-500',
    etfs: 'text-teal-500',
  };
  return colors[market.toLowerCase()] || 'text-gray-500';
}

export function getSignalColor(direction: string): string {
  switch (direction) {
    case 'long':
      return 'text-green-500';
    case 'short':
      return 'text-red-500';
    case 'neutral':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.6) return 'bg-yellow-500';
  if (confidence >= 0.4) return 'bg-orange-500';
  return 'bg-red-500';
}