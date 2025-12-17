import type { Trade, Session, WinRateBreakdown } from '../types';

// MNQ contract specifications
const MNQ_POINT_VALUE = 2.00; // $2.00 per point (4 ticks)

/**
 * Calculate P&L for a trade
 */
export function calculatePnL(
  direction: 'long' | 'short',
  entryPrice: number,
  exitPrice: number,
  positionSize: number
): number {
  const points = direction === 'long' 
    ? exitPrice - entryPrice 
    : entryPrice - exitPrice;
  return points * MNQ_POINT_VALUE * positionSize;
}

/**
 * Calculate planned Risk:Reward ratio
 */
export function calculatePlannedRR(
  direction: 'long' | 'short',
  entryPrice: number,
  stopPrice: number,
  targetPrice: number
): number {
  const risk = direction === 'long'
    ? entryPrice - stopPrice
    : stopPrice - entryPrice;
  const reward = direction === 'long'
    ? targetPrice - entryPrice
    : entryPrice - targetPrice;
  
  if (risk <= 0) return 0;
  return Math.round((reward / risk) * 100) / 100;
}

/**
 * Calculate actual R:R achieved
 */
export function calculateActualRR(
  direction: 'long' | 'short',
  entryPrice: number,
  stopPrice: number,
  exitPrice: number
): number {
  const risk = direction === 'long'
    ? entryPrice - stopPrice
    : stopPrice - entryPrice;
  const actual = direction === 'long'
    ? exitPrice - entryPrice
    : entryPrice - exitPrice;
  
  if (risk <= 0) return 0;
  return Math.round((actual / risk) * 100) / 100;
}

/**
 * Calculate win rate from trades
 */
export function calculateWinRate(trades: Trade[]): number {
  const closedTrades = trades.filter(t => !t.is_open && t.pnl !== null);
  if (closedTrades.length === 0) return 0;
  
  const winners = closedTrades.filter(t => (t.pnl || 0) > 0).length;
  return Math.round((winners / closedTrades.length) * 100);
}

/**
 * Calculate profit factor
 */
export function calculateProfitFactor(trades: Trade[]): number {
  const closedTrades = trades.filter(t => !t.is_open && t.pnl !== null);
  
  const grossProfit = closedTrades
    .filter(t => (t.pnl || 0) > 0)
    .reduce((sum, t) => sum + (t.pnl || 0), 0);
  
  const grossLoss = Math.abs(
    closedTrades
      .filter(t => (t.pnl || 0) < 0)
      .reduce((sum, t) => sum + (t.pnl || 0), 0)
  );
  
  if (grossLoss === 0) return grossProfit > 0 ? Infinity : 0;
  return Math.round((grossProfit / grossLoss) * 100) / 100;
}

/**
 * Calculate session statistics
 */
export function calculateSessionStats(trades: Trade[]): {
  totalTrades: number;
  winners: number;
  losers: number;
  scratches: number;
  grossProfit: number;
  grossLoss: number;
  netPnl: number;
  winRate: number;
  profitFactor: number;
  equityHigh: number;
  maxDrawdownFromHigh: number;
} {
  const closedTrades = trades.filter(t => !t.is_open && t.pnl !== null);
  
  const winners = closedTrades.filter(t => (t.pnl || 0) > 0);
  const losers = closedTrades.filter(t => (t.pnl || 0) < 0);
  const scratches = closedTrades.filter(t => t.exit_type === 'scratch' || t.pnl === 0);
  
  const grossProfit = winners.reduce((sum, t) => sum + (t.pnl || 0), 0);
  const grossLoss = Math.abs(losers.reduce((sum, t) => sum + (t.pnl || 0), 0));
  const netPnl = grossProfit - grossLoss;
  
  // Calculate equity curve and drawdown
  let runningPnl = 0;
  let equityHigh = 0;
  let maxDrawdownFromHigh = 0;
  
  // Sort by time
  const sortedTrades = [...closedTrades].sort(
    (a, b) => new Date(a.trade_time).getTime() - new Date(b.trade_time).getTime()
  );
  
  for (const trade of sortedTrades) {
    runningPnl += trade.pnl || 0;
    if (runningPnl > equityHigh) {
      equityHigh = runningPnl;
    }
    const drawdown = equityHigh - runningPnl;
    if (drawdown > maxDrawdownFromHigh) {
      maxDrawdownFromHigh = drawdown;
    }
  }
  
  return {
    totalTrades: closedTrades.length,
    winners: winners.length,
    losers: losers.length,
    scratches: scratches.length,
    grossProfit,
    grossLoss,
    netPnl,
    winRate: calculateWinRate(trades),
    profitFactor: calculateProfitFactor(trades),
    equityHigh,
    maxDrawdownFromHigh,
  };
}

