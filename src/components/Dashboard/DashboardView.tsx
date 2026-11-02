import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatIndianCurrency, formatShortDate } from '../../utils/currency';
import { getDateRangeForPeriod } from '../../utils/calculations';
import { 
  Briefcase, 
  Building2, 
  Banknote, 
  TrendingUp, 
  TrendingDown, 
  ChevronRight, 
  ChevronLeft,
  Calendar,
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  Info,
  HandCoins,
  Users,
  RotateCcw,
  X
} from 'lucide-react';

export const DashboardView: React.FC = () => {
  const { 
    summary, 
    transactions, 
    investments, 
    setActiveTab, 
    openQuickEntry, 
    setSelectedInvestmentId,
    dateRange,
    setDateRange,
    shiftMonth,
    currentMonthLabel
  } = useFinance();

  const [showFormulaBreakdown, setShowFormulaBreakdown] = useState(false);
  const [showBorrowedModal, setShowBorrowedModal] = useState(false);

  // Chronologically sorted recent 5 transactions
  const recentTransactions = useMemo(() => {
    const list = [...transactions];
    list.sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')));
    return list.slice(0, 5);
  }, [transactions]);

  return (
    <div className="relative max-w-md sm:max-w-xl mx-auto space-y-6 pb-28 pt-2">
      {/* 
        DASHBOARD WIREFRAME CONTAINER
        Faithfully matches the user's uploaded UI/UX sketch:
        - Charcoal dark theme with crisp bordered boxes
        - Centered "My money" at top
        - "investments" & "In bank a/c" beneath it
        - "Earnings" & "Expenses" in the next row
        - "In Cash" & "Insights" in a balanced row
        - Floating bottom-right circular (+) button
      */}

      {/* MONTH-WISE STEPPER & PERIOD FILTER */}
      <div className="flex items-center justify-between p-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl text-xs">
        <button 
          onClick={() => shiftMonth(-1)}
          className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-medium"
          title="Previous Month"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-white tracking-wide text-xs sm:text-sm">
            {currentMonthLabel}
          </span>
          {dateRange.period !== 'all_time' ? (
            <button
              onClick={() => setDateRange(getDateRangeForPeriod('all_time'))}
              className="text-[10px] text-zinc-400 hover:text-zinc-200 underline cursor-pointer ml-1"
            >
              All Time
            </button>
          ) : (
            <button
              onClick={() => setDateRange(getDateRangeForPeriod('this_month'))}
              className="text-[10px] text-emerald-400 hover:text-emerald-300 underline cursor-pointer ml-1"
            >
              This Month
            </button>
          )}
        </div>

        <button 
          onClick={() => shiftMonth(1)}
          className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-medium"
          title="Next Month"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 1. TOP CENTERED: My money */}
      <div className="flex flex-col items-center">
        <span className="text-sm sm:text-base font-semibold text-zinc-300 mb-2 tracking-tight">
          My money
        </span>
        <div
          onClick={() => setShowFormulaBreakdown(!showFormulaBreakdown)}
          className="w-full sm:w-80 min-h-[140px] sm:min-h-[150px] p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border-2 border-zinc-700/90 hover:border-zinc-500 transition-all cursor-pointer flex flex-col items-center justify-center text-center shadow-lg group relative"
        >
          <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight tabular-nums font-mono">
            {formatIndianCurrency(summary.myMoney)}
          </span>
          <span className="text-[11px] text-zinc-400 mt-1.5 flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
            <span>Outstanding Inv + Bank + Cash</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFormulaBreakdown ? 'rotate-180' : ''}`} />
          </span>

          <div className="absolute top-2.5 right-2.5 text-zinc-500 group-hover:text-zinc-300 transition-colors">
            <Info className="w-4 h-4" />
          </div>
        </div>

        {/* Formula breakdown drawer when tapped */}
        {showFormulaBreakdown && (
          <div className="w-full sm:w-80 mt-2 p-3 bg-zinc-950/90 rounded-xl border border-zinc-800 text-xs text-zinc-300 space-y-1.5 font-mono shadow-md animate-in fade-in duration-200">
            <div className="flex justify-between items-center text-zinc-400">
              <span>+ Outstanding Investments:</span>
              <span className="text-white font-semibold tabular-nums">{formatIndianCurrency(summary.totalInvestmentsOutstanding)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>+ In Bank Accounts:</span>
              <span className="text-white font-semibold tabular-nums">{formatIndianCurrency(summary.totalBankBalances)}</span>
            </div>
            <div className="flex justify-between items-center text-zinc-400">
              <span>+ In Cash (In Hand):</span>
              <span className="text-white font-semibold tabular-nums">{formatIndianCurrency(summary.totalCashInHand)}</span>
            </div>
            {summary.totalBorrowedOutstanding > 0 && (
              <div className="flex justify-between items-center text-amber-400">
                <span>- Borrowed Debt:</span>
                <span className="font-semibold tabular-nums">-{formatIndianCurrency(summary.totalBorrowedOutstanding)}</span>
              </div>
            )}
            <div className="border-t border-zinc-800 pt-1 flex justify-between items-center font-bold text-emerald-400">
              <span>= My Money (Net Worth):</span>
              <span className="tabular-nums">{formatIndianCurrency(summary.myMoney)}</span>
            </div>
          </div>
        )}
      </div>

      {/* 2. ROW 2: investments & In bank a/c */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {/* investments Box */}
        <div className="flex flex-col items-center">
          <span className="text-xs sm:text-sm font-semibold text-zinc-300 mb-2 tracking-tight">
            investments
          </span>
          <div
            onClick={() => setActiveTab('investments')}
            className="w-full min-h-[130px] sm:min-h-[140px] p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border-2 border-zinc-700/90 hover:border-zinc-500 transition-all cursor-pointer flex flex-col items-center justify-center text-center shadow-md group"
          >
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums font-mono">
              {formatIndianCurrency(summary.totalInvestmentsOutstanding)}
            </span>
            <span className="text-[11px] text-zinc-400 mt-1">
              {summary.activeInvestmentsCount} active assets
            </span>
          </div>
        </div>

        {/* In bank a/c Box */}
        <div className="flex flex-col items-center">
          <span className="text-xs sm:text-sm font-semibold text-zinc-300 mb-2 tracking-tight">
            In bank a/c
          </span>
          <div
            onClick={() => setActiveTab('settings')}
            className="w-full min-h-[130px] sm:min-h-[140px] p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border-2 border-zinc-700/90 hover:border-zinc-500 transition-all cursor-pointer flex flex-col items-center justify-center text-center shadow-md group"
          >
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums font-mono">
              {formatIndianCurrency(summary.totalBankBalances)}
            </span>
            <span className="text-[11px] text-zinc-400 mt-1">
              Tracked bank balance
            </span>
          </div>
        </div>
      </div>

      {/* 3. ROW 3: Earnings & Expenses */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {/* Earnings Box */}
        <div className="flex flex-col items-center">
          <span className="text-xs sm:text-sm font-semibold text-zinc-300 mb-2 tracking-tight">
            Earnings
          </span>
          <div
            onClick={() => setActiveTab('earnings')}
            className="w-full min-h-[130px] sm:min-h-[140px] p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border-2 border-zinc-700/90 hover:border-emerald-500/60 transition-all cursor-pointer flex flex-col items-center justify-center text-center shadow-md group"
          >
            <span className="text-xl sm:text-2xl font-bold text-emerald-400 tracking-tight tabular-nums font-mono">
              {formatIndianCurrency(summary.periodEarnings)}
            </span>
            <span className="text-[11px] text-zinc-400 mt-1">
              Period income
            </span>
          </div>
        </div>

        {/* Expenses Box */}
        <div className="flex flex-col items-center">
          <span className="text-xs sm:text-sm font-semibold text-zinc-300 mb-2 tracking-tight">
            Expenses
          </span>
          <div
            onClick={() => setActiveTab('expenses')}
            className="w-full min-h-[130px] sm:min-h-[140px] p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border-2 border-zinc-700/90 hover:border-rose-500/60 transition-all cursor-pointer flex flex-col items-center justify-center text-center shadow-md group"
          >
            <span className="text-xl sm:text-2xl font-bold text-rose-400 tracking-tight tabular-nums font-mono">
              {formatIndianCurrency(summary.periodExpenses)}
            </span>
            <span className="text-[11px] text-zinc-400 mt-1">
              Period outgo
            </span>
          </div>
        </div>
      </div>

      {/* 4. ROW 4: In Cash & Borrowed (Faithfully matching user's request) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {/* In Cash Box */}
        <div className="flex flex-col items-center">
          <span className="text-xs sm:text-sm font-semibold text-zinc-300 mb-2 tracking-tight">
            In Cash
          </span>
          <div
            onClick={() => openQuickEntry('expense')}
            className="w-full min-h-[120px] sm:min-h-[130px] p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border-2 border-zinc-700/90 hover:border-zinc-500 transition-all cursor-pointer flex flex-col items-center justify-center text-center shadow-md group"
          >
            <span className="text-xl sm:text-2xl font-bold text-white tracking-tight tabular-nums font-mono">
              {formatIndianCurrency(summary.totalCashInHand)}
            </span>
            <span className="text-[11px] text-zinc-400 mt-1">
              Physical cash in hand
            </span>
          </div>
        </div>

        {/* Borrowed Box */}
        <div className="flex flex-col items-center">
          <span className="text-xs sm:text-sm font-semibold text-zinc-300 mb-2 tracking-tight flex items-center gap-1.5">
            <span>Borrowed</span>
            {summary.totalBorrowedOutstanding > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </span>
          <div
            onClick={() => setShowBorrowedModal(true)}
            className={`w-full min-h-[120px] sm:min-h-[130px] p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center shadow-md group ${
              summary.totalBorrowedOutstanding > 0
                ? 'border-amber-500/70 hover:border-amber-400 ring-1 ring-amber-500/20'
                : 'border-zinc-700/90 hover:border-zinc-500'
            }`}
          >
            <span className={`text-xl sm:text-2xl font-bold tracking-tight tabular-nums font-mono ${
              summary.totalBorrowedOutstanding > 0 ? 'text-amber-400' : 'text-zinc-300'
            }`}>
              {formatIndianCurrency(summary.totalBorrowedOutstanding)}
            </span>
            <span className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
              {summary.totalBorrowedOutstanding > 0 ? (
                <>
                  <HandCoins className="w-3.5 h-3.5 text-amber-400" />
                  <span>{summary.totalBorrowedActiveCount} lender{summary.totalBorrowedActiveCount === 1 ? '' : 's'} pending</span>
                </>
              ) : (
                <span>No debt / All clear</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 5. ROW 5: Insights Strip */}
      <div
        onClick={() => setActiveTab('insights')}
        className="w-full p-4 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border-2 border-zinc-700/90 hover:border-emerald-500/60 transition-all cursor-pointer flex items-center justify-between shadow-md group"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="truncate">
            <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
              Insights & Cash Velocity
            </h4>
            <p className="text-[11px] text-zinc-400 truncate">
              Net operating cash velocity for {currentMonthLabel}
            </p>
          </div>
        </div>
        <div className="text-right shrink-0 pl-2">
          <span className={`text-base sm:text-lg font-bold tracking-tight font-mono tabular-nums ${
            summary.netOperatingCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {formatIndianCurrency(summary.netOperatingCashFlow)}
          </span>
          <span className="text-[10px] text-zinc-500 block">Period velocity</span>
        </div>
      </div>

      {/* 6. RECENT ACTIVITY STRIP (Quiet, minimalist below the sketch grid) */}
      <div className="pt-4 border-t border-zinc-800/80">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-semibold text-zinc-400 uppercase tracking-wider">
            Recent Activity
          </span>
          <button
            onClick={() => setActiveTab('transactions')}
            className="text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
          >
            View Full History
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-6 px-4 bg-zinc-900/40 rounded-xl border border-zinc-800/80">
            <p className="text-xs text-zinc-400">No transactions recorded yet.</p>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              Tap the circular (+) button in the bottom-right to record your first entry.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60 bg-zinc-900/50 rounded-xl border border-zinc-800/80 overflow-hidden">
            {recentTransactions.map((tx) => {
              const isPositive = tx.type === 'income' || tx.type === 'investment_return' || tx.type === 'borrowed_inflow';
              const isNegative = tx.type === 'expense' || tx.type === 'investment_contribution' || tx.type === 'investment_expense' || tx.type === 'borrowed_repayment';
              return (
                <div key={tx.id} className="p-3 flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-zinc-200 truncate">
                      {tx.lenderName
                        ? `${tx.type === 'borrowed_inflow' ? 'Borrowed from' : 'Repayment to'} ${tx.lenderName}`
                        : tx.notes || tx.type.replace('_', ' ')}
                    </p>
                    <p className="text-[11px] text-zinc-500 mt-0.5 font-mono">
                      {formatShortDate(tx.date)} · <span className="capitalize">{tx.type.replace('_', ' ')}</span>
                      {tx.lenderName ? ` · ${tx.lenderName}` : ''}
                    </p>
                  </div>
                  <span className={`font-mono font-bold tabular-nums shrink-0 ${
                    isPositive ? 'text-emerald-400' : isNegative ? 'text-zinc-200' : 'text-zinc-400'
                  }`}>
                    {isPositive ? '+' : isNegative ? '-' : ''}{formatIndianCurrency(tx.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* BORROWED MONEY BREAKDOWN MODAL */}
      {showBorrowedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <HandCoins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Borrowed Money & Lenders</h3>
                  <p className="text-xs text-zinc-400">Total Outstanding Debt: {formatIndianCurrency(summary.totalBorrowedOutstanding)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowBorrowedModal(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => {
                    setShowBorrowedModal(false);
                    openQuickEntry('borrowed');
                  }}
                  className="flex-1 py-2.5 px-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Borrow More Money</span>
                </button>
                <button
                  onClick={() => {
                    setShowBorrowedModal(false);
                    openQuickEntry('borrowed_repayment');
                  }}
                  className="flex-1 py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Repay / Return Money</span>
                </button>
              </div>

              {summary.lendersSummary.length === 0 ? (
                <div className="text-center py-8 bg-zinc-950/50 rounded-xl border border-zinc-800/80 p-4">
                  <p className="text-sm font-semibold text-zinc-300">No borrowed money records</p>
                  <p className="text-xs text-zinc-500 mt-1">
                    When you borrow money from any person, click "+ Borrow More Money" to record the amount, lender name, tenure, and interest rate.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {summary.lendersSummary.map((lender) => (
                    <div
                      key={lender.lenderName}
                      className={`p-4 rounded-xl border transition-all ${
                        lender.outstanding > 0
                          ? 'bg-zinc-950/70 border-amber-500/30 ring-1 ring-amber-500/10'
                          : 'bg-zinc-950/40 border-zinc-800/80 opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>{lender.lenderName}</span>
                            {lender.outstanding === 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                                Fully Cleared
                              </span>
                            )}
                          </h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5 font-mono">
                            Last active: {formatShortDate(lender.lastDate)}
                            {lender.duration ? ` · Tenure: ${lender.duration}` : ''}
                            {lender.interestRate ? ` · Rate: ${lender.interestRate}` : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`text-sm font-bold font-mono tabular-nums ${
                            lender.outstanding > 0 ? 'text-amber-400' : 'text-zinc-400'
                          }`}>
                            {formatIndianCurrency(lender.outstanding)}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">Remaining Due</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-zinc-800/70 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                          <span>Borrowed: <strong className="text-zinc-200">{formatIndianCurrency(lender.totalBorrowed)}</strong></span>
                          <span>·</span>
                          <span>Returned: <strong className="text-emerald-400">{formatIndianCurrency(lender.totalRepaid)}</strong></span>
                        </div>

                        {lender.outstanding > 0 && (
                          <button
                            onClick={() => {
                              setShowBorrowedModal(false);
                              openQuickEntry('borrowed_repayment');
                            }}
                            className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                          >
                            Repay
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 
        6. PROMINENT CIRCULAR (+) BUTTON IN BOTTOM-RIGHT
        Directly matches the circle with (+) drawn in the user's sketch!
      */}
      <div className="fixed bottom-22 right-5 sm:bottom-8 sm:right-8 z-40">
        <button
          onClick={() => openQuickEntry()}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-white text-zinc-950 hover:bg-zinc-100 active:scale-95 transition-transform flex items-center justify-center shadow-2xl border-2 border-zinc-300 cursor-pointer group"
          aria-label="Add transaction entry"
          title="Add Entry (+)"
        >
          <Plus className="w-8 h-8 sm:w-9 sm:h-9 stroke-[2.5] text-zinc-950 group-hover:scale-110 transition-transform" />
        </button>
      </div>
    </div>
  );
};
