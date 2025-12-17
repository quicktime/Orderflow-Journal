import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { useTradeStore } from '../../stores/tradeStore';
import { Card, StatCard, ProgressBar } from '../common';
import {
  calculateWinRateByCategory,
  calculateReadyToFund,
  calculateWinRate,
  calculateProfitFactor,
  formatCurrency,
} from '../../lib/utils';
import {
  LOCATION_TYPE_LABELS,
  AGGRESSION_TYPE_LABELS,
} from '../../types';
import type { SetupGrade, MarketState } from '../../types';
import { CheckCircle, Circle, Target, Award } from 'lucide-react';

const CHART_COLORS = {
  green: '#22c55e',
  red: '#ef4444',
  blue: '#3b82f6',
  yellow: '#eab308',
  purple: '#a855f7',
  gray: '#6b7280',
};

export const AnalyticsDashboard: React.FC = () => {
  const { trades, sessions } = useTradeStore();
  
  const closedTrades = useMemo(() => 
    trades.filter(t => !t.is_open && t.pnl !== null), 
    [trades]
  );

  // Win rate by setup grade
  const winRateByGrade = useMemo(() => {
    const gradeLabels: Record<SetupGrade, string> = { A: 'A-Setup', B: 'B-Setup', C: 'C-Setup' };
    return calculateWinRateByCategory(trades, t => t.setup_grade, gradeLabels);
  }, [trades]);

  // Win rate by aggression type
  const winRateByAggression = useMemo(() => {
    return calculateWinRateByCategory(trades, t => t.aggression_type, AGGRESSION_TYPE_LABELS);
  }, [trades]);

  // Win rate by location type
  const winRateByLocation = useMemo(() => {
    return calculateWinRateByCategory(trades, t => t.location_type, LOCATION_TYPE_LABELS);
  }, [trades]);

  // Win rate by market state
  const winRateByMarketState = useMemo(() => {
    const stateLabels: Record<MarketState, string> = { balance: 'Balance', imbalance: 'Imbalance' };
    return calculateWinRateByCategory(trades, t => t.market_state, stateLabels);
  }, [trades]);

  // Equity curve data
  const equityCurve = useMemo(() => {
    let runningPnl = 0;
    let equityHigh = 0;
    
    const sortedTrades = [...closedTrades].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    return sortedTrades.map((trade, index) => {
      runningPnl += trade.pnl || 0;
      equityHigh = Math.max(equityHigh, runningPnl);
      return {
        trade: index + 1,
        pnl: runningPnl,
        equityHigh,
        drawdown: equityHigh - runningPnl,
      };
    });
  }, [closedTrades]);

  // Ready to fund metrics
  const readyToFund = useMemo(() => {
    return calculateReadyToFund(trades, sessions);
  }, [trades, sessions]);

  // Overall stats
  const overallWinRate = calculateWinRate(trades);
  const overallProfitFactor = calculateProfitFactor(trades);

  if (closedTrades.length === 0) {
    return (
      <div className="text-center py-12">
        <Target size={48} className="mx-auto text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Analytics Yet</h2>
        <p className="text-gray-400">Complete some trades to see your performance analytics.</p>
      </div>
    );
  }

  // Pie chart data needs to be transformed
  const pieData = winRateByMarketState.map(item => ({
    name: item.category,
    value: item.total,
    winRate: item.win_rate
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Analytics</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Trades"
          value={closedTrades.length}
        />
        <StatCard
          label="Win Rate"
          value={`${overallWinRate}%`}
          trend={overallWinRate >= 50 ? 'up' : overallWinRate >= 40 ? 'neutral' : 'down'}
        />
        <StatCard
          label="Profit Factor"
          value={overallProfitFactor === Infinity ? '∞' : overallProfitFactor.toFixed(2)}
          trend={overallProfitFactor >= 1.5 ? 'up' : overallProfitFactor >= 1 ? 'neutral' : 'down'}
        />
        <StatCard
          label="Total P&L"
          value={formatCurrency(closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0))}
          trend={closedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0) > 0 ? 'up' : 'down'}
        />
      </div>

      {/* Ready to Fund Checklist */}
      <Card title="Ready to Fund Checklist">
        <div className="space-y-4">
          <ChecklistItem
            label="50+ trades completed"
            value={readyToFund.tradesCount}
            target={50}
            met={readyToFund.criteria.trades}
          />
          <ChecklistItem
            label="45%+ win rate"
            value={`${readyToFund.winRate}%`}
            target="45%"
            met={readyToFund.criteria.winRate}
          />
          <ChecklistItem
            label="1.3+ profit factor"
            value={readyToFund.profitFactor.toFixed(2)}
            target="1.3"
            met={readyToFund.criteria.profitFactor}
          />
          <ChecklistItem
            label="Largest loss under $75"
            value={formatCurrency(readyToFund.largestLoss)}
            target="< $75"
            met={readyToFund.criteria.largestLoss}
          />
          <ChecklistItem
            label="No day worse than -$150"
            value={formatCurrency(readyToFund.worstDay)}
            target="> -$150"
            met={readyToFund.criteria.worstDay}
          />
          
          <div className="pt-4 border-t border-[#404040]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Overall Progress</span>
              <span className="text-sm text-gray-400">
                {Object.values(readyToFund.criteria).filter(Boolean).length}/5 criteria met
              </span>
            </div>
            <ProgressBar
              value={Object.values(readyToFund.criteria).filter(Boolean).length}
              max={5}
              color={readyToFund.allCriteriaMet ? 'green' : 'blue'}
              showPercent={false}
            />
            {readyToFund.allCriteriaMet && (
              <div className="mt-4 p-4 bg-green-900/30 rounded-lg flex items-center gap-3">
                <Award className="text-green-400" size={24} />
                <div>
                  <div className="font-semibold text-green-400">Ready to Fund!</div>
                  <div className="text-sm text-gray-400">You've met all criteria. Consider starting a prop firm evaluation.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Equity Curve */}
      <Card title="Equity Curve">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
              <XAxis 
                dataKey="trade" 
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
              />
              <YAxis 
                stroke="#6b7280"
                tick={{ fill: '#6b7280' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #404040',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line 
                type="monotone" 
                dataKey="pnl" 
                stroke={CHART_COLORS.blue} 
                strokeWidth={2}
                dot={false}
                name="P&L"
              />
              <Line 
                type="monotone" 
                dataKey="equityHigh" 
                stroke={CHART_COLORS.green} 
                strokeWidth={1}
                strokeDasharray="5 5"
                dot={false}
                name="Equity High"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Win Rate Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* By Setup Grade */}
        <Card title="Win Rate by Setup Grade">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winRateByGrade} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis type="number" domain={[0, 100]} stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis type="category" dataKey="category" stroke="#6b7280" tick={{ fill: '#6b7280' }} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="win_rate" fill={CHART_COLORS.blue} radius={[0, 4, 4, 0]} name="Win Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-400">
            {winRateByGrade.map(item => (
              <div key={item.category} className="flex justify-between">
                <span>{item.category}</span>
                <span>{item.wins}W / {item.losses}L ({item.win_rate}%)</span>
              </div>
            ))}
          </div>
        </Card>

        {/* By Aggression Type */}
        <Card title="Win Rate by Aggression Type">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winRateByAggression} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis type="number" domain={[0, 100]} stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis type="category" dataKey="category" stroke="#6b7280" tick={{ fill: '#6b7280' }} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="win_rate" fill={CHART_COLORS.purple} radius={[0, 4, 4, 0]} name="Win Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* By Location Type */}
        <Card title="Win Rate by Location Type">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={winRateByLocation} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#404040" />
                <XAxis type="number" domain={[0, 100]} stroke="#6b7280" tick={{ fill: '#6b7280' }} />
                <YAxis type="category" dataKey="category" stroke="#6b7280" tick={{ fill: '#6b7280' }} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="win_rate" fill={CHART_COLORS.green} radius={[0, 4, 4, 0]} name="Win Rate %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* By Market State */}
        <Card title="Win Rate by Market State">
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="name"
                >
                  {pieData.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? CHART_COLORS.blue : CHART_COLORS.yellow} 
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #404040',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-sm text-gray-400 text-center">
            {winRateByMarketState.map(item => (
              <span key={item.category} className="mx-2">
                {item.category}: {item.total} trades ({item.win_rate}% WR)
              </span>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// Checklist Item Component
interface ChecklistItemProps {
  label: string;
  value: string | number;
  target: string | number;
  met: boolean;
}

const ChecklistItem: React.FC<ChecklistItemProps> = ({ label, value, target, met }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {met ? (
          <CheckCircle className="text-green-500" size={20} />
        ) : (
          <Circle className="text-gray-500" size={20} />
        )}
        <span className={met ? 'text-white' : 'text-gray-400'}>{label}</span>
      </div>
      <div className="text-right">
        <span className={`font-mono ${met ? 'text-green-400' : 'text-gray-400'}`}>
          {value}
        </span>
        <span className="text-gray-600 text-sm ml-2">/ {target}</span>
      </div>
    </div>
  );
};
