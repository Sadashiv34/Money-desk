import React, { useState, useMemo, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatIndianCurrency, formatShortDate, formatDate } from '../../utils/currency';
import { filterTransactionsByDate } from '../../utils/calculations';
import { Transaction } from '../../types/financial';
import { SecureDeleteModal } from '../Transactions/SecureDeleteModal';
import { 
  CreditCard, 
  Plus, 
  Settings2, 
  X, 
  Building2, 
  Banknote, 
  ArrowUpRight, 
  Filter,
  HandCoins,
  Users,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Trash2,
  AlertCircle
} from 'lucide-react';

export const ExpensesView: React.FC = () => {
  const { 
    expenseCategories, 
    accounts, 
    transactions, 
    dateRange, 
    summary,
    openQuickEntry, 
    addTransaction,
    addExpenseCategory, 
    updateExpenseCategory 
  } = useFinance();

  // Active Sub-tab in Expenses: 'operating' | 'borrowed_returns'
  const [activeSubTab, setActiveSubTab] = useState<'operating' | 'borrowed_returns'>('operating');

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string | null>(null);
  const [selectedLenderFilter, setSelectedLenderFilter] = useState<string | null>(null);
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Inline Quick Return state for Borrowed Money
  const [quickLenderName, setQuickLenderName] = useState('');
  const [quickReturnAmount, setQuickReturnAmount] = useState('');
  const [quickReturnDate, setQuickReturnDate] = useState(new Date().toISOString().slice(0, 10));
  const [quickReturnAccount, setQuickReturnAccount] = useState('');
  const [quickReturnTid, setQuickReturnTid] = useState('');
  const [quickReturnNotes, setQuickReturnNotes] = useState('');
  const [quickReturnMsg, setQuickReturnMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Secure Delete Modal state
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // Set default account for quick return when accounts load
  useEffect(() => {
    if (accounts.length > 0 && !quickReturnAccount) {
      const bank = accounts.find((a) => a.type === 'bank') || accounts[0];
      setQuickReturnAccount(bank.id);
    }
  }, [accounts, quickReturnAccount]);

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

  // Filtered operating expenses list
  const displayedExpenses = useMemo(() => {
    return periodTransactions.filter((tx) => {
      const isExpense = tx.type === 'expense' || tx.type === 'investment_expense';
      if (!isExpense) return false;
      if (selectedCategoryFilter && tx.categoryId !== selectedCategoryFilter) return false;
      if (selectedAccountFilter && tx.accountId !== selectedAccountFilter) return false;
      return true;
    });
  }, [periodTransactions, selectedCategoryFilter, selectedAccountFilter]);

  // Borrowed Money Returned transactions (all or period)
  const borrowedReturnTransactions = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'borrowed_repayment')
      .filter((tx) => {
        if (selectedLenderFilter && tx.lenderName !== selectedLenderFilter) return false;
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, selectedLenderFilter]);

  // Total borrowed money repaid across all time
  const totalAllTimeRepaid = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === 'borrowed_repayment')
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    addExpenseCategory({ name: newCatName.trim(), isActive: true });
    setNewCatName('');
  };

  // Handle Quick Return of Borrowed Money directly from this view
  const handleQuickReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQuickReturnMsg(null);

    if (!quickLenderName.trim()) {
      setQuickReturnMsg({ type: 'error', text: 'Please select or enter the person/lender name.' });
      return;
    }

    const parsedAmt = parseFloat(quickReturnAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setQuickReturnMsg({ type: 'error', text: 'Please enter a valid repayment amount.' });
      return;
    }

    const accId = quickReturnAccount || accounts[0]?.id;
    if (!accId) {
      setQuickReturnMsg({ type: 'error', text: 'Please select a valid payment account.' });
      return;
    }

    const res = addTransaction({
      type: 'borrowed_repayment',
      amount: parsedAmt,
      accountId: accId,
      date: quickReturnDate,
      lenderName: quickLenderName.trim(),
      tid: quickReturnTid.trim() || undefined,
      notes: quickReturnNotes.trim() || `Repayment to ${quickLenderName.trim()}`,
      referenceDoc: quickReturnTid.trim() || undefined
    });

    if (res.success) {
      setQuickReturnMsg({ 
        type: 'success', 
        text: `Successfully recorded repayment of ${formatIndianCurrency(parsedAmt)} to ${quickLenderName.trim()}!` 
      });
      setQuickReturnAmount('');
      setQuickReturnTid('');
      setQuickReturnNotes('');
    } else {
      setQuickReturnMsg({ type: 'error', text: res.error || 'Failed to record repayment.' });
    }
  };

  const selectedLenderInfo = useMemo(() => {
    if (!quickLenderName) return null;
    return summary.lendersSummary.find(
      (l) => l.lenderName.toLowerCase() === quickLenderName.trim().toLowerCase()
    );
  }, [quickLenderName, summary.lendersSummary]);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CreditCard className="w-6 h-6 text-rose-400" />
            Expenses & Outflows
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Operating expenditure, asset maintenance, and borrowed money repayments
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'operating' ? (
            <>
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
            </>
          ) : (
            <button
              onClick={() => openQuickEntry('borrowed_repayment')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              <HandCoins className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>+ Return Borrowed Money</span>
            </button>
          )}
        </div>
      </div>

      {/* SUB-NAVIGATION TABS: Operating Expenses vs Borrowed Money Returned */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveSubTab('operating')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'operating'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-rose-400" />
          <span>Operating Expenses</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-950 border border-zinc-800 text-zinc-300">
            {displayedExpenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('borrowed_returns')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === 'borrowed_returns'
              ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <HandCoins className="w-4 h-4 text-amber-400" />
          <span>Borrowed Money Returns (Debt Paid)</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-950 border border-zinc-800 text-amber-400 font-mono font-bold">
            {borrowedReturnTransactions.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: OPERATING EXPENSES */}
      {activeSubTab === 'operating' && (
        <>
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
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 cursor-pointer"
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
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-3 group">
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
                            {tx.tid && (
                              <>
                                <span>·</span>
                                <span className="text-zinc-500 font-mono">TID: {tx.tid}</span>
                              </>
                            )}
                            {isDirectInvestmentExpense && (
                              <>
                                <span>·</span>
                                <span className="text-amber-400 font-mono">Asset Maintenance</span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <p className="text-sm font-bold text-zinc-200 font-mono tabular-nums">
                          -{formatIndianCurrency(tx.amount)}
                        </p>
                        <button
                          onClick={() => setDeletingTx(tx)}
                          className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                          title="Delete Expense (PIN Required)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* VIEW 2: BORROWED MONEY RETURNS (DEBT REPAYMENT COLUMN) */}
      {activeSubTab === 'borrowed_returns' && (
        <div className="space-y-6">
          {/* KPI Summary for Borrowed Money Returns */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <HandCoins className="w-4 h-4" />
                All-Time Debt Repaid
              </span>
              <p className="text-3xl font-bold text-amber-400 mt-1 tabular-nums">
                {formatIndianCurrency(totalAllTimeRepaid)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Period repaid: {formatIndianCurrency(summary.periodBorrowedRepaid || 0)}
              </p>
            </div>

            <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Remaining Borrowed Debt
              </span>
              <p className="text-3xl font-bold text-rose-400 mt-1 tabular-nums">
                {formatIndianCurrency(summary.totalBorrowedOutstanding || 0)}
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                Owed across {summary.totalBorrowedActiveCount || 0} active lender(s)
              </p>
            </div>

            <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Lenders On Record
              </span>
              <p className="text-2xl font-bold text-white mt-1">
                {summary.lendersSummary.length} Lenders
              </p>
              <p className="text-xs text-emerald-400 mt-1">
                {summary.lendersSummary.filter((l) => l.outstanding <= 0).length} fully settled
              </p>
            </div>
          </div>

          {/* Quick Repayment Drawer / Form: Select Person and Enter Amount */}
          <div className="p-5 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-amber-500/30 rounded-2xl shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-800/80">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <HandCoins className="w-5 h-5 text-amber-400" />
                  Quick Repay Borrowed Money
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Select who you borrowed from and record returned money in one click
                </p>
              </div>
              <button
                type="button"
                onClick={() => openQuickEntry('borrowed_repayment')}
                className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
              >
                <span>Full Repay Dialog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {quickReturnMsg && (
              <div className={`mt-4 p-3 rounded-xl text-xs flex items-center justify-between ${
                quickReturnMsg.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}>
                <span>{quickReturnMsg.text}</span>
                <button onClick={() => setQuickReturnMsg(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={handleQuickReturnSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Lender Selector */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Select Person / Lender <span className="text-amber-400">*</span>
                  </label>
                  {summary.lendersSummary.length > 0 ? (
                    <select
                      value={quickLenderName}
                      onChange={(e) => {
                        setQuickLenderName(e.target.value);
                        const match = summary.lendersSummary.find(
                          (l) => l.lenderName.toLowerCase() === e.target.value.toLowerCase()
                        );
                        if (match && match.outstanding > 0) {
                          setQuickReturnAmount(match.outstanding.toString());
                        }
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    >
                      <option value="">-- Choose Lender --</option>
                      {summary.lendersSummary.map((l) => (
                        <option key={l.lenderName} value={l.lenderName}>
                          {l.lenderName} {l.outstanding > 0 ? `(Owes: ${formatIndianCurrency(l.outstanding)})` : '(Settled)'}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Ramesh Uncle"
                      value={quickLenderName}
                      onChange={(e) => setQuickLenderName(e.target.value)}
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                    />
                  )}
                </div>

                {/* 2. Amount Returned */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Amount Returned (₹) <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 10000"
                    value={quickReturnAmount}
                    onChange={(e) => setQuickReturnAmount(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs font-bold font-mono text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* 3. Date Returned */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Repayment Date <span className="text-amber-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={quickReturnDate}
                    onChange={(e) => setQuickReturnDate(e.target.value)}
                    required
                    style={{ colorScheme: 'dark' }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>

                {/* 4. Payment Account */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Paid From Account <span className="text-amber-400">*</span>
                  </label>
                  <select
                    value={quickReturnAccount}
                    onChange={(e) => setQuickReturnAccount(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  >
                    {accounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} ({acc.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick suggestions & Notes row */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto text-xs">
                  {selectedLenderInfo && selectedLenderInfo.outstanding > 0 && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-400">Quick:</span>
                      <button
                        type="button"
                        onClick={() => setQuickReturnAmount(selectedLenderInfo.outstanding.toString())}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-amber-300 cursor-pointer"
                      >
                        Full (₹{selectedLenderInfo.outstanding})
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickReturnAmount(Math.round(selectedLenderInfo.outstanding / 2).toString())}
                        className="px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-[11px] font-mono text-zinc-300 cursor-pointer"
                      >
                        50%
                      </button>
                    </div>
                  )}

                  <input
                    type="text"
                    placeholder="TID / Reference (optional)"
                    value={quickReturnTid}
                    onChange={(e) => setQuickReturnTid(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white font-mono focus:border-amber-400 focus:outline-none w-36"
                  />

                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={quickReturnNotes}
                    onChange={(e) => setQuickReturnNotes(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white focus:border-amber-400 focus:outline-none flex-1 min-w-[140px]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-5 py-2 bg-amber-400 hover:bg-amber-300 text-zinc-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shrink-0 shadow"
                >
                  Save Repayment
                </button>
              </div>
            </form>
          </div>

          {/* BORROWED MONEY RETURN COLUMN / TABLE LEDGER */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>Borrowed Money Returned Ledger</span>
                  <span className="text-xs font-normal text-zinc-400">
                    ({borrowedReturnTransactions.length} records)
                  </span>
                </h2>
                <p className="text-xs text-zinc-400">
                  Audit trail of all funds repaid back to lenders/creditors
                </p>
              </div>

              {/* Filter by lender */}
              {summary.lendersSummary.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400">Filter Lender:</span>
                  <select
                    value={selectedLenderFilter || ''}
                    onChange={(e) => setSelectedLenderFilter(e.target.value || null)}
                    className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-300 focus:border-amber-400 focus:outline-none"
                  >
                    <option value="">All Lenders</option>
                    {summary.lendersSummary.map((l) => (
                      <option key={l.lenderName} value={l.lenderName}>
                        {l.lenderName}
                      </option>
                    ))}
                  </select>
                  {selectedLenderFilter && (
                    <button
                      onClick={() => setSelectedLenderFilter(null)}
                      className="text-xs text-amber-400 hover:text-amber-300 p-1 cursor-pointer"
                      title="Clear filter"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {borrowedReturnTransactions.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs space-y-2">
                <HandCoins className="w-8 h-8 text-zinc-600 mx-auto stroke-[1.5]" />
                <p className="text-zinc-400 font-medium">No borrowed money returns recorded yet.</p>
                <p className="text-[11px] text-zinc-600">
                  Use the quick form above or click "+ Return Borrowed Money" to record a repayment.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[11px] uppercase tracking-wider text-zinc-400 font-semibold bg-zinc-950/40">
                      <th className="py-3 px-3">Lender / Person</th>
                      <th className="py-3 px-3">Date Returned</th>
                      <th className="py-3 px-3">Amount Returned</th>
                      <th className="py-3 px-3">Paid From Account</th>
                      <th className="py-3 px-3">TID / Reference</th>
                      <th className="py-3 px-3">Notes</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {borrowedReturnTransactions.map((tx) => {
                      const acc = accounts.find((a) => a.id === tx.accountId);
                      return (
                        <tr key={tx.id} className="hover:bg-zinc-800/20 transition-colors group">
                          {/* Person / Lender Name */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center font-bold text-xs shrink-0">
                                {tx.lenderName ? tx.lenderName.charAt(0).toUpperCase() : 'L'}
                              </div>
                              <span className="font-bold text-zinc-100">
                                {tx.lenderName || 'Lender'}
                              </span>
                            </div>
                          </td>

                          {/* Date Returned */}
                          <td className="py-3 px-3 font-mono text-zinc-300 whitespace-nowrap">
                            {formatDate(tx.date)}
                          </td>

                          {/* Amount Returned */}
                          <td className="py-3 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                            -{formatIndianCurrency(tx.amount)}
                          </td>

                          {/* Account */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300">
                              {acc?.type === 'bank' ? (
                                <Building2 className="w-3 h-3 text-indigo-400" />
                              ) : (
                                <Banknote className="w-3 h-3 text-emerald-400" />
                              )}
                              <span>{acc?.name || 'Account'}</span>
                            </span>
                          </td>

                          {/* TID */}
                          <td className="py-3 px-3 font-mono text-[11px] text-zinc-400 whitespace-nowrap">
                            {tx.tid ? (
                              <span className="px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400">
                                {tx.tid}
                              </span>
                            ) : (
                              <span className="text-zinc-600">—</span>
                            )}
                          </td>

                          {/* Notes */}
                          <td className="py-3 px-3 text-zinc-400 max-w-xs truncate">
                            {tx.notes || '—'}
                          </td>

                          {/* Action: Secure Hard Delete */}
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => setDeletingTx(tx)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 opacity-80 sm:opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Delete Repayment (PIN Required)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANAGE CATEGORIES MODAL */}
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
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg cursor-pointer"
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
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors shrink-0 cursor-pointer"
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
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
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

      {/* HARD DELETION MODAL WITH REASON & 4-DIGIT PIN */}
      {deletingTx && (
        <SecureDeleteModal
          transaction={deletingTx}
          onClose={() => setDeletingTx(null)}
        />
      )}
    </div>
  );
};
