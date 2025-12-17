import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Trade, Session, TradeFormData, TradeCloseData, SessionFormData } from '../types';
import { 
  generateId, 
  getTodayString, 
  getCurrentTimeString,
  calculatePlannedRR,
  calculatePnL,
  calculateActualRR,
  calculateSessionStats
} from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface TradeStore {
  // Data
  trades: Trade[];
  sessions: Session[];
  currentSessionId: string | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Session actions
  createSession: (data: SessionFormData) => Promise<Session>;
  updateSession: (id: string, data: Partial<Session>) => Promise<void>;
  getCurrentSession: () => Session | null;
  getSessionByDate: (date: string) => Session | null;
  
  // Trade actions
  createTrade: (sessionId: string, data: TradeFormData) => Promise<Trade>;
  closeTrade: (tradeId: string, data: TradeCloseData) => Promise<void>;
  updateTrade: (tradeId: string, data: Partial<Trade>) => Promise<void>;
  deleteTrade: (tradeId: string) => Promise<void>;
  getTradesForSession: (sessionId: string) => Trade[];
  
  // Sync actions
  syncWithSupabase: () => Promise<void>;
  loadFromSupabase: () => Promise<void>;
  
  // Export/Import
  exportData: () => string;
  importData: (jsonString: string) => Promise<void>;
  
  // Utility
  clearError: () => void;
}

