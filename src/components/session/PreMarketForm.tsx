import React, { useState } from 'react';
import { Button, Input, Modal, Toggle } from '../common';
import type { SessionFormData, PremarketBias } from '../../types';

interface PreMarketFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SessionFormData) => void;
}

const initialFormData: SessionFormData = {
  prior_day_high: '',
  prior_day_low: '',
  prior_day_close: '',
  overnight_high: '',
  overnight_low: '',
  lvn_levels: '',
  poc_level: '',
  premarket_bias: 'neutral',
  daily_thesis: '',
};

export const PreMarketForm: React.FC<PreMarketFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<SessionFormData>(initialFormData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData(initialFormData);
  };

  const updateField = <K extends keyof SessionFormData>(
    field: K,
    value: SessionFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Pre-Market Setup" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Prior Day Levels */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wide">
            Prior Day Levels
          </h4>
          
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Prior Day High"
              type="number"
              step="0.01"
              placeholder="21500.00"
              value={formData.prior_day_high}
              onChange={(e) => updateField('prior_day_high', e.target.value)}
            />
            <Input
              label="Prior Day Low"
              type="number"
              step="0.01"
              placeholder="21350.00"
              value={formData.prior_day_low}
              onChange={(e) => updateField('prior_day_low', e.target.value)}
            />
            <Input
              label="Prior Day Close"
              type="number"
              step="0.01"
              placeholder="21425.00"
              value={formData.prior_day_close}
              onChange={(e) => updateField('prior_day_close', e.target.value)}
            />
          </div>
        </div>

        {/* Overnight Levels */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-orange-400 uppercase tracking-wide">
            Overnight Levels
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Overnight High"
              type="number"
              step="0.01"
              placeholder="21480.00"
              value={formData.overnight_high}
              onChange={(e) => updateField('overnight_high', e.target.value)}
            />
            <Input
              label="Overnight Low"
              type="number"
              step="0.01"
              placeholder="21380.00"
              value={formData.overnight_low}
              onChange={(e) => updateField('overnight_low', e.target.value)}
            />
          </div>
        </div>

        {/* Volume Profile Levels */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wide">
            Volume Profile Levels
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="POC Level"
              type="number"
              step="0.01"
              placeholder="21420.00"
              value={formData.poc_level}
              onChange={(e) => updateField('poc_level', e.target.value)}
            />
            <Input
              label="LVN Levels (comma-separated)"
              type="text"
              placeholder="21400, 21450, 21475"
              value={formData.lvn_levels}
              onChange={(e) => updateField('lvn_levels', e.target.value)}
            />
          </div>
        </div>

        {/* Daily Bias */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
            Daily Bias
          </h4>
          
          <Toggle
            label="Pre-Market Bias"
            options={[
              { value: 'bullish', label: '🟢 Bullish' },
              { value: 'neutral', label: '⚪ Neutral' },
              { value: 'bearish', label: '🔴 Bearish' },
            ]}
            value={formData.premarket_bias}
            onChange={(v) => updateField('premarket_bias', v as PremarketBias)}
          />
          
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Daily Thesis</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Today's game plan: Looking for longs at ONL if we get absorption, shorts at PDH if we fail to break..."
              value={formData.daily_thesis}
              onChange={(e) => updateField('daily_thesis', e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4 border-t border-[#404040]">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="primary" className="flex-1">
            Start Session
          </Button>
        </div>
      </form>
    </Modal>
  );
};