/**
 * Calculate win rate breakdown by category
 */
export function calculateWinRateByCategory<T extends string>(
  trades: Trade[],
  categoryFn: (trade: Trade) => T,
  labels: Record<T, string>
): WinRateBreakdown[] {
  const closedTrades = trades.filter(t => !t.is_open && t.pnl !== null);
  const categories = new Map<T, { wins: number; losses: number }>();
  
  for (const trade of closedTrades) {
    const category = categoryFn(trade);
    const current = categories.get(category) || { wins: 0, losses: 0 };
    
    if ((trade.pnl || 0) > 0) {
      current.wins++;
    } else {
      current.losses++;
    }
    
    categories.set(category, current);
  }
  
  return Array.from(categories.entries()).map(([category, stats]) => ({
    category: labels[category] || category,
    wins: stats.wins,
    losses: stats.losses,
    total: stats.wins + stats.losses,
    win_rate: Math.round((stats.wins / (stats.wins + stats.losses)) * 100),
  }));
}

/**
 * Calculate Ready to Fund metrics
 */
export function calculateReadyToFund(trades: Trade[], sessions: Session[]): {
  tradesCount: number;
  winRate: number;
  profitFactor: number;
  largestLoss: number;
  worstDay: number;
  consecutiveProfitableDays: number;
  criteria: {
    trades: boolean;
    winRate: boolean;
    profitFactor: boolean;
    largestLoss: boolean;
    worstDay: boolean;
  };
  allCriteriaMet: boolean;
} {
  const closedTrades = trades.filter(t => !t.is_open && t.pnl !== null);
  const winRate = calculateWinRate(trades);
  const profitFactor = calculateProfitFactor(trades);
  
  // Largest single loss
  const largestLoss = Math.abs(
    Math.min(...closedTrades.map(t => t.pnl || 0), 0)
  );
  
  // Worst day P&L
  const dayPnLs = sessions.map(s => s.net_pnl);
  const worstDay = Math.abs(Math.min(...dayPnLs, 0));
  
  // Consecutive profitable days
  let maxConsecutive = 0;
  let currentConsecutive = 0;
  
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  for (const session of sortedSessions) {
    if (session.net_pnl > 0) {
      currentConsecutive++;
      maxConsecutive = Math.max(maxConsecutive, currentConsecutive);
    } else {
      currentConsecutive = 0;
    }
  }
  
  const criteria = {
    trades: closedTrades.length >= 50,
    winRate: winRate >= 45,
    profitFactor: profitFactor >= 1.3,
    largestLoss: largestLoss <= 75,
    worstDay: worstDay <= 150,
  };
  
  return {
    tradesCount: closedTrades.length,
    winRate,
    profitFactor,
    largestLoss,
    worstDay,
    consecutiveProfitableDays: maxConsecutive,
    criteria,
    allCriteriaMet: Object.values(criteria).every(Boolean),
  };
}

/**
 * Format currency
 */
export function formatCurrency(value: number): string {
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}$${Math.abs(value).toFixed(2)}`;
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(0)}%`;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get today's date string in YYYY-MM-DD format
 */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current time string in HH:MM:SS format
 */
export function getCurrentTimeString(): string {
  return new Date().toTimeString().split(' ')[0];
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format time for display
 */
export function formatTime(timeString: string): string {
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
}
