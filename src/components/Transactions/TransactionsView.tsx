import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types/financial';
import { formatIndianCurrency, formatDate, formatShortDate } from '../../utils/currency';
import { 
  ReceiptText, 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft,
  ShieldCheck, 
  Edit3, 
  Trash2, 
  X, 
  Check, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Clock
} from 'lucide-react';
import { filterTransactionsByDate, getDateRangeForPeriod } from '../../utils/calculations';
import { SecureDeleteModal } from './SecureDeleteModal';

export const TransactionsView: React.FC = () => {
  const { 
    transactions, 
    accounts, 
    incomeSources, 
    expenseCategories, 
    investments,
    updateTransaction,
    dateRange,
    setDateRange,
    shiftMonth,
    currentMonthLabel
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [isAllTime, setIsAllTime] = useState<boolean>(true); // Default to all-time history view as requested

  // Edit Modal State
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTid, setEditTid] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPrincipalReturned, setEditPrincipalReturned] = useState('');
  const [editProfitReceived, setEditProfitReceived] = useState('');
  const [editError, setEditError] = useState<string | null>(null);

  // Secure Delete Modal State (Requires Reason + 4-Digit Security PIN)
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);

  // Filtered transactions (with optional month scoping & date sorting)
  const filteredTransactions = useMemo(() => {
    let list = transactions;

    if (!isAllTime && dateRange.period !== 'all_time') {
      list = filterTransactionsByDate(list, dateRange);
    }

    const filtered = list.filter((tx) => {
      if (selectedType !== 'all') {
        if (selectedType === 'transfer') {
          if (tx.type !== 'transfer_internal' && tx.type !== 'transfer_external') return false;
        } else if (tx.type !== selectedType) {
          return false;
        }
      }

      if (selectedAccount !== 'all' && tx.accountId !== selectedAccount && tx.toAccountId !== selectedAccount) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const notesMatch = tx.notes?.toLowerCase().includes(q);
        const tidMatch = tx.tid?.toLowerCase().includes(q) || tx.referenceDoc?.toLowerCase().includes(q);
        const typeMatch = tx.type.toLowerCase().includes(q);
        const bizMatch = tx.associatedBusiness?.toLowerCase().includes(q);
        const amountMatch = tx.amount.toString().includes(q);
        const dateMatch = tx.date.includes(q);
        if (!notesMatch && !tidMatch && !typeMatch && !bizMatch && !amountMatch && !dateMatch) return false;
      }
      return true;
    });

    // Sort descending chronologically
    filtered.sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')));
    return filtered;
  }, [transactions, selectedType, selectedAccount, searchQuery, isAllTime, dateRange]);

  const handleStartEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setEditAmount(tx.amount.toString());
    setEditDate(tx.date);
    setEditTid(tx.tid || tx.referenceDoc || '');
    setEditNotes(tx.notes || '');
    setEditPrincipalReturned(tx.principalReturned ? tx.principalReturned.toString() : '');
    setEditProfitReceived(tx.interestOrProfitReceived ? tx.interestOrProfitReceived.toString() : '');
    setEditError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const parsedAmount = parseFloat(editAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setEditError('Please enter a valid positive amount.');
      return;
    }

    const updates: Partial<Transaction> = {
      amount: parsedAmount,
      date: editDate,
      tid: editTid.trim() || undefined,
      referenceDoc: editTid.trim() || undefined,
      notes: editNotes.trim(),
    };

    if (editingTx.type === 'investment_return') {
      const pRet = parseFloat(editPrincipalReturned) || 0;
      const profit = parseFloat(editProfitReceived) || 0;

      if (Math.round((pRet + profit) * 100) !== Math.round(parsedAmount * 100)) {
        setEditError(`Principal returned (₹${pRet}) + Profit (₹${profit}) must equal total amount (₹${parsedAmount}).`);
        return;
      }

      updates.principalReturned = pRet;
      updates.interestOrProfitReceived = profit;
    }

    const res = updateTransaction(editingTx.id, updates);
    if (!res.success) {
      setEditError(res.error || 'Failed to update transaction.');
      return;
    }

    setEditingTx(null);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Title & History Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <ReceiptText className="w-6 h-6 text-emerald-400" />
            Transaction History & Ledger
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Complete historical audit of every earning, expense, investment, repayment, and transfer
          </p>
        </div>

        {/* Total records badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-300">
            Total Records: <strong className="text-white">{filteredTransactions.length}</strong>
            {filteredTransactions.length !== transactions.length && (
              <span className="text-zinc-500"> / {transactions.length}</span>
            )}
          </span>
        </div>
      </div>

      {/* TIMEFRAME SELECTION (All-Time vs Month View) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-zinc-900/90 border border-zinc-800 rounded-2xl text-xs">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setIsAllTime(true)}
            className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 font-medium ${
              isAllTime
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>All Time History</span>
          </button>

          <button
            onClick={() => setIsAllTime(false)}
            className={`px-3 py-1.5 rounded-xl border transition-colors cursor-pointer flex items-center gap-1.5 font-medium ${
              !isAllTime
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Month View</span>
          </button>
        </div>

        {/* Month Stepper when not in all-time mode */}
        {!isAllTime && (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => shiftMonth(-1)}
              className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-medium"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
            <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-xl font-bold text-white text-xs min-w-[130px] text-center">
              {currentMonthLabel}
            </span>
            <button 
              onClick={() => shiftMonth(1)}
              className="p-1.5 hover:bg-zinc-800 rounded-xl text-zinc-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-medium"
              title="Next Month"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by TID, notes, amount, date, business..."
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:border-emerald-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Account Filter */}
          <div className="w-full sm:w-48">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:border-emerald-500 focus:outline-none"
            >
              <option value="all">All Accounts</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Type Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Entries' },
            { id: 'income', label: 'Earnings / Income' },
            { id: 'expense', label: 'Expenses' },
            { id: 'investment_contribution', label: 'Investments' },
            { id: 'investment_return', label: 'Returns (Principal + Profit)' },
            { id: 'transfer', label: 'Transfers' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs whitespace-nowrap transition-colors cursor-pointer ${
                selectedType === type.id
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                  : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* TRANSACTION LEDGER TABLE / LIST */}
      <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16 text-zinc-500 text-xs space-y-2">
            <p>No transactions match the selected filters.</p>
            <p className="text-[11px] text-zinc-600">
              {isAllTime
                ? 'Click "+ " at the bottom or top right to record your first transaction.'
                : 'Try switching to "All Time History" or choosing a different month.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/60">
            {filteredTransactions.map((tx) => {
              const account = accounts.find((a) => a.id === tx.accountId);
              const toAccount = tx.toAccountId ? accounts.find((a) => a.id === tx.toAccountId) : null;
              const source = tx.sourceId ? incomeSources.find((s) => s.id === tx.sourceId) : null;
              const category = tx.categoryId ? expenseCategories.find((c) => c.id === tx.categoryId) : null;
              const investment = tx.investmentId ? investments.find((i) => i.id === tx.investmentId) : null;

              const isPositive = tx.type === 'income' || tx.type === 'investment_return';
              const isNegative = tx.type === 'expense' || tx.type === 'investment_contribution' || tx.type === 'investment_expense';
              const isTransfer = tx.type === 'transfer_internal' || tx.type === 'transfer_external';

              return (
                <div 
                  key={tx.id} 
                  className="p-4 hover:bg-zinc-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      isNegative ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      isTransfer ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-zinc-800 text-zinc-300 border border-zinc-700'
                    }`}>
                      {isPositive ? <ArrowDownLeft className="w-4 h-4" /> :
                       isNegative ? <ArrowUpRight className="w-4 h-4" /> :
                       isTransfer ? <ArrowRightLeft className="w-4 h-4" /> :
                       <ShieldCheck className="w-4 h-4" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-zinc-100">
                          {tx.notes || source?.name || category?.name || investment?.name || tx.type.replace('_', ' ')}
                        </span>
                        <span className="text-[10px] uppercase font-mono text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                          {tx.type.replace('_', ' ')}
                        </span>
                        {tx.tid && (
                          <span className="text-[10px] font-mono text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            TID: {tx.tid}
                          </span>
                        )}
                        {tx.associatedBusiness && (
                          <span className="text-[10px] text-zinc-400 bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800">
                            {tx.associatedBusiness}
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-zinc-400 flex items-center gap-2 mt-1 flex-wrap font-mono">
                        <span className="text-zinc-300">{formatDate(tx.date)}</span>
                        <span>·</span>
                        <span>{account?.name || 'Account'}</span>
                        {toAccount && <span className="text-amber-400">→ {toAccount.name}</span>}
                        {investment && <span>· Asset: {investment.name}</span>}
                        {tx.principalReturned ? (
                          <span className="text-blue-400">· Principal: {formatIndianCurrency(tx.principalReturned)}</span>
                        ) : null}
                        {tx.interestOrProfitReceived ? (
                          <span className="text-emerald-400">· Profit: {formatIndianCurrency(tx.interestOrProfitReceived)}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-12 sm:pl-0">
                    <span className={`text-sm font-bold font-mono tabular-nums ${
                      isPositive ? 'text-emerald-400' :
                      isNegative ? 'text-zinc-200' :
                      isTransfer ? 'text-amber-400' :
                      'text-zinc-300'
                    }`}>
                      {isPositive ? '+' : isNegative ? '-' : ''}{formatIndianCurrency(tx.amount)}
                    </span>

                    {/* Action buttons: Edit & Hard Delete */}
                    <div className="flex items-center gap-1.5 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(tx)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Edit Transaction"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingTx(tx)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
                        title="Delete Transaction (PIN Protected)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT TRANSACTION MODAL */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl p-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800 mb-4">
              <h3 className="text-base font-bold text-white">Edit Transaction</h3>
              <button onClick={() => setEditingTx(null)} className="text-zinc-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300">
                {editError}
              </div>
            )}

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-base font-bold font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {editingTx.type === 'investment_return' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                  <div>
                    <label className="block text-[11px] font-medium text-blue-400 mb-1">Principal (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={editPrincipalReturned}
                      onChange={(e) => setEditPrincipalReturned(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-emerald-400 mb-1">Profit/Interest (₹)</label>
                    <input
                      type="number"
                      step="any"
                      value={editProfitReceived}
                      onChange={(e) => setEditProfitReceived(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  required
                  style={{ colorScheme: 'dark' }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">TID / Reference #</label>
                <input
                  type="text"
                  value={editTid}
                  onChange={(e) => setEditTid(e.target.value)}
                  placeholder="e.g. UPI-2094, IMPS-302"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs font-mono text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Notes</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
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
