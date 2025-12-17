import React from 'react';
import type { Trade } from '../../types';
import { LOCATION_TYPE_LABELS, AGGRESSION_TYPE_LABELS, EXIT_TYPE_LABELS } from '../../types';
import { formatCurrency, formatTime } from '../../lib/utils';
import { Badge, Button } from '../common';

interface TradeCardProps {
  trade: Trade;
  onClose?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
  showDetails?: boolean;
}

export const TradeCard: React.FC<TradeCardProps> = ({
  trade,
  onClose,
  onDelete,
  showDetails = false,
}) => {
  const isWinner = trade.pnl !== null && trade.pnl > 0;
  const isLoser = trade.pnl !== null && trade.pnl < 0;

  return (
    <div className={`bg-[#1a1a1a] border rounded-lg p-4 ${
      trade.is_open 
        ? 'border-blue-500/50' 
        : isWinner 
        ? 'border-green-500/30' 
        : isLoser 
        ? 'border-red-500/30' 
        : 'border-[#404040]'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className={`text-lg font-bold ${
            trade.direction === 'long' ? 'text-green-400' : 'text-red-400'
          }`}>
            {trade.direction === 'long' ? '▲' : '▼'}
          </span>
          <span className="text-sm text-gray-400">{formatTime(trade.trade_time)}</span>
          <Badge variant={
            trade.setup_grade === 'A' ? 'success' : 
            trade.setup_grade === 'B' ? 'warning' : 'danger'
          }>
            {trade.setup_grade}-Setup
          </Badge>
          {trade.prism_confirmation && (
            <Badge variant="success">Prism ✓</Badge>
          )}
          {trade.is_open && (
            <Badge variant="default">OPEN</Badge>
          )}
        </div>
        
        <div className="text-right">
          {trade.pnl !== null ? (
            <span className={`text-lg font-bold ${
              trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {formatCurrency(trade.pnl)}
            </span>
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </div>
      </div>

      {/* Price Info */}
      <div className="grid grid-cols-4 gap-4 mb-3 text-sm">
        <div>
          <div className="text-gray-500">Entry</div>
          <div className="font-mono">{trade.entry_price}</div>
        </div>
        <div>
          <div className="text-gray-500">Stop</div>
          <div className="font-mono text-red-400">{trade.stop_price}</div>
        </div>
        <div>
          <div className="text-gray-500">Target</div>
          <div className="font-mono text-green-400">{trade.target_price}</div>
        </div>
        <div>
          <div className="text-gray-500">Exit</div>
          <div className="font-mono">
            {trade.exit_price ?? '—'}
          </div>
        </div>
      </div>

      {/* Setup Info */}
      <div className="flex flex-wrap gap-2 text-xs mb-3">
        <span className="px-2 py-1 bg-[#262626] rounded text-gray-400">
          {trade.market_state === 'balance' ? 'Balance' : 'Imbalance'}
        </span>
        <span className="px-2 py-1 bg-[#262626] rounded text-gray-400">
          {LOCATION_TYPE_LABELS[trade.location_type]}
        </span>
        <span className="px-2 py-1 bg-[#262626] rounded text-gray-400">
          {AGGRESSION_TYPE_LABELS[trade.aggression_type]}
        </span>
        {trade.exit_type && (
          <span className="px-2 py-1 bg-[#262626] rounded text-gray-400">
            {EXIT_TYPE_LABELS[trade.exit_type]}
          </span>
        )}
        <span className="px-2 py-1 bg-[#262626] rounded text-gray-400">
          {trade.position_size} MNQ
        </span>
        <span className="px-2 py-1 bg-[#262626] rounded text-gray-400">
          R:R {trade.actual_rr !== null ? trade.actual_rr.toFixed(2) : trade.planned_rr.toFixed(2)}
        </span>
      </div>

      {/* Notes (if showDetails) */}
      {showDetails && trade.notes && (
        <div className="text-sm text-gray-400 mb-3 border-t border-[#404040] pt-3">
          <span className="text-gray-500">Notes: </span>
          {trade.notes}
        </div>
      )}

      {/* Reflection (if closed and showDetails) */}
      {showDetails && !trade.is_open && (trade.what_worked || trade.what_to_improve) && (
        <div className="text-sm border-t border-[#404040] pt-3 space-y-2">
          {trade.what_worked && (
            <div>
              <span className="text-green-400">✓ What worked: </span>
              <span className="text-gray-400">{trade.what_worked}</span>
            </div>
          )}
          {trade.what_to_improve && (
            <div>
              <span className="text-yellow-400">→ Improve: </span>
              <span className="text-gray-400">{trade.what_to_improve}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {trade.is_open && (onClose || onDelete) && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-[#404040]">
          {onClose && (
            <Button 
              variant="primary" 
              size="sm" 
              onClick={() => onClose(trade)}
              className="flex-1"
            >
              Close Trade
            </Button>
          )}
          {onDelete && (
            <Button 
              variant="danger" 
              size="sm" 
              onClick={() => onDelete(trade)}
            >
              Delete
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

interface TradeListProps {
  trades: Trade[];
  onClose?: (trade: Trade) => void;
  onDelete?: (trade: Trade) => void;
  showDetails?: boolean;
  emptyMessage?: string;
}

export const TradeList: React.FC<TradeListProps> = ({
  trades,
  onClose,
  onDelete,
  showDetails = false,
  emptyMessage = 'No trades yet',
}) => {
  if (trades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  // Sort by time, most recent first
  const sortedTrades = [...trades].sort((a, b) => {
    const timeA = new Date(`2000-01-01T${a.trade_time}`).getTime();
    const timeB = new Date(`2000-01-01T${b.trade_time}`).getTime();
    return timeB - timeA;
  });

  return (
    <div className="space-y-3">
      {sortedTrades.map(trade => (
        <TradeCard
          key={trade.id}
          trade={trade}
          onClose={onClose}
          onDelete={onDelete}
          showDetails={showDetails}
        />
      ))}
    </div>
  );
};
