import React, { useState } from 'react';
import { useTradeStore } from '../../stores/tradeStore';
import { Card, Badge } from '../common';
import { TradeList } from '../trade/TradeList';
import { formatDate, formatCurrency } from '../../lib/utils';
import type { Session, Trade } from '../../types';
import { ChevronDown, ChevronUp, Calendar } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const { sessions, trades } = useTradeStore();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  // Sort sessions by date, most recent first
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const toggleSession = (sessionId: string) => {
    setExpandedSession(prev => prev === sessionId ? null : sessionId);
  };

  const getSessionTrades = (sessionId: string) => {
    return trades.filter(t => t.session_id === sessionId);
  };

  if (sortedSessions.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar size={48} className="mx-auto text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Session History</h2>
        <p className="text-gray-400">Start your first trading session to see history here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Session History</h1>

      <div className="space-y-3">
        {sortedSessions.map(session => {
          const sessionTrades = getSessionTrades(session.id);
          const isExpanded = expandedSession === session.id;

          return (
            <SessionCard
              key={session.id}
              session={session}
              trades={sessionTrades}
              isExpanded={isExpanded}
              onToggle={() => toggleSession(session.id)}
            />
          );
        })}
      </div>
    </div>
  );
};

interface SessionCardProps {
  session: Session;
  trades: Trade[];
  isExpanded: boolean;
  onToggle: () => void;
}

const SessionCard: React.FC<SessionCardProps> = ({
  session,
  trades,
  isExpanded,
  onToggle,
}) => {
  const closedTrades = trades.filter(t => !t.is_open);
  const winners = closedTrades.filter(t => (t.pnl || 0) > 0).length;
  const losers = closedTrades.filter(t => (t.pnl || 0) < 0).length;
  const winRate = closedTrades.length > 0 
    ? Math.round((winners / closedTrades.length) * 100) 
    : 0;

  return (
    <Card className="overflow-hidden">
      {/* Header - Always visible */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <div>
            <div className="font-semibold">{formatDate(session.date)}</div>
            <div className="text-sm text-gray-400">
              {session.total_trades} trades • {winners}W / {losers}L
            </div>
          </div>
          
          <Badge variant={
            session.premarket_bias === 'bullish' ? 'success' :
            session.premarket_bias === 'bearish' ? 'danger' : 'default'
          }>
            {session.premarket_bias}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className={`text-lg font-bold ${
              session.net_pnl >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(session.net_pnl)}
            </div>
            <div className="text-sm text-gray-400">
              {winRate}% WR
            </div>
          </div>
          
          {isExpanded ? (
            <ChevronUp className="text-gray-400" size={20} />
          ) : (
            <ChevronDown className="text-gray-400" size={20} />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-[#404040] space-y-4">
          {/* Session Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Equity High: </span>
              <span className="font-mono text-green-400">
                {formatCurrency(session.equity_high)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Max DD: </span>
              <span className="font-mono text-red-400">
                {formatCurrency(session.max_drawdown_from_high)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Gross Profit: </span>
              <span className="font-mono text-green-400">
                {formatCurrency(session.gross_profit)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Gross Loss: </span>
              <span className="font-mono text-red-400">
                {formatCurrency(session.gross_loss)}
              </span>
            </div>
          </div>

          {/* Pre-Market Levels */}
          {(session.prior_day_high || session.overnight_high || session.poc_level) && (
            <div className="bg-[#262626] rounded-lg p-3">
              <div className="text-xs text-gray-500 uppercase mb-2">Levels</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {session.prior_day_high && (
                  <div>
                    <span className="text-gray-500">PDH: </span>
                    <span className="font-mono">{session.prior_day_high}</span>
                  </div>
                )}
                {session.prior_day_low && (
                  <div>
                    <span className="text-gray-500">PDL: </span>
                    <span className="font-mono">{session.prior_day_low}</span>
                  </div>
                )}
                {session.overnight_high && (
                  <div>
                    <span className="text-gray-500">ONH: </span>
                    <span className="font-mono">{session.overnight_high}</span>
                  </div>
                )}
                {session.overnight_low && (
                  <div>
                    <span className="text-gray-500">ONL: </span>
                    <span className="font-mono">{session.overnight_low}</span>
                  </div>
                )}
                {session.poc_level && (
                  <div>
                    <span className="text-gray-500">POC: </span>
                    <span className="font-mono">{session.poc_level}</span>
                  </div>
                )}
                {session.lvn_levels.length > 0 && (
                  <div className="col-span-2">
                    <span className="text-gray-500">LVNs: </span>
                    <span className="font-mono">{session.lvn_levels.join(', ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Daily Thesis */}
          {session.daily_thesis && (
            <div className="text-sm">
              <span className="text-gray-500">Thesis: </span>
              <span className="text-gray-300">{session.daily_thesis}</span>
            </div>
          )}

          {/* Daily Review */}
          {session.daily_review && (
            <div className="text-sm">
              <span className="text-gray-500">Review: </span>
              <span className="text-gray-300">{session.daily_review}</span>
            </div>
          )}

          {/* Trades */}
          <div>
            <div className="text-sm text-gray-500 mb-2">Trades</div>
            <TradeList 
              trades={closedTrades} 
              showDetails 
              emptyMessage="No trades in this session"
            />
          </div>
        </div>
      )}
    </Card>
  );
};
