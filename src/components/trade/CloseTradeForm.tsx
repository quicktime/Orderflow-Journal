import React, { useState } from 'react';
import { Button, Input, Select, Modal } from '../common';
import type { Trade, TradeCloseData, ExitType } from '../../types';
import { EXIT_TYPE_LABELS } from '../../types';
import { calculatePnL, formatCurrency } from '../../lib/utils';

interface CloseTradeFormProps {
  isOpen: boolean;
  onClose: () => void;
  trade: Trade | null;
  onSubmit: (data: TradeCloseData) => void;
}

export const CloseTradeForm: React.FC<CloseTradeFormProps> = ({
  isOpen,
  onClose,
  trade,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<TradeCloseData>({
    exit_price: '',
    exit_type: 'manual',
    what_worked: '',
    what_to_improve: '',
  });

  const [previewPnL, setPreviewPnL] = useState<number | null>(null);

  if (!trade) return null;

  const handleExitPriceChange = (value: string) => {
    setFormData(prev => ({ ...prev, exit_price: value }));
    
    const exitPrice = parseFloat(value);
    if (exitPrice) {
      const pnl = calculatePnL(trade.direction, trade.entry_price, exitPrice, trade.position_size);
      setPreviewPnL(pnl);
    } else {
      setPreviewPnL(null);
    }
  };

  const handleQuickExit = (type: 'target' | 'stop') => {
    const price = type === 'target' ? trade.target_price : trade.stop_price;
    setFormData(prev => ({ 
      ...prev, 
      exit_price: price.toString(),
      exit_type: type,
    }));
    
    const pnl = calculatePnL(trade.direction, trade.entry_price, price, trade.position_size);
    setPreviewPnL(pnl);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      exit_price: '',
      exit_type: 'manual',
      what_worked: '',
      what_to_improve: '',
    });
    setPreviewPnL(null);
    onClose();
  };

  const exitTypeOptions = Object.entries(EXIT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Close Trade" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Trade Summary */}
        <div className="bg-[#262626] rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Direction</span>
            <span className={trade.direction === 'long' ? 'text-green-400' : 'text-red-400'}>
              {trade.direction === 'long' ? '🟢 Long' : '🔴 Short'}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Entry</span>
            <span className="font-mono">{trade.entry_price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Stop</span>
            <span className="font-mono text-red-400">{trade.stop_price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Target</span>
            <span className="font-mono text-green-400">{trade.target_price}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Size</span>
            <span>{trade.position_size} MNQ</span>
          </div>
        </div>

        {/* Quick Exit Buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="success"
            className="flex-1"
            onClick={() => handleQuickExit('target')}
          >
            Target Hit ({trade.target_price})
          </Button>
          <Button
            type="button"
            variant="danger"
            className="flex-1"
            onClick={() => handleQuickExit('stop')}
          >
            Stopped Out ({trade.stop_price})
          </Button>
        </div>

        {/* Exit Details */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Exit Price"
              type="number"
              step="0.01"
              value={formData.exit_price}
              onChange={(e) => handleExitPriceChange(e.target.value)}
              required
            />
            
            <Select
              label="Exit Type"
              options={exitTypeOptions}
              value={formData.exit_type}
              onChange={(e) => setFormData(prev => ({ ...prev, exit_type: e.target.value as ExitType }))}
            />
          </div>

          {/* P&L Preview */}
          {previewPnL !== null && (
            <div className={`text-center py-3 rounded-lg ${
              previewPnL >= 0 ? 'bg-green-900/30' : 'bg-red-900/30'
            }`}>
              <div className="text-sm text-gray-400">Estimated P&L</div>
              <div className={`text-2xl font-bold ${
                previewPnL >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(previewPnL)}
              </div>
            </div>
          )}
        </div>

        {/* Post-Trade Reflection */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wide">
            Post-Trade Reflection
          </h4>
          
          <div>
            <label className="text-sm text-gray-400 mb-1 block">What worked well?</label>
            <textarea
              className="input min-h-[60px] resize-none"
              placeholder="Good entry timing, proper stop placement..."
              value={formData.what_worked}
              onChange={(e) => setFormData(prev => ({ ...prev, what_worked: e.target.value }))}
            />
          </div>
          
          <div>
            <label className="text-sm text-gray-400 mb-1 block">What to improve?</label>
            <textarea
              className="input min-h-[60px] resize-none"
              placeholder="Could have waited for better confirmation..."
              value={formData.what_to_improve}
              onChange={(e) => setFormData(prev => ({ ...prev, what_to_improve: e.target.value }))}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4 border-t border-[#404040]">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Close Trade
          </Button>
        </div>
      </form>
    </Modal>
  );
};
