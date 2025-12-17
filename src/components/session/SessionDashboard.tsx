import React, { useState, useMemo } from 'react';
import { useTradeStore } from '../../stores/tradeStore';
import { StatCard, Card, Button, ProgressBar } from '../common';
import { TradeEntryForm } from '../trade/TradeEntryForm';
import { CloseTradeForm } from '../trade/CloseTradeForm';
import { TradeList } from '../trade/TradeList';
import { PreMarketForm } from './PreMarketForm';
import type { Trade, TradeFormData, TradeCloseData } from '../../types';
import { calculateSessionStats, formatCurrency, getTodayString, formatDate } from '../../lib/utils';
import { Plus, AlertTriangle } from 'lucide-react';

export const SessionDashboard: React.FC = () => {
  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    createTrade, 
    closeTrade,
    deleteTrade,
    getTradesForSession,
    getCurrentSession,
  } = useTradeStore();

  const [isTradeFormOpen, setIsTradeFormOpen] = useState(false);
  const [isCloseFormOpen, setIsCloseFormOpen] = useState(false);
  const [isPreMarketOpen, setIsPreMarketOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const currentSession = getCurrentSession();
  const sessionTrades = currentSessionId ? getTradesForSession(currentSessionId) : [];
  
  const stats = useMemo(() => {
    return calculateSessionStats(sessionTrades);
  }, [sessionTrades]);

  const openTrades = sessionTrades.filter(t => t.is_open);
  const closedTrades = sessionTrades.filter(t => !t.is_open);

  // Check if we have a session for today
  const today = getTodayString();
  const hasSessionToday = sessions.some(s => s.date === today);

  const handleNewTrade = async (data: TradeFormData) => {
    if (!currentSessionId) return;
    await createTrade(currentSessionId, data);
  };

  const handleCloseTrade = async (data: TradeCloseData) => {
    if (!selectedTrade) return;
    await closeTrade(selectedTrade.id, data);
    setSelectedTrade(null);
  };

  const handleOpenCloseForm = (trade: Trade) => {
    setSelectedTrade(trade);
    setIsCloseFormOpen(true);
  };

  const handleDeleteTrade = async (trade: Trade) => {
    if (confirm('Are you sure you want to delete this trade?')) {
      await deleteTrade(trade.id);
    }
  };

  // If no session today, show pre-market form
  if (!hasSessionToday || !currentSession) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center">
          <h2 className="text-xl font-semibold mb-4">Start Today's Session</h2>
          <p className="text-gray-400 mb-6">
            Set up your pre-market levels and bias before trading.
          </p>
          <Button onClick={() => setIsPreMarketOpen(true)}>
            Begin Pre-Market Setup
          </Button>
        </Card>

        <PreMarketForm
          isOpen={isPreMarketOpen}
          onClose={() => setIsPreMarketOpen(false)}
          onSubmit={async (data) => {
            await createSession(data);
            setIsPreMarketOpen(false);
          }}
        />
      </div>
    );
  }

  // Apex drawdown simulation (example: $2,500 max)
  const maxDrawdown = 2500;
  const usedDrawdown = stats.equityHigh - stats.netPnl;
  const drawdownPercent = (usedDrawdown / maxDrawdown) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Session Dashboard</h1>
          <p className="text-gray-400">{formatDate(currentSession.date)}</p>
        </div>
        <Button onClick={() => setIsTradeFormOpen(true)} className="flex items-center gap-2">
          <Plus size={20} />
          New Trade
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Net P&L"
          value={formatCurrency(stats.netPnl)}
          trend={stats.netPnl > 0 ? 'up' : stats.netPnl < 0 ? 'down' : 'neutral'}
          size="lg"
        />
        <StatCard
          label="Equity High"
          value={formatCurrency(stats.equityHigh)}
          subValue="Session peak"
        />
        <StatCard
          label="Win Rate"
          value={`${stats.winRate}%`}
          subValue={`${stats.winners}W / ${stats.losers}L`}
          trend={stats.winRate >= 50 ? 'up' : stats.winRate >= 40 ? 'neutral' : 'down'}
        />
        <StatCard
          label="Profit Factor"
          value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)}
          trend={stats.profitFactor >= 1.5 ? 'up' : stats.profitFactor >= 1 ? 'neutral' : 'down'}
        />
      </div>

      {/* Drawdown Tracker */}
      <Card>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className={drawdownPercent > 60 ? 'text-red-400' : drawdownPercent > 40 ? 'text-yellow-400' : 'text-gray-400'} />
            <span className="font-semibold">Equity High Drawdown Tracker</span>
          </div>
          <span className={`text-sm font-mono ${
            drawdownPercent > 60 ? 'text-red-400' : drawdownPercent > 40 ? 'text-yellow-400' : 'text-gray-400'
          }`}>
            {formatCurrency(usedDrawdown)} used of {formatCurrency(maxDrawdown)}
          </span>
        </div>
        <ProgressBar
          value={usedDrawdown}
          max={maxDrawdown}
          color={drawdownPercent > 60 ? 'red' : drawdownPercent > 40 ? 'yellow' : 'blue'}
          showPercent={false}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Equity High: {formatCurrency(stats.equityHigh)}</span>
          <span>Current: {formatCurrency(stats.netPnl)}</span>
          <span>Remaining: {formatCurrency(maxDrawdown - usedDrawdown)}</span>
        </div>
      </Card>

      {/* Pre-Market Levels */}
      <Card title="Today's Levels">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {currentSession.prior_day_high && (
            <div>
              <span className="text-gray-500">PDH: </span>
              <span className="font-mono text-red-400">{currentSession.prior_day_high}</span>
            </div>
          )}
          {currentSession.prior_day_low && (
            <div>
              <span className="text-gray-500">PDL: </span>
              <span className="font-mono text-green-400">{currentSession.prior_day_low}</span>
            </div>
          )}
          {currentSession.overnight_high && (
            <div>
              <span className="text-gray-500">ONH: </span>
              <span className="font-mono text-orange-400">{currentSession.overnight_high}</span>
            </div>
          )}
          {currentSession.overnight_low && (
            <div>
              <span className="text-gray-500">ONL: </span>
              <span className="font-mono text-orange-400">{currentSession.overnight_low}</span>
            </div>
          )}
          {currentSession.poc_level && (
            <div>
              <span className="text-gray-500">POC: </span>
              <span className="font-mono text-blue-400">{currentSession.poc_level}</span>
            </div>
          )}
          {currentSession.lvn_levels.length > 0 && (
            <div className="col-span-2">
              <span className="text-gray-500">LVNs: </span>
              <span className="font-mono text-purple-400">
                {currentSession.lvn_levels.join(', ')}
              </span>
            </div>
          )}
        </div>
        <div className="mt-3 pt-3 border-t border-[#404040] flex items-center gap-4">
          <span className="text-gray-500">Bias:</span>
          <span className={`font-medium ${
            currentSession.premarket_bias === 'bullish' ? 'text-green-400' :
            currentSession.premarket_bias === 'bearish' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {currentSession.premarket_bias.charAt(0).toUpperCase() + currentSession.premarket_bias.slice(1)}
          </span>
          {currentSession.daily_thesis && (
            <>
              <span className="text-gray-600">|</span>
              <span className="text-gray-400 text-sm">{currentSession.daily_thesis}</span>
            </>
          )}
        </div>
      </Card>

      {/* Open Trades */}
      {openTrades.length > 0 && (
        <Card title={`Open Trades (${openTrades.length})`}>
          <TradeList
            trades={openTrades}
            onClose={handleOpenCloseForm}
            onDelete={handleDeleteTrade}
          />
        </Card>
      )}

      {/* Closed Trades */}
      <Card title={`Closed Trades (${closedTrades.length})`}>
        <TradeList
          trades={closedTrades}
          showDetails
          emptyMessage="No closed trades yet. Enter your first trade!"
        />
      </Card>

      {/* Forms */}
      <TradeEntryForm
        isOpen={isTradeFormOpen}
        onClose={() => setIsTradeFormOpen(false)}
        onSubmit={handleNewTrade}
      />

      <CloseTradeForm
        isOpen={isCloseFormOpen}
        onClose={() => {
          setIsCloseFormOpen(false);
          setSelectedTrade(null);
        }}
        trade={selectedTrade}
        onSubmit={handleCloseTrade}
      />
    </div>
  );
};