export const useTradeStore = create<TradeStore>()(
  persist(
    (set, get) => ({
      trades: [],
      sessions: [],
      currentSessionId: null,
      isLoading: false,
      error: null,

      createSession: async (data: SessionFormData) => {
        const today = getTodayString();
        
        // Check if session already exists for today
        const existing = get().sessions.find(s => s.date === today);
        if (existing) {
          set({ currentSessionId: existing.id });
          return existing;
        }
        
        const session: Session = {
          id: generateId(),
          user_id: 'local', // Will be replaced with actual user ID when using Supabase auth
          date: today,
          created_at: new Date().toISOString(),
          prior_day_high: data.prior_day_high ? parseFloat(data.prior_day_high) : null,
          prior_day_low: data.prior_day_low ? parseFloat(data.prior_day_low) : null,
          prior_day_close: data.prior_day_close ? parseFloat(data.prior_day_close) : null,
          overnight_high: data.overnight_high ? parseFloat(data.overnight_high) : null,
          overnight_low: data.overnight_low ? parseFloat(data.overnight_low) : null,
          lvn_levels: data.lvn_levels 
            ? data.lvn_levels.split(',').map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
            : [],
          poc_level: data.poc_level ? parseFloat(data.poc_level) : null,
          premarket_bias: data.premarket_bias,
          market_state_at_open: null,
          daily_thesis: data.daily_thesis,
          daily_review: '',
          tomorrow_focus: '',
          total_trades: 0,
          winners: 0,
          losers: 0,
          scratches: 0,
          gross_profit: 0,
          gross_loss: 0,
          net_pnl: 0,
          equity_high: 0,
          max_drawdown_from_high: 0,
        };
        
        set(state => ({
          sessions: [...state.sessions, session],
          currentSessionId: session.id,
        }));
        
        // Sync to Supabase if configured
        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.from('sessions').insert(session);
          } catch (error) {
            console.error('Failed to sync session to Supabase:', error);
          }
        }
        
        return session;
      },

      updateSession: async (id: string, data: Partial<Session>) => {
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === id ? { ...s, ...data } : s
          ),
        }));
        
        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.from('sessions').update(data).eq('id', id);
          } catch (error) {
            console.error('Failed to update session in Supabase:', error);
          }
        }
      },

      getCurrentSession: () => {
        const { sessions, currentSessionId } = get();
        return sessions.find(s => s.id === currentSessionId) || null;
      },

      getSessionByDate: (date: string) => {
        return get().sessions.find(s => s.date === date) || null;
      },

      createTrade: async (sessionId: string, data: TradeFormData) => {
        const entryPrice = parseFloat(data.entry_price);
        const stopPrice = parseFloat(data.stop_price);
        const targetPrice = parseFloat(data.target_price);
        const positionSize = parseInt(data.position_size) || 1;
        
        const trade: Trade = {
          id: generateId(),
          session_id: sessionId,
          user_id: 'local',
          created_at: new Date().toISOString(),
          trade_time: getCurrentTimeString(),
          market_state: data.market_state,
          location_type: data.location_type,
          location_price: parseFloat(data.location_price),
          aggression_type: data.aggression_type,
          prism_confirmation: data.prism_confirmation,
          setup_grade: data.setup_grade,
          direction: data.direction,
          entry_price: entryPrice,
          stop_price: stopPrice,
          target_price: targetPrice,
          position_size: positionSize,
          planned_rr: calculatePlannedRR(data.direction, entryPrice, stopPrice, targetPrice),
          exit_price: null,
          exit_type: null,
          pnl: null,
          actual_rr: null,
          is_open: true,
          notes: data.notes,
          what_worked: '',
          what_to_improve: '',
        };
        
        set(state => ({
          trades: [...state.trades, trade],
        }));
        
        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.from('trades').insert(trade);
          } catch (error) {
            console.error('Failed to sync trade to Supabase:', error);
          }
        }
        
        return trade;
      },

      closeTrade: async (tradeId: string, data: TradeCloseData) => {
        const trade = get().trades.find(t => t.id === tradeId);
        if (!trade) return;
        
        const exitPrice = parseFloat(data.exit_price);
        const pnl = calculatePnL(trade.direction, trade.entry_price, exitPrice, trade.position_size);
        const actualRR = calculateActualRR(trade.direction, trade.entry_price, trade.stop_price, exitPrice);
        
        const updatedTrade: Partial<Trade> = {
          exit_price: exitPrice,
          exit_type: data.exit_type,
          pnl,
          actual_rr: actualRR,
          is_open: false,
          what_worked: data.what_worked,
          what_to_improve: data.what_to_improve,
        };
        
        set(state => ({
          trades: state.trades.map(t => 
            t.id === tradeId ? { ...t, ...updatedTrade } : t
          ),
        }));
        
        // Update session stats
        const { trades } = get();
        const sessionTrades = trades.filter(t => t.session_id === trade.session_id);
        const stats = calculateSessionStats(sessionTrades);
        
        set(state => ({
          sessions: state.sessions.map(s => 
            s.id === trade.session_id ? {
              ...s,
              total_trades: stats.totalTrades,
              winners: stats.winners,
              losers: stats.losers,
              scratches: stats.scratches,
              gross_profit: stats.grossProfit,
              gross_loss: stats.grossLoss,
              net_pnl: stats.netPnl,
              equity_high: stats.equityHigh,
              max_drawdown_from_high: stats.maxDrawdownFromHigh,
            } : s
          ),
        }));
        
        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.from('trades').update(updatedTrade).eq('id', tradeId);
          } catch (error) {
            console.error('Failed to update trade in Supabase:', error);
          }
        }
      },

      updateTrade: async (tradeId: string, data: Partial<Trade>) => {
        set(state => ({
          trades: state.trades.map(t => 
            t.id === tradeId ? { ...t, ...data } : t
          ),
        }));
        
        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.from('trades').update(data).eq('id', tradeId);
          } catch (error) {
            console.error('Failed to update trade in Supabase:', error);
          }
        }
      },

      deleteTrade: async (tradeId: string) => {
        set(state => ({
          trades: state.trades.filter(t => t.id !== tradeId),
        }));
        
        if (isSupabaseConfigured() && supabase) {
          try {
            await supabase.from('trades').delete().eq('id', tradeId);
          } catch (error) {
            console.error('Failed to delete trade from Supabase:', error);
          }
        }
      },

      getTradesForSession: (sessionId: string) => {
        return get().trades.filter(t => t.session_id === sessionId);
      },

      syncWithSupabase: async () => {
        if (!isSupabaseConfigured() || !supabase) return;
        
        set({ isLoading: true, error: null });
        
        try {
          const { trades, sessions } = get();
          
          // Upsert all local data
          if (sessions.length > 0) {
            await supabase.from('sessions').upsert(sessions);
          }
          if (trades.length > 0) {
            await supabase.from('trades').upsert(trades);
          }
        } catch (error) {
          set({ error: 'Failed to sync with Supabase' });
          console.error('Sync error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      loadFromSupabase: async () => {
        if (!isSupabaseConfigured() || !supabase) return;
        
        set({ isLoading: true, error: null });
        
        try {
          const { data: sessions, error: sessionsError } = await supabase
            .from('sessions')
            .select('*')
            .order('date', { ascending: false });
          
          const { data: trades, error: tradesError } = await supabase
            .from('trades')
            .select('*')
            .order('created_at', { ascending: false });
          
          if (sessionsError) throw sessionsError;
          if (tradesError) throw tradesError;
          
          set({
            sessions: sessions || [],
            trades: trades || [],
          });
        } catch (error) {
          set({ error: 'Failed to load from Supabase' });
          console.error('Load error:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      exportData: () => {
        const { trades, sessions } = get();
        return JSON.stringify({ trades, sessions, exportedAt: new Date().toISOString() }, null, 2);
      },

      importData: async (jsonString: string) => {
        try {
          const data = JSON.parse(jsonString);
          if (data.trades && data.sessions) {
            set({
              trades: data.trades,
              sessions: data.sessions,
            });
          } else {
            throw new Error('Invalid data format');
          }
        } catch (error) {
          set({ error: 'Failed to import data. Invalid format.' });
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'orderflow-journal-storage',
      partialize: (state) => ({
        trades: state.trades,
        sessions: state.sessions,
        currentSessionId: state.currentSessionId,
      }),
    }
  )
);
