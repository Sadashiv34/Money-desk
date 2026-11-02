import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatIndianCurrency, formatShortDate } from '../../utils/currency';
import { filterTransactionsByDate } from '../../utils/calculations';
import { 
  CreditCard, 
  Plus, 
  Settings2, 
  X, 
  Building2, 
  Banknote, 
  ArrowUpRight, 
  Filter 
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { 
    expenseCategories, 
    accounts, 
    transactions, 
    dateRange, 
    openQuickEntry, 
    addExpenseCategory, 
    updateExpenseCategory 
  } = useFinance();

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string | null>(null);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Filter transactions for period
  const periodTransactions = useMemo(() => {
    return filterTransactionsByDate(transactions, dateRange);
  }, [transactions, dateRange]);

  // Compute Expense Breakdown
  const {
    totalExpenses,
    categoryBreakdown,
    bankExpenses,
    cashExpenses,
    largestCategory,
  } = useMemo(() => {
    let total = 0;
    let bank = 0;
    let cash = 0;
    const catMap = new Map<string, { name: string; total: number; count: number }>();

    for (const cat of expenseCategories) {
      catMap.set(cat.id, { name: cat.name, total: 0, count: 0 });
    }

    for (const tx of periodTransactions) {
      if (tx.type === 'expense' || tx.type === 'investment_expense') {
        total += tx.amount;

        const acc = accounts.find((a) => a.id === tx.accountId);
        if (acc?.type === 'bank') bank += tx.amount;
        if (acc?.type === 'cash') cash += tx.amount;

        const key = tx.categoryId || 'cat-other';
        const existing = catMap.get(key) || { name: 'Other Expenses', total: 0, count: 0 };
        catMap.set(key, { ...existing, total: existing.total + tx.amount, count: existing.count + 1 });
      }
    }

    const breakdownList = Array.from(catMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .filter((c) => c.total > 0)
      .sort((a, b) => b.total - a.total);

    return {
      totalExpenses: total,
      categoryBreakdown: breakdownList,
      bankExpenses: bank,
      cashExpenses: cash,
      largestCategory: breakdownList[0] || null,
    };
  }, [periodTransactions, expenseCategories, accounts]);

  // Filtered expense ledger
  const displayedExpenses = useMemo(() => {
    return periodTransactions.filter((tx) => {
      const isExpense = tx.type === 'expense' || tx.type === 'investment_expense';
      if (!isExpense) return false;
      if (selectedCategoryFilter && tx.categoryId !== selectedCategoryFilter) return false;
      if (selectedAccountFilter && tx.accountId !== selectedAccountFilter) return false;
      return true;
    });
  }, [periodTransactions, selectedCategoryFilter, selectedAccountFilter]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addExpenseCategory({ name: newCatName.trim(), isActive: true });
    setNewCatName('');
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-rose-400" />
            Expenses & Operating Outflows
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Operating expenditure, asset maintenance, and overheads (strictly separated from investments)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowManageCategories(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl text-xs font-medium text-zinc-300 transition-colors cursor-pointer"
          >
            <Settings2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Manage Categories</span>
          </button>
          <button
            onClick={() => openQuickEntry('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Total Period Expenses</span>
          <p className="text-3xl font-bold text-white mt-1 tabular-nums">
            {formatIndianCurrency(totalExpenses)}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Excludes investment contributions & external transfers</p>
        </div>

        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Largest Expense Category</span>
          <p className="text-xl font-bold text-rose-400 mt-1 truncate">
            {largestCategory ? largestCategory.name : 'None'}
          </p>
          <p className="text-xs text-zinc-400 mt-1">
            {largestCategory ? `${formatIndianCurrency(largestCategory.total)} (${Math.round((largestCategory.total / (totalExpenses || 1)) * 100)}% of total)` : 'No expenses recorded'}
          </p>
        </div>

        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Bank vs. Cash Outflows</span>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-indigo-400" />
              Bank:
            </span>
            <span className="font-bold text-zinc-200 tabular-nums">{formatIndianCurrency(bankExpenses)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-xs">
            <span className="text-zinc-400 flex items-center gap-1">
              <Banknote className="w-3.5 h-3.5 text-emerald-400" />
              Cash:
            </span>
            <span className="font-bold text-zinc-200 tabular-nums">{formatIndianCurrency(cashExpenses)}</span>
          </div>
        </div>
      </div>

      {/* Category Breakdown Grid */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Expenses by Category</h2>
            <p className="text-xs text-zinc-400">Click a category to filter the transaction list</p>
          </div>
          {(selectedCategoryFilter || selectedAccountFilter) && (
            <button
              onClick={() => {
                setSelectedCategoryFilter(null);
                setSelectedAccountFilter(null);
              }}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
            >
              <span>Clear Filter</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {categoryBreakdown.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-xs">
            No expenses recorded in this period.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryBreakdown.map((cat) => {
              const isSelected = selectedCategoryFilter === cat.id;
              const percent = Math.round((cat.total / (totalExpenses || 1)) * 100);
              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategoryFilter(isSelected ? null : cat.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-950/20 border-rose-500/60 ring-1 ring-rose-500/50'
                      : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-zinc-200 line-clamp-1">{cat.name}</span>
                    <span className="text-[10px] font-mono text-zinc-400 shrink-0">{percent}%</span>
                  </div>
                  <div className="mt-3 flex items-baseline justify-between">
                    <p className="text-base font-bold text-white tabular-nums">
                      {formatIndianCurrency(cat.total)}
                    </p>
                    <span className="text-[11px] text-zinc-400">{cat.count} payments</span>
                  </div>
                  <div className="mt-2 w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Expense History Ledger */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-white">Expense Records</h2>
            <p className="text-xs text-zinc-400">Showing {displayedExpenses.length} payment records</p>
          </div>
        </div>

        {displayedExpenses.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-xs">
            No matching expense records for selected filters.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {displayedExpenses.map((tx) => {
              const cat = expenseCategories.find((c) => c.id === tx.categoryId);
              const acc = accounts.find((a) => a.id === tx.accountId);
              const isDirectInvestmentExpense = tx.type === 'investment_expense';
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center shrink-0">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-zinc-200 truncate">
                        {tx.notes || cat?.name || 'Expense Payment'}
                      </p>
                      <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <span>{formatShortDate(tx.date)}</span>
                        <span>·</span>
                        <span>{cat?.name || 'Uncategorized'}</span>
                        <span>·</span>
                        <span>{acc?.name || 'Account'}</span>
                        {isDirectInvestmentExpense && (
                          <>
                            <span>·</span>
                            <span className="text-amber-400 font-mono">Asset Maintenance</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-zinc-200 font-mono tabular-nums">
                      -{formatIndianCurrency(tx.amount)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MANAGE CATEGORIES MODAL (Section 6.B requirement) */}
      {showManageCategories && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
              <div>
                <h3 className="text-base font-bold text-white">Manage Expense Categories</h3>
                <p className="text-xs text-zinc-400 mt-0.5">Add or organize custom expense classification tags</p>
              </div>
              <button
                onClick={() => setShowManageCategories(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              <form onSubmit={handleCreateCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="New Category Name (e.g. Legal Fees)"
                  required
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-rose-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors shrink-0"
                >
                  Add Category
                </button>
              </form>

              <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
                {expenseCategories.map((cat) => (
                  <div key={cat.id} className="p-3 flex items-center justify-between gap-3 text-xs">
                    <span className={`font-semibold ${cat.isActive ? 'text-zinc-100' : 'text-zinc-500 line-through'}`}>
                      {cat.name}
                    </span>
                    <button
                      onClick={() => updateExpenseCategory(cat.id, { isActive: !cat.isActive })}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        cat.isActive
                          ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {cat.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
