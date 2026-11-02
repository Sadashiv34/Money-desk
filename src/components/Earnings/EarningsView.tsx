import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { IncomeSource } from '../../types/financial';
import { formatIndianCurrency, formatShortDate } from '../../utils/currency';
import { filterTransactionsByDate } from '../../utils/calculations';
import { 
  TrendingUp, 
  Plus, 
  Settings2, 
  X, 
  Check, 
  ArrowDownLeft, 
  Percent, 
  Briefcase, 
  Filter, 
  Layers 
} from 'lucide-react';

export const EarningsView: React.FC = () => {
  const { 
    incomeSources, 
    transactions, 
    dateRange, 
    openQuickEntry, 
    addIncomeSource, 
    updateIncomeSource 
  } = useFinance();

  const [selectedSourceFilter, setSelectedSourceFilter] = useState<string | null>(null);
  const [showManageSources, setShowManageSources] = useState(false);

  // New source form state
  const [newSourceName, setNewSourceName] = useState('');
  const [newSourceCat, setNewSourceCat] = useState('Business Income');
  const [newSourceBiz, setNewSourceBiz] = useState('');
  const [newSourceDesc, setNewSourceDesc] = useState('');

  // Filter transactions for period
  const periodTransactions = useMemo(() => {
    return filterTransactionsByDate(transactions, dateRange);
  }, [transactions, dateRange]);

  // Compute Period Earnings Breakdown
  const { 
    totalEarnings, 
    sourceBreakdown, 
    interestEarnings, 
    highestSource 
  } = useMemo(() => {
    let total = 0;
    let interest = 0;
    const sourceMap = new Map<string, { name: string; category: string; total: number; count: number }>();

    // Initialize map with all known sources
    for (const src of incomeSources) {
      sourceMap.set(src.id, { name: src.name, category: src.category, total: 0, count: 0 });
    }

    for (const tx of periodTransactions) {
      if (tx.type === 'income') {
        total += tx.amount;
        const key = tx.sourceId || 'src-other';
        const existing = sourceMap.get(key) || { name: 'Other Income', category: 'Other', total: 0, count: 0 };
        sourceMap.set(key, { ...existing, total: existing.total + tx.amount, count: existing.count + 1 });
      } else if (tx.type === 'investment_return') {
        // Profit / Interest received portion ONLY!
        const profit = tx.interestOrProfitReceived || 0;
        total += profit;
        interest += profit;
        const key = tx.sourceId || 'src-lent-interest';
        const existing = sourceMap.get(key) || { name: 'Investment Interest / Profit', category: 'Interest Income', total: 0, count: 0 };
        sourceMap.set(key, { ...existing, total: existing.total + profit, count: existing.count + 1 });
      }
    }

    const breakdownList = Array.from(sourceMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .filter((s) => s.total > 0)
      .sort((a, b) => b.total - a.total);

    const highest = breakdownList[0] || null;

    return {
      totalEarnings: total,
      sourceBreakdown: breakdownList,
      interestEarnings: interest,
      highestSource: highest,
    };
  }, [periodTransactions, incomeSources]);

  // Filtered transactions for the selected source drill-down
  const displayedTransactions = useMemo(() => {
    return periodTransactions.filter((tx) => {
      const isEarning = tx.type === 'income' || tx.type === 'investment_return';
      if (!isEarning) return false;
      if (!selectedSourceFilter) return true;
      return tx.sourceId === selectedSourceFilter;
    });
  }, [periodTransactions, selectedSourceFilter]);

  const handleCreateSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceName.trim()) return;

    addIncomeSource({
      name: newSourceName.trim(),
      category: newSourceCat,
      associatedBusiness: newSourceBiz.trim() || undefined,
      description: newSourceDesc.trim() || undefined,
      isActive: true,
    });

    setNewSourceName('');
    setNewSourceBiz('');
    setNewSourceDesc('');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            Earnings & Revenue Sources
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Realized cash receipts across rental fleets, software services, and venture profits
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManageSources(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Manage Sources</span>
          </button>
          <button
            onClick={() => openQuickEntry('income')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Earnings</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Period Earnings</span>
          <p className="text-3xl font-bold text-white mt-1 tabular-nums">
            {formatIndianCurrency(totalEarnings)}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Excludes returned investment principal</p>
        </div>

        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Highest-Earning Source</span>
          <p className="text-xl font-bold text-emerald-400 mt-1 truncate">
            {highestSource ? highestSource.name : 'No recorded earnings'}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {highestSource ? `${formatIndianCurrency(highestSource.total)} (${Math.round((highestSource.total / (totalEarnings || 1)) * 100)}% of total)` : 'Record income to populate'}
          </p>
        </div>

        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Interest & Venture Profit</span>
          <p className="text-3xl font-bold text-blue-400 mt-1 tabular-nums">
            {formatIndianCurrency(interestEarnings)}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Passive capital & venture returns</p>
        </div>
      </div>

      {/* Sources Performance Breakdown */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Income by Source</h2>
            <p className="text-xs text-zinc-400">Click a source below to filter the underlying transaction ledger</p>
          </div>
          {selectedSourceFilter && (
            <button
              onClick={() => setSelectedSourceFilter(null)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              <span>Clear Filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {sourceBreakdown.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No income recorded in this period. Click "+ Add Earnings" to record your first transaction.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sourceBreakdown.map((src) => {
              const isSelected = selectedSourceFilter === src.id;
              const percent = Math.round((src.total / (totalEarnings || 1)) * 100);
              return (
                <div
                  key={src.id}
                  onClick={() => setSelectedSourceFilter(isSelected ? null : src.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/50'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-200 line-clamp-1">{src.name}</span>
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0">{percent}%</span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <p className="text-base font-bold text-white tabular-nums">
                      {formatIndianCurrency(src.total)}
                    </p>
                    <span className="text-[11px] text-zinc-400">{src.count} receipts</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Transaction History for Earnings */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">
              {selectedSourceFilter ? 'Filtered Receipts' : 'All Period Receipts'}
            </h2>
            <p className="text-xs text-zinc-400">
              Showing {displayedTransactions.length} receipt records
            </p>
          </div>
        </div>

        {displayedTransactions.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-xs">
            No matching transactions found for this source.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {displayedTransactions.map((tx) => {
              const src = incomeSources.find((s) => s.id === tx.sourceId);
              const isSplit = tx.type === 'investment_return';
              const earningAmount = isSplit ? (tx.interestOrProfitReceived || 0) : tx.amount;
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                      <ArrowDownLeft className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zinc-200 truncate">
                        {tx.notes || src?.name || 'Earnings Receipt'}
                      </p>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <span>{formatShortDate(tx.date)}</span>
                        <span>·</span>
                        <span>{src?.name || 'Direct Receipt'}</span>
                        {isSplit && (
                          <>
                            <span>·</span>
                            <span className="text-blue-400">Profit component of split return</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-400 font-mono tabular-nums">
                      +{formatIndianCurrency(earningAmount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MANAGE SOURCES MODAL (Section 5.B requirement) */}
      {showManageSources && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
              <div>
                <h3 className="text-base font-bold text-white">Manage Income Sources</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Configure income sources, categories, and business affiliations
                </p>
              </div>
              <button
                onClick={() => setShowManageSources(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Add New Source Form */}
              <form onSubmit={handleCreateSource} className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">+ Add New Income Source</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Source Name</label>
                    <input
                      type="text"
                      value={newSourceName}
                      onChange={(e) => setNewSourceName(e.target.value)}
                      placeholder="e.g. Scooter Rentals"
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Category</label>
                    <select
                      value={newSourceCat}
                      onChange={(e) => setNewSourceCat(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="Rental Business">Rental Business</option>
                      <option value="Business Income">Business Income</option>
                      <option value="Interest Income">Interest Income</option>
                      <option value="Business Profit">Business Profit</option>
                      <option value="Other Business Income">Other Business Income</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Associated Business (Optional)</label>
                    <input
                      type="text"
                      value={newSourceBiz}
                      onChange={(e) => setNewSourceBiz(e.target.value)}
                      placeholder="e.g. Bike Rentals"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={newSourceDesc}
                      onChange={(e) => setNewSourceDesc(e.target.value)}
                      placeholder="e.g. Tourist bookings"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="text-right pt-1">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-lg text-xs transition-colors"
                  >
                    Add Source
                  </button>
                </div>
              </form>

              {/* Source List Table */}
              <div>
                <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2">Configured Sources</h4>
                <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
                  {incomeSources.map((src) => (
                    <div key={src.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${src.isActive ? 'text-zinc-100' : 'text-zinc-500 line-through'}`}>
                            {src.name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            {src.category}
                          </span>
                        </div>
                        {src.description && (
                          <p className="text-[11px] text-zinc-400 mt-0.5">{src.description}</p>
                        )}
                      </div>
                      <button
                        onClick={() => updateIncomeSource(src.id, { isActive: !src.isActive })}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          src.isActive
                            ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                            : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {src.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  Note: Deactivating a source preserves all historical transactions without alteration.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
