import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Toggle, Checkbox, Modal } from '../common';
import type { 
  TradeFormData, 
  MarketState, 
  LocationType, 
  AggressionType, 
  SetupGrade,
  Direction,
} from '../../types';
import {
  LOCATION_TYPE_LABELS,
  AGGRESSION_TYPE_LABELS,
} from '../../types';
import { calculatePlannedRR } from '../../lib/utils';

interface TradeEntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TradeFormData) => void;
}

const initialFormData: TradeFormData = {
  market_state: 'balance',
  location_type: 'lvn',
  location_price: '',
  aggression_type: 'absorption',
  prism_confirmation: false,
  setup_grade: 'B',
  direction: 'long',
  entry_price: '',
  stop_price: '',
  target_price: '',
  position_size: '1',
  notes: '',
};

export const TradeEntryForm: React.FC<TradeEntryFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<TradeFormData>(initialFormData);
  const [plannedRR, setPlannedRR] = useState<number>(0);

  // Calculate R:R when prices change
  useEffect(() => {
    const entry = parseFloat(formData.entry_price);
    const stop = parseFloat(formData.stop_price);
    const target = parseFloat(formData.target_price);
    
    if (entry && stop && target) {
      const rr = calculatePlannedRR(formData.direction, entry, stop, target);
      setPlannedRR(rr);
    } else {
      setPlannedRR(0);
    }
  }, [formData.entry_price, formData.stop_price, formData.target_price, formData.direction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData(initialFormData);
    onClose();
  };

  const updateField = <K extends keyof TradeFormData>(
    field: K,
    value: TradeFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const locationOptions = Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const aggressionOptions = Object.entries(AGGRESSION_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  // Determine setup grade based on elements
  const hasAllThree = formData.prism_confirmation && formData.aggression_type !== 'none';
  const suggestedGrade: SetupGrade = hasAllThree ? 'A' : formData.aggression_type !== 'none' ? 'B' : 'C';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Trade" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: The 3 Elements */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
            The 3 Elements
          </h4>
          
          <div className="grid grid-cols-2 gap-4">
            <Toggle
              label="Market State"
              options={[
                { value: 'balance', label: 'Balance' },
                { value: 'imbalance', label: 'Imbalance' },
              ]}
              value={formData.market_state}
              onChange={(v) => updateField('market_state', v as MarketState)}
            />
            
            <Select
              label="Location Type"
              options={locationOptions}
              value={formData.location_type}
              onChange={(e) => updateField('location_type', e.target.value as LocationType)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Location Price"
              type="number"
              step="0.01"
              placeholder="21450.00"
              value={formData.location_price}
              onChange={(e) => updateField('location_price', e.target.value)}
              required
            />
            
            <Select
              label="Aggression Type"
              options={aggressionOptions}
              value={formData.aggression_type}
              onChange={(e) => updateField('aggression_type', e.target.value as AggressionType)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Checkbox
              label="Prism Confirmation (saw bubbles)"
              checked={formData.prism_confirmation}
              onChange={(checked) => updateField('prism_confirmation', checked)}
            />
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Setup Grade:</span>
              <div className="flex gap-1">
                {(['A', 'B', 'C'] as SetupGrade[]).map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => updateField('setup_grade', grade)}
                    className={`w-8 h-8 rounded font-bold text-sm transition-colors ${
                      formData.setup_grade === grade
                        ? grade === 'A' 
                          ? 'bg-green-600 text-white'
                          : grade === 'B'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-red-600 text-white'
                        : 'bg-[#262626] text-gray-400 hover:bg-[#333]'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
              {suggestedGrade !== formData.setup_grade && (
                <span className="text-xs text-gray-500">(suggested: {suggestedGrade})</span>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Execution */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-green-400 uppercase tracking-wide">
            Execution
          </h4>
          
          <Toggle
            label="Direction"
            options={[
              { value: 'long', label: '🟢 Long' },
              { value: 'short', label: '🔴 Short' },
            ]}
            value={formData.direction}
            onChange={(v) => updateField('direction', v as Direction)}
          />
          
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Entry Price"
              type="number"
              step="0.01"
              placeholder="21450.00"
              value={formData.entry_price}
              onChange={(e) => updateField('entry_price', e.target.value)}
              required
            />
            
            <Input
              label="Stop Price"
              type="number"
              step="0.01"
              placeholder="21440.00"
              value={formData.stop_price}
              onChange={(e) => updateField('stop_price', e.target.value)}
              required
            />
            
            <Input
              label="Target Price"
              type="number"
              step="0.01"
              placeholder="21475.00"
              value={formData.target_price}
              onChange={(e) => updateField('target_price', e.target.value)}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Position Size (MNQ contracts)"
              type="number"
              min="1"
              value={formData.position_size}
              onChange={(e) => updateField('position_size', e.target.value)}
            />
            
            <div className="flex flex-col">
              <label className="text-sm text-gray-400 mb-1">Planned R:R</label>
              <div className={`bg-[#262626] border border-[#404040] rounded-lg px-3 py-2 font-mono ${
                plannedRR >= 2 ? 'text-green-400' : plannedRR >= 1.5 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                1:{plannedRR.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Notes */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wide">
            Notes
          </h4>
          
          <textarea
            className="input min-h-[80px] resize-none"
            placeholder="Trade thesis, observations..."
            value={formData.notes}
            onChange={(e) => updateField('notes', e.target.value)}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4 border-t border-[#404040]">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" variant="success" className="flex-1">
            Enter Trade
          </Button>
        </div>
      </form>
    </Modal>
  );
};
