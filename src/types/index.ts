// Core types for the Orderflow Trade Journal

export type MarketState = 'balance' | 'imbalance';

export type LocationType = 
  | 'lvn' 
  | 'poc' 
  | 'vwap_band' 
  | 'prior_day_high' 
  | 'prior_day_low' 
  | 'overnight_high' 
  | 'overnight_low' 
  | 'other';

export type AggressionType = 
  | 'absorption' 
  | 'delta_flip' 
  | 'stacked_imbalance' 
  | 'big_prints' 
  | 'none';

export type SetupGrade = 'A' | 'B' | 'C';

export type Direction = 'long' | 'short';

export type ExitType = 'target' | 'stop' | 'scratch' | 'manual';

export type PremarketBias = 'bullish' | 'bearish' | 'neutral';

export interface Trade {
  id: string;
  session_id: string;
  user_id: string;
  created_at: string;
  
  // Time
  trade_time: string;
  
  // Pre-Trade: 3 Elements
  market_state: MarketState;
  location_type: LocationType;
  location_price: number;
  aggression_type: AggressionType;
  prism_confirmation: boolean;
  setup_grade: SetupGrade;
  
  // Execution
  direction: Direction;
  entry_price: number;
  stop_price: number;
  target_price: number;
  position_size: number;
  planned_rr: number;
  
  // Result
  exit_price: number | null;
  exit_type: ExitType | null;
  pnl: number | null;
  actual_rr: number | null;
  
  // Status
  is_open: boolean;
  
  // Notes
  notes: string;
  what_worked: string;
  what_to_improve: string;
}

export interface Session {
  id: string;
  user_id: string;
  date: string;
  created_at: string;
  
  // Pre-Market Levels
  prior_day_high: number | null;
  prior_day_low: number | null;
  prior_day_close: number | null;
  overnight_high: number | null;
  overnight_low: number | null;
  lvn_levels: number[];
  poc_level: number | null;
  
  // Bias
  premarket_bias: PremarketBias;
  market_state_at_open: MarketState | null;
  
  // Notes
  daily_thesis: string;
  daily_review: string;
  tomorrow_focus: string;
  
  // Computed (stored for quick access)
  total_trades: number;
  winners: number;
  losers: number;
  scratches: number;
  gross_profit: number;
  gross_loss: number;
  net_pnl: number;
  equity_high: number;
  max_drawdown_from_high: number;
}

export interface UserStats {
  total_trades: number;
  total_sessions: number;
  overall_win_rate: number;
  overall_profit_factor: number;
  
  // Ready to Fund metrics
  ready_to_fund: {
    trades_count: number;
    win_rate: number;
    profit_factor: number;
    largest_loss: number;
    worst_day: number;
    consecutive_profitable_days: number;
    all_criteria_met: boolean;
  };
}

export interface WinRateBreakdown {
  category: string;
  wins: number;
  losses: number;
  total: number;
  win_rate: number;
}

// Form types for creating/editing
export interface TradeFormData {
  market_state: MarketState;
  location_type: LocationType;
  location_price: string;
  aggression_type: AggressionType;
  prism_confirmation: boolean;
  setup_grade: SetupGrade;
  direction: Direction;
  entry_price: string;
  stop_price: string;
  target_price: string;
  position_size: string;
  notes: string;
}

export interface TradeCloseData {
  exit_price: string;
  exit_type: ExitType;
  what_worked: string;
  what_to_improve: string;
}

export interface SessionFormData {
  prior_day_high: string;
  prior_day_low: string;
  prior_day_close: string;
  overnight_high: string;
  overnight_low: string;
  lvn_levels: string;
  poc_level: string;
  premarket_bias: PremarketBias;
  daily_thesis: string;
}

// Display helpers
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  lvn: 'LVN',
  poc: 'POC',
  vwap_band: 'VWAP Band',
  prior_day_high: 'Prior Day High',
  prior_day_low: 'Prior Day Low',
  overnight_high: 'Overnight High',
  overnight_low: 'Overnight Low',
  other: 'Other',
};

export const AGGRESSION_TYPE_LABELS: Record<AggressionType, string> = {
  absorption: 'Absorption',
  delta_flip: 'Delta Flip',
  stacked_imbalance: 'Stacked Imbalance',
  big_prints: 'Big Prints',
  none: 'None',
};

export const EXIT_TYPE_LABELS: Record<ExitType, string> = {
  target: 'Target Hit',
  stop: 'Stopped Out',
  scratch: 'Scratched',
  manual: 'Manual Exit',
};
