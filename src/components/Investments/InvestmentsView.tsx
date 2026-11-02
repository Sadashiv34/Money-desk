import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Investment, InvestmentStatus } from '../../types/financial';
import { formatIndianCurrency, formatDate, formatShortDate } from '../../utils/currency';
import { 
  Briefcase, 
  Plus, 
  RotateCcw, 
  X, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';

export const InvestmentsView: React.FC = () => {
  const { 
    investments, 
    transactions, 
    investmentMetricsList, 
    openQuickEntry, 
    selectedInvestmentId, 
    setSelectedInvestmentId,
    updateInvestment 
  } = useFinance();

  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'partially_returned' | 'fully_returned'>('all');

  // Currently inspected investment detail
  const activeDetailMetric = investmentMetricsList.find(
    (m) => m.investment.id === selectedInvestmentId
  );

  // Filtered investments
  const filteredMetrics = investmentMetricsList.filter((m) => {
    if (statusFilter === 'all') return true;
    return m.computedStatus === statusFilter;
  });

  // Aggregate Portfolio Totals
  const portfolioSummary = investmentMetricsList.reduce(
    (acc, m) => {
      acc.totalInitial += m.initialPrincipal;
      acc.totalReturned += m.principalReturned;
      acc.totalOutstanding += m.outstandingPrincipal;
      acc.totalIncome += m.totalIncomeReceived;
      acc.totalExpenses += m.directExpenses;
      acc.totalNetGain += m.netRealizedGain;
      return acc;
    },
    {
      totalInitial: 0,
      totalReturned: 0,
      totalOutstanding: 0,
      totalIncome: 0,
      totalExpenses: 0,
      totalNetGain: 0,
    }
  );

  const getStatusBadge = (status: InvestmentStatus) => {
    switch (status) {
      case 'active':
        return <span className="text-[11px] font-medium text-emerald-400">Active</span>;
      case 'partially_returned':
        return <span className="text-[11px] font-medium text-amber-400">Partially Returned</span>;
      case 'fully_returned':
        return <span className="text-[11px] font-medium text-blue-400">Fully Returned</span>;
      case 'closed':
        return <span className="text-[11px] font-medium text-zinc-400">Closed</span>;
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-blue-400" />
            Investments & Capital Register
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Rental assets, business equity, loans, and productive equipment performance tracking
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openQuickEntry('investment_return')}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Record Return</span>
          </button>
          <button
            onClick={() => openQuickEntry('investment')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Investment</span>
          </button>
        </div>
      </div>

      {/* Portfolio Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Total Capital Out</span>
          <p className="text-xl sm:text-2xl font-bold text-white mt-1 tabular-nums">
            {formatIndianCurrency(portfolioSummary.totalInitial)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">{investments.length} tracked assets/ventures</p>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Principal Returned</span>
          <p className="text-xl sm:text-2xl font-bold text-blue-400 mt-1 tabular-nums">
            {formatIndianCurrency(portfolioSummary.totalReturned)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Original capital recovered</p>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Outstanding Principal</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400 mt-1 tabular-nums">
            {formatIndianCurrency(portfolioSummary.totalOutstanding)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Capital still at work</p>
        </div>

        <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">Net Realized Gain</span>
          <p className="text-xl sm:text-2xl font-bold text-emerald-300 mt-1 tabular-nums">
            {formatIndianCurrency(portfolioSummary.totalNetGain)}
          </p>
          <p className="text-[11px] text-zinc-400 mt-0.5">Income minus direct asset costs</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1 bg-zinc-900/70 border border-zinc-800 rounded-xl w-fit text-xs">
        {(['all', 'active', 'partially_returned', 'fully_returned'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer capitalize ${
              statusFilter === filter
                ? 'bg-zinc-800 text-white shadow-xs'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {filter.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Investment Register Table (Desktop) / Cards (Mobile) */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Investment Register</h2>
            <p className="text-xs text-zinc-400">
              Complete authoritative ledger showing principal recovery, income generated, and status
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {filteredMetrics.length} investments
          </span>
        </div>

        {filteredMetrics.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-xs">
            No investments found matching filter.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {filteredMetrics.map((item) => {
              const { investment: inv } = item;
              return (
                <div
                  key={inv.id}
                  onClick={() => setSelectedInvestmentId(inv.id)}
                  className="p-5 hover:bg-zinc-800/40 transition-colors cursor-pointer group"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                          {inv.name}
                        </h3>
                        <span className="text-[10px] uppercase font-mono text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          {inv.type.replace('_', ' ')}
                        </span>
                        <span>·</span>
                        {getStatusBadge(item.computedStatus)}
                      </div>

                      <p className="text-xs text-zinc-400 mt-1 line-clamp-1">
                        {inv.purpose}
                      </p>

                      <div className="mt-2 flex items-center gap-4 text-xs text-zinc-400 font-mono">
                        <span>Started: {formatDate(inv.date)}</span>
                        <span>·</span>
                        <span>{item.daysActive} days active</span>
                        {inv.expectedRateOrProfit && (
                          <>
                            <span>·</span>
                            <span className="text-emerald-400">{inv.expectedRateOrProfit}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Right Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-right shrink-0">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Initial Capital</span>
                        <p className="text-sm font-semibold text-white font-mono tabular-nums mt-0.5">
                          {formatIndianCurrency(item.initialPrincipal)}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Principal Returned</span>
                        <p className="text-sm font-semibold text-blue-400 font-mono tabular-nums mt-0.5">
                          {formatIndianCurrency(item.principalReturned)}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Outstanding</span>
                        <p className="text-sm font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                          {formatIndianCurrency(item.outstandingPrincipal)}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Net Gain</span>
                        <p className="text-sm font-bold text-zinc-200 font-mono tabular-nums mt-0.5">
                          {formatIndianCurrency(item.netRealizedGain)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* INVESTMENT DETAILS MODAL (Section 7.C requirement) */}
      {activeDetailMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white truncate">
                    {activeDetailMetric.investment.name}
                  </h3>
                  {getStatusBadge(activeDetailMetric.computedStatus)}
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Type: {activeDetailMetric.investment.type.replace('_', ' ')} · Started {formatDate(activeDetailMetric.investment.date)}
                </p>
              </div>
              <button
                onClick={() => setSelectedInvestmentId(null)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              {/* Top Action & Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Total Capital Invested</span>
                  <p className="text-base font-bold text-white font-mono tabular-nums mt-0.5">
                    {formatIndianCurrency(activeDetailMetric.totalPrincipalInvested)}
                  </p>
                </div>

                <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Principal Returned</span>
                  <p className="text-base font-bold text-blue-400 font-mono tabular-nums mt-0.5">
                    {formatIndianCurrency(activeDetailMetric.principalReturned)}
                  </p>
                </div>

                <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Outstanding Principal</span>
                  <p className="text-base font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                    {formatIndianCurrency(activeDetailMetric.outstandingPrincipal)}
                  </p>
                </div>

                <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Income Received</span>
                  <p className="text-base font-bold text-zinc-100 font-mono tabular-nums mt-0.5">
                    {formatIndianCurrency(activeDetailMetric.totalIncomeReceived)}
                  </p>
                </div>

                <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Direct Asset Expenses</span>
                  <p className="text-base font-bold text-rose-400 font-mono tabular-nums mt-0.5">
                    {formatIndianCurrency(activeDetailMetric.directExpenses)}
                  </p>
                </div>

                <div className="p-3 bg-zinc-950/70 rounded-xl border border-zinc-800">
                  <span className="text-[10px] text-zinc-400 uppercase tracking-wider block">Net Realized Gain</span>
                  <p className="text-base font-bold text-emerald-400 font-mono tabular-nums mt-0.5">
                    {formatIndianCurrency(activeDetailMetric.netRealizedGain)}
                  </p>
                </div>
              </div>

              {/* Purpose and Expected Terms */}
              <div className="p-4 bg-zinc-950/50 border border-zinc-800 rounded-xl text-xs space-y-2">
                <div>
                  <span className="text-zinc-400 font-medium">Purpose:</span>
                  <p className="text-zinc-200 mt-0.5">{activeDetailMetric.investment.purpose}</p>
                </div>
                {activeDetailMetric.investment.notes && (
                  <div>
                    <span className="text-zinc-400 font-medium">Notes:</span>
                    <p className="text-zinc-200 mt-0.5">{activeDetailMetric.investment.notes}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-800/80 text-[11px] text-zinc-400">
                  <div>Expected Return Method: <span className="text-zinc-200 font-medium">{activeDetailMetric.investment.expectedReturnMethod}</span></div>
                  <div>Expected Rate/Profit: <span className="text-emerald-400 font-medium">{activeDetailMetric.investment.expectedRateOrProfit || 'N/A'}</span></div>
                </div>
              </div>

              {/* Record Return Trigger CTA */}
              <div className="p-4 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-white">Record Installment or Return</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Split payment into principal recovery and profit/interest income
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedInvestmentId(null);
                    openQuickEntry('investment_return');
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors shrink-0 cursor-pointer"
                >
                  Record Return
                </button>
              </div>

              {/* Related Transactions History */}
              <div>
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">
                  Related Financial History ({activeDetailMetric.transactionsCount} entries)
                </h4>
                <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/50">
                  {transactions
                    .filter(
                      (t) =>
                        t.investmentId === activeDetailMetric.investment.id ||
                        (activeDetailMetric.investment.associatedEntity &&
                          t.associatedBusiness &&
                          t.associatedBusiness.trim().toLowerCase() ===
                            activeDetailMetric.investment.associatedEntity.trim().toLowerCase())
                    )
                    .map((tx) => (
                      <div key={tx.id} className="p-3 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-zinc-200">{tx.notes || tx.type.replace('_', ' ')}</p>
                          <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                            <span>{formatShortDate(tx.date)}</span>
                            <span>·</span>
                            <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                            {tx.principalReturned ? <span>· P: {formatIndianCurrency(tx.principalReturned)}</span> : null}
                            {tx.interestOrProfitReceived ? <span>· Profit: {formatIndianCurrency(tx.interestOrProfitReceived)}</span> : null}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-zinc-200 tabular-nums">
                            {formatIndianCurrency(tx.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
