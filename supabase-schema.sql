-- Orderflow Trade Journal - Supabase Schema
-- Run this in your Supabase SQL editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'local',
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Pre-Market Levels
  prior_day_high DECIMAL(10, 2),
  prior_day_low DECIMAL(10, 2),
  prior_day_close DECIMAL(10, 2),
  overnight_high DECIMAL(10, 2),
  overnight_low DECIMAL(10, 2),
  lvn_levels DECIMAL(10, 2)[] DEFAULT '{}',
  poc_level DECIMAL(10, 2),
  
  -- Bias
  premarket_bias TEXT CHECK (premarket_bias IN ('bullish', 'bearish', 'neutral')) DEFAULT 'neutral',
  market_state_at_open TEXT CHECK (market_state_at_open IN ('balance', 'imbalance')),
  
  -- Notes
  daily_thesis TEXT DEFAULT '',
  daily_review TEXT DEFAULT '',
  tomorrow_focus TEXT DEFAULT '',
  
  -- Computed stats (updated after each trade)
  total_trades INTEGER DEFAULT 0,
  winners INTEGER DEFAULT 0,
  losers INTEGER DEFAULT 0,
  scratches INTEGER DEFAULT 0,
  gross_profit DECIMAL(10, 2) DEFAULT 0,
  gross_loss DECIMAL(10, 2) DEFAULT 0,
  net_pnl DECIMAL(10, 2) DEFAULT 0,
  equity_high DECIMAL(10, 2) DEFAULT 0,
  max_drawdown_from_high DECIMAL(10, 2) DEFAULT 0,
  
  -- Indexes
  UNIQUE(user_id, date)
);

-- Trades table
CREATE TABLE IF NOT EXISTS trades (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL DEFAULT 'local',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Time
  trade_time TIME NOT NULL,
  
  -- Pre-Trade: 3 Elements
  market_state TEXT CHECK (market_state IN ('balance', 'imbalance')) NOT NULL,
  location_type TEXT CHECK (location_type IN ('lvn', 'poc', 'vwap_band', 'prior_day_high', 'prior_day_low', 'overnight_high', 'overnight_low', 'other')) NOT NULL,
  location_price DECIMAL(10, 2) NOT NULL,
  aggression_type TEXT CHECK (aggression_type IN ('absorption', 'delta_flip', 'stacked_imbalance', 'big_prints', 'none')) NOT NULL,
  prism_confirmation BOOLEAN DEFAULT FALSE,
  setup_grade TEXT CHECK (setup_grade IN ('A', 'B', 'C')) NOT NULL,
  
  -- Execution
  direction TEXT CHECK (direction IN ('long', 'short')) NOT NULL,
  entry_price DECIMAL(10, 2) NOT NULL,
  stop_price DECIMAL(10, 2) NOT NULL,
  target_price DECIMAL(10, 2) NOT NULL,
  position_size INTEGER DEFAULT 1,
  planned_rr DECIMAL(5, 2),
  
  -- Result
  exit_price DECIMAL(10, 2),
  exit_type TEXT CHECK (exit_type IN ('target', 'stop', 'scratch', 'manual')),
  pnl DECIMAL(10, 2),
  actual_rr DECIMAL(5, 2),
  
  -- Status
  is_open BOOLEAN DEFAULT TRUE,
  
  -- Notes
  notes TEXT DEFAULT '',
  what_worked TEXT DEFAULT '',
  what_to_improve TEXT DEFAULT ''
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON sessions(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_trades_session ON trades(session_id);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_created ON trades(created_at DESC);

-- Row Level Security (RLS) - Optional but recommended
-- Uncomment these if you want user-specific data isolation

-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE trades ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can only see their own sessions"
--   ON sessions FOR ALL
--   USING (user_id = auth.uid()::text);

-- CREATE POLICY "Users can only see their own trades"
--   ON trades FOR ALL
--   USING (user_id = auth.uid()::text);

-- Grant permissions for anonymous access (for development)
-- In production, you'd use authenticated access with RLS
GRANT ALL ON sessions TO anon;
GRANT ALL ON trades TO anon;
