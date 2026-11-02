import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { InvestmentType } from '../../types/financial';
import { 
  X, 
  TrendingUp, 
  CreditCard, 
  Briefcase, 
  ArrowDownLeft, 
  ArrowRightLeft,
  ArrowUpRight,
  Plus, 
  Check, 
  AlertCircle,
  Building2,
  Banknote,
  RotateCcw,
  Calendar,
  ReceiptText,
  HandCoins,
  Users,
  BadgePercent,
  Clock,
  ArrowDownRight
} from 'lucide-react';
import { formatIndianCurrency } from '../../utils/currency';

export const QuickEntryModal: React.FC = () => {
  const { 
    isQuickEntryOpen, 
    quickEntryType, 
    closeQuickEntry, 
    openQuickEntry,
    accounts, 
    incomeSources, 
    expenseCategories, 
    investments,
    investmentMetricsList,
    summary,
    addTransaction,
    addInvestment,
    addExpenseCategory
  } = useFinance();

  // Mode: null for menu, or 'income' | 'expense' | 'investment' | 'investment_return' | 'transfer'
  const activeMode = quickEntryType;

  // Form Fields State
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tid, setTid] = useState('');
  const [accountId, setAccountId] = useState(() => accounts[0]?.id || '');
  const [toAccountId, setToAccountId] = useState(() => accounts[1]?.id || accounts[0]?.id || '');
  const [sourceId, setSourceId] = useState(() => incomeSources[0]?.id || '');
  const [categoryId, setCategoryId] = useState(() => expenseCategories[0]?.id || '');
  const [investmentId, setInvestmentId] = useState(() => investments[0]?.id || '');
  const [notes, setNotes] = useState('');
  const [associatedBusiness, setAssociatedBusiness] = useState('');

  // Keep state synchronized with loaded accounts / categories / investments
  useEffect(() => {
    if ((!accountId || !accounts.some((a) => a.id === accountId)) && accounts.length > 0) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    if ((!toAccountId || toAccountId === accountId || !accounts.some((a) => a.id === toAccountId)) && accounts.length > 1) {
      const other = accounts.find((a) => a.id !== accountId);
      if (other) setToAccountId(other.id);
    }
  }, [accounts, accountId, toAccountId]);

  useEffect(() => {
    if ((!sourceId || !incomeSources.some((s) => s.id === sourceId)) && incomeSources.length > 0) {
      setSourceId(incomeSources[0].id);
    }
  }, [incomeSources, sourceId]);

  useEffect(() => {
    if ((!categoryId || !expenseCategories.some((c) => c.id === categoryId)) && expenseCategories.length > 0) {
      setCategoryId(expenseCategories[0].id);
    }
  }, [expenseCategories, categoryId]);

  useEffect(() => {
    if ((!investmentId || !investments.some((i) => i.id === investmentId)) && investments.length > 0) {
      setInvestmentId(investments[0].id);
    }
  }, [investments, investmentId]);

  // Repayment split state
  const [principalReturned, setPrincipalReturned] = useState('');
  const [interestOrProfitReceived, setInterestOrProfitReceived] = useState('');

  // Investment creation state
  const [invName, setInvName] = useState('');
  const [invType, setInvType] = useState<InvestmentType>('rental_asset');
  const [invPurpose, setInvPurpose] = useState('');
  const [invExpectedMethod, setInvExpectedMethod] = useState('');
  const [invExpectedRate, setInvExpectedRate] = useState('');
  const [invExpectedDuration, setInvExpectedDuration] = useState('');
  // Borrowed money & Repayment state
  const [lenderName, setLenderName] = useState('');
  const [borrowedDuration, setBorrowedDuration] = useState('');
  const [borrowedInterestRate, setBorrowedInterestRate] = useState('');
  const [selectedRepayLender, setSelectedRepayLender] = useState('');

  // Auto-sync selectedRepayLender when entering borrowed_repayment
  useEffect(() => {
    if (activeMode === 'borrowed_repayment') {
      if ((!selectedRepayLender || !summary.lendersSummary.some(l => l.lenderName === selectedRepayLender)) && summary.lendersSummary.length > 0) {
        setSelectedRepayLender(summary.lendersSummary[0].lenderName);
      }
    }
  }, [activeMode, selectedRepayLender, summary.lendersSummary]);

  // Current selected lender details
  const currentLenderInfo = useMemo(() => {
    if (!selectedRepayLender) return null;
    return summary.lendersSummary.find((l) => l.lenderName.toLowerCase() === selectedRepayLender.trim().toLowerCase()) || null;
  }, [selectedRepayLender, summary.lendersSummary]);

  // Inline new category state
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Feedback states
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Date input ref for direct picker trigger
  const dateInputRef = useRef<HTMLInputElement>(null);

  if (!isQuickEntryOpen) return null;

  const resetFormState = () => {
    setAmount('');
    setDate(new Date().toISOString().split('T')[0]);
    setTid('');
    setNotes('');
    setAssociatedBusiness('');
    setPrincipalReturned('');
    setInterestOrProfitReceived('');
    setInvName('');
    setInvPurpose('');
    setInvExpectedMethod('');
    setInvExpectedRate('');
    setInvExpectedDuration('');
    setLenderName('');
    setBorrowedDuration('');
    setBorrowedInterestRate('');
    setSelectedRepayLender('');
    setShowNewCatInput(false);
    setNewCatName('');
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleSelectMode = (
    mode: 'income' | 'expense' | 'investment' | 'investment_return' | 'transfer' | 'borrowed' | 'borrowed_repayment'
  ) => {
    resetFormState();
    openQuickEntry(mode);
  };

  const handleSetQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleOpenCalendar = () => {
    if (dateInputRef.current) {
      if (typeof dateInputRef.current.showPicker === 'function') {
        dateInputRef.current.showPicker();
      } else {
        dateInputRef.current.focus();
      }
    }
  };

  const handleAddInlineCategory = () => {
    if (!newCatName.trim()) return;
    const created = addExpenseCategory({ name: newCatName.trim(), isActive: true });
    setCategoryId(created.id);
    setNewCatName('');
    setShowNewCatInput(false);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const parsedAmount = parseFloat(amount);
    const effectiveAccountId = accountId || accounts[0]?.id;

    if (!effectiveAccountId) {
      setErrorMessage('Please create or select a valid payment/receipt account.');
      return;
    }

    const trimmedTid = tid.trim();
    const trimmedNotes = notes.trim();

    if (activeMode === 'income') {
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMessage('Please enter a valid positive earnings amount.');
        return;
      }
      const effectiveSourceId = sourceId || incomeSources[0]?.id;
      const selectedSource = incomeSources.find((s) => s.id === effectiveSourceId);
      const biz = selectedSource?.associatedBusiness || associatedBusiness.trim();

      const res = addTransaction({
        date,
        type: 'income',
        amount: parsedAmount,
        accountId: effectiveAccountId,
        sourceId: effectiveSourceId,
        ...(trimmedTid ? { tid: trimmedTid, referenceDoc: trimmedTid } : {}),
        ...(biz ? { associatedBusiness: biz } : {}),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to record earnings.');
        return;
      }
      setSuccessMessage(`Recorded earnings of ${formatIndianCurrency(parsedAmount)} on ${date}`);
      setTimeout(() => {
        closeQuickEntry();
        resetFormState();
      }, 700);
    } else if (activeMode === 'expense') {
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMessage('Please enter a valid positive expense amount.');
        return;
      }
      const effectiveCategoryId = categoryId || expenseCategories[0]?.id;
      const biz = associatedBusiness.trim();

      const res = addTransaction({
        date,
        type: 'expense',
        amount: parsedAmount,
        accountId: effectiveAccountId,
        categoryId: effectiveCategoryId,
        ...(trimmedTid ? { tid: trimmedTid, referenceDoc: trimmedTid } : {}),
        ...(biz ? { associatedBusiness: biz } : {}),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to record expense.');
        return;
      }
      setSuccessMessage(`Recorded expense of ${formatIndianCurrency(parsedAmount)} on ${date}`);
      setTimeout(() => {
        closeQuickEntry();
        resetFormState();
      }, 700);
    } else if (activeMode === 'transfer') {
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMessage('Please enter a valid transfer amount.');
        return;
      }
      const effectiveToAccountId =
        toAccountId || accounts.find((a) => a.id !== effectiveAccountId)?.id || accounts[1]?.id;

      if (!effectiveToAccountId || effectiveAccountId === effectiveToAccountId) {
        setErrorMessage('Source account and destination account cannot be the same.');
        return;
      }
      const res = addTransaction({
        date,
        type: 'transfer_internal',
        amount: parsedAmount,
        accountId: effectiveAccountId,
        toAccountId: effectiveToAccountId,
        ...(trimmedTid ? { tid: trimmedTid, referenceDoc: trimmedTid } : {}),
        notes: trimmedNotes || 'Internal Account Transfer',
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to record transfer.');
        return;
      }
      setSuccessMessage(`Recorded transfer of ${formatIndianCurrency(parsedAmount)} on ${date}`);
      setTimeout(() => {
        closeQuickEntry();
        resetFormState();
      }, 700);
    } else if (activeMode === 'investment_return') {
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMessage('Please enter the total return amount received.');
        return;
      }
      const effectiveInvestmentId = investmentId || investments[0]?.id;
      if (!effectiveInvestmentId) {
        setErrorMessage('Please select or create an investment first.');
        return;
      }
      const pRet = parseFloat(principalReturned) || 0;
      const profit = parseFloat(interestOrProfitReceived) || 0;

      const res = addTransaction({
        date,
        type: 'investment_return',
        amount: parsedAmount,
        accountId: effectiveAccountId,
        investmentId: effectiveInvestmentId,
        principalReturned: pRet,
        interestOrProfitReceived: profit,
        ...(trimmedTid ? { tid: trimmedTid, referenceDoc: trimmedTid } : {}),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to record return.');
        return;
      }
      setSuccessMessage(
        `Recorded return on ${date}: ${formatIndianCurrency(pRet)} Principal + ${formatIndianCurrency(profit)} Profit`
      );
      setTimeout(() => {
        closeQuickEntry();
        resetFormState();
      }, 800);
    } else if (activeMode === 'investment') {
      if (!invName.trim()) {
        setErrorMessage('Please provide an investment name.');
        return;
      }
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMessage('Please enter initial capital amount.');
        return;
      }
      const biz = associatedBusiness.trim();
      const res = addInvestment({
        name: invName.trim(),
        type: invType,
        initialPrincipal: parsedAmount,
        date,
        fundingAccountId: effectiveAccountId,
        purpose: invPurpose.trim(),
        ...(biz ? { associatedEntity: biz } : {}),
        expectedReturnMethod: invExpectedMethod.trim() || 'Rental / Cash Flow',
        ...(invExpectedRate.trim() ? { expectedRateOrProfit: invExpectedRate.trim() } : {}),
        ...(invExpectedDuration.trim() ? { expectedDuration: invExpectedDuration.trim() } : {}),
        ...(trimmedNotes ? { notes: trimmedNotes } : {}),
        status: 'active',
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to create investment.');
        return;
      }
      setSuccessMessage(`Created investment ${invName} for ${formatIndianCurrency(parsedAmount)} on ${date}`);
      setTimeout(() => {
        closeQuickEntry();
        resetFormState();
      }, 750);
    } else if (activeMode === 'borrowed') {
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMessage('Please enter a valid positive borrowed amount.');
        return;
      }
      if (!lenderName.trim()) {
        setErrorMessage('Please enter the name of the person or entity you borrowed money from.');
        return;
      }
      const res = addTransaction({
        date,
        type: 'borrowed_inflow',
        amount: parsedAmount,
        accountId: effectiveAccountId,
        lenderName: lenderName.trim(),
        ...(borrowedDuration.trim() ? { borrowedDuration: borrowedDuration.trim() } : {}),
        ...(borrowedInterestRate.trim() ? { borrowedInterestRate: borrowedInterestRate.trim() } : {}),
        ...(trimmedTid ? { tid: trimmedTid, referenceDoc: trimmedTid } : {}),
        notes: trimmedNotes || `Borrowed from ${lenderName.trim()}`,
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to record borrowed money.');
        return;
      }
      setSuccessMessage(
        `Recorded borrowed amount of ${formatIndianCurrency(parsedAmount)} from ${lenderName.trim()} into ${accounts.find(a => a.id === effectiveAccountId)?.name || 'account'} on ${date}`
      );
      setTimeout(() => {
        closeQuickEntry();
        resetFormState();
      }, 750);
    } else if (activeMode === 'borrowed_repayment') {
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setErrorMessage('Please enter the repayment amount returned.');
        return;
      }
      const targetPerson = selectedRepayLender.trim() || lenderName.trim();
      if (!targetPerson) {
        setErrorMessage('Please select or specify the person you are returning money to.');
        return;
      }
      const res = addTransaction({
        date,
        type: 'borrowed_repayment',
        amount: parsedAmount,
        accountId: effectiveAccountId,
        lenderName: targetPerson,
        ...(trimmedTid ? { tid: trimmedTid, referenceDoc: trimmedTid } : {}),
        notes: trimmedNotes || `Returned borrowed money to ${targetPerson}`,
      });
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to record repayment.');
        return;
      }
      setSuccessMessage(
        `Recorded return of ${formatIndianCurrency(parsedAmount)} to ${targetPerson} on ${date}`
      );
      setTimeout(() => {
        closeQuickEntry();
        resetFormState();
      }, 750);
    }
  };

  // Helper: auto balance when total amount changes in split return
  const handleAutoSplit = (totalVal: number) => {
    const targetInv = investmentMetricsList.find((m) => m.investment.id === investmentId);
    if (!targetInv) return;
    const maxPrincipal = targetInv.outstandingPrincipal;
    if (totalVal <= maxPrincipal) {
      setPrincipalReturned(totalVal.toString());
      setInterestOrProfitReceived('0');
    } else {
      setPrincipalReturned(maxPrincipal.toString());
      setInterestOrProfitReceived((totalVal - maxPrincipal).toString());
    }
  };

  // Format date readable representation
  const formattedReadableDate = (() => {
    try {
      const parsed = new Date(date + 'T00:00:00');
      if (isNaN(parsed.getTime())) return date;
      return parsed.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return date;
    }
  })();

  const isToday = date === new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              {activeMode ? (
                <button
                  type="button"
                  onClick={() => openQuickEntry(undefined)}
                  className="text-zinc-400 hover:text-white mr-1 cursor-pointer"
                  title="Back to transaction menu"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              ) : null}
              {activeMode === 'income' && 'Record Earnings / Income'}
              {activeMode === 'expense' && 'Record Operating Expense'}
              {activeMode === 'investment' && 'Create New Investment'}
              {activeMode === 'investment_return' && 'Record Investment Return (Split)'}
              {activeMode === 'transfer' && 'Transfer Between Accounts'}
              {activeMode === 'borrowed' && 'Borrow Money (Loan Inflow)'}
              {activeMode === 'borrowed_repayment' && 'Repay Borrowed Money (Debt Return)'}
              {!activeMode && 'Quick Transaction Entry'}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {!activeMode
                ? 'Select the transaction type to record'
                : activeMode === 'borrowed'
                ? 'Record borrowed funds with lender person, tenure, and interest rate'
                : activeMode === 'borrowed_repayment'
                ? 'Return borrowed money to lender person with live balance synchronization'
                : 'Customizable date, TID, and instant balance synchronization'}
            </p>
          </div>
          <button
            onClick={() => {
              closeQuickEntry();
              resetFormState();
            }}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error & Success Feedback */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300 font-medium">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Primary Transaction Mode Selection */}
          {!activeMode && (
            <div className="space-y-2.5">
              {/* 1. Earnings */}
              <button
                onClick={() => handleSelectMode('income')}
                className="w-full p-3.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-emerald-500/40 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      1. Earnings / Income
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Rental income, client receipts, side business revenue
                    </p>
                  </div>
                </div>
                <ArrowDownLeft className="w-5 h-5 text-zinc-400 group-hover:text-emerald-400 transition-colors" />
              </button>

              {/* 2. Expenses */}
              <button
                onClick={() => handleSelectMode('expense')}
                className="w-full p-3.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-rose-500/40 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-rose-400 transition-colors">
                      2. Expenses
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Operating costs, maintenance, utilities, fuel, contractor fees
                    </p>
                  </div>
                </div>
                <CreditCard className="w-5 h-5 text-zinc-400 group-hover:text-rose-400 transition-colors" />
              </button>

              {/* 3. New Investment */}
              <button
                onClick={() => handleSelectMode('investment')}
                className="w-full p-3.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-blue-500/40 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">
                      3. New Investment
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Acquire rental assets (bikes, equipment), fund ventures, lend money
                    </p>
                  </div>
                </div>
                <Plus className="w-5 h-5 text-zinc-400 group-hover:text-blue-400 transition-colors" />
              </button>

              {/* 4. Account Transfer */}
              <button
                onClick={() => handleSelectMode('transfer')}
                className="w-full p-3.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-500/40 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
                      4. Account Transfer
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Transfer money between Bank & Cash accounts (does not affect net worth)
                    </p>
                  </div>
                </div>
                <ArrowRightLeft className="w-5 h-5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
              </button>

              {/* 5. Borrowed Money (Loan Received) */}
              <button
                onClick={() => handleSelectMode('borrowed')}
                className="w-full p-3.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-purple-500/40 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <HandCoins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-purple-400 transition-colors flex items-center gap-2">
                      <span>5. Borrow Money (Loan Received)</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-purple-500/20 text-purple-300 rounded font-normal">Inflow</span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Borrowed from a person/lender (deposited to bank or cash)
                    </p>
                  </div>
                </div>
                <ArrowDownRight className="w-5 h-5 text-zinc-400 group-hover:text-purple-400 transition-colors" />
              </button>

              {/* 6. Repay Borrowed Money (Debt Return) */}
              <button
                onClick={() => handleSelectMode('borrowed_repayment')}
                className="w-full p-3.5 rounded-xl bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800 hover:border-amber-500/40 flex items-center justify-between text-left transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <RotateCcw className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors flex items-center gap-2">
                      <span>6. Repay Borrowed Money (Debt Return)</span>
                      {summary.totalBorrowedOutstanding > 0 && (
                        <span className="text-[10px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded font-bold font-mono">
                          {formatIndianCurrency(summary.totalBorrowedOutstanding)} due
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Return money to lender person (reduces your debt)
                    </p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-zinc-400 group-hover:text-amber-400 transition-colors" />
              </button>

              {/* 7. Investment Return Split */}
              <div className="pt-1.5">
                <button
                  onClick={() => handleSelectMode('investment_return')}
                  className="w-full p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/60 flex items-center justify-between text-left transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <RotateCcw className="w-4 h-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold text-zinc-200">7. Record Investment Return</p>
                      <p className="text-[11px] text-zinc-400">Split principal repayment from interest/profit received</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono text-emerald-400">Split & Save</span>
                </button>
              </div>
            </div>
          )}

          {/* Form when a mode is active */}
          {activeMode && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Amount Field */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1.5">
                  {activeMode === 'investment' ? 'Initial Capital Amount' : 'Amount (₹)'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-zinc-400 font-mono">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      if (activeMode === 'investment_return') {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) handleAutoSplit(val);
                      }
                    }}
                    placeholder="0"
                    autoFocus
                    required
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl py-2.5 pl-9 pr-4 text-xl font-bold text-white placeholder-zinc-700 font-mono focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* DATE SELECTION SECTION (Explicitly Selectable + Quick Chips) */}
              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Select Transaction Date</span>
                  </label>
                  {/* Quick Select Chips */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetQuickDate(0)}
                      className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                        isToday
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDate(1)}
                      className="px-2 py-0.5 rounded text-[11px] border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      Yesterday
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetQuickDate(2)}
                      className="px-2 py-0.5 rounded text-[11px] border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      2d Ago
                    </button>
                  </div>
                </div>

                <div 
                  onClick={handleOpenCalendar}
                  className="flex items-center justify-between bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-xl px-3 py-2 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <input
                      ref={dateInputRef}
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      style={{ colorScheme: 'dark' }}
                      className="bg-transparent text-sm font-bold text-white focus:outline-none cursor-pointer"
                    />
                  </div>
                  <span className="text-xs text-emerald-400 font-mono shrink-0 pl-2">
                    {formattedReadableDate}
                  </span>
                </div>
              </div>

              {/* MODE SPECIFIC FIELDS */}

              {/* EARNINGS SPECIFIC */}
              {activeMode === 'income' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Income Source</label>
                    <select
                      value={sourceId}
                      onChange={(e) => setSourceId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    >
                      {incomeSources.filter((s) => s.isActive).map((src) => (
                        <option key={src.id} value={src.id} className="bg-zinc-900 text-zinc-100">
                          {src.name} ({src.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Destination Account (Where money was received)
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    >
                      {accounts.filter((a) => a.isActive).map((acc) => (
                        <option key={acc.id} value={acc.id} className="bg-zinc-900 text-zinc-100">
                          {acc.name} ({acc.type === 'bank' ? 'Bank Account' : 'Cash in Hand'})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* EXPENSES SPECIFIC */}
              {activeMode === 'expense' && (
                <>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-medium text-zinc-400">Expense Category</label>
                      <button
                        type="button"
                        onClick={() => setShowNewCatInput(!showNewCatInput)}
                        className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                      >
                        {showNewCatInput ? 'Cancel' : '+ New Category'}
                      </button>
                    </div>

                    {showNewCatInput ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="e.g. Marketing, Tooling"
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={handleAddInlineCategory}
                          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl text-xs font-semibold cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      >
                        {expenseCategories.filter((c) => c.isActive).map((cat) => (
                          <option key={cat.id} value={cat.id} className="bg-zinc-900 text-zinc-100">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">
                      Payment Source (Paid from)
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    >
                      {accounts.filter((a) => a.isActive).map((acc) => (
                        <option key={acc.id} value={acc.id} className="bg-zinc-900 text-zinc-100">
                          {acc.name} ({acc.type === 'bank' ? 'Bank Account' : 'Cash in Hand'})
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* TRANSFER SPECIFIC */}
              {activeMode === 'transfer' && (
                <div className="space-y-3 p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">From Account</label>
                      <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      >
                        {accounts.filter((a) => a.isActive).map((acc) => (
                          <option key={acc.id} value={acc.id} className="bg-zinc-900">
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">To Destination</label>
                      <select
                        value={toAccountId}
                        onChange={(e) => setToAccountId(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      >
                        {accounts.filter((a) => a.isActive).map((acc) => (
                          <option key={acc.id} value={acc.id} className="bg-zinc-900">
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* REPAYMENT SPLIT SPECIFIC */}
              {activeMode === 'investment_return' && (
                <div className="space-y-3 p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Related Investment</label>
                    <select
                      value={investmentId}
                      onChange={(e) => {
                        setInvestmentId(e.target.value);
                        const val = parseFloat(amount);
                        if (!isNaN(val) && val > 0) handleAutoSplit(val);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    >
                      {investments.map((inv) => {
                        const m = investmentMetricsList.find((x) => x.investment.id === inv.id);
                        return (
                          <option key={inv.id} value={inv.id} className="bg-zinc-900 text-zinc-100">
                            {inv.name} (Outstanding: {formatIndianCurrency(m?.outstandingPrincipal || 0)})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-blue-400 mb-1">
                        Principal Returned (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={principalReturned}
                        onChange={(e) => {
                          setPrincipalReturned(e.target.value);
                          const p = parseFloat(e.target.value) || 0;
                          const tot = parseFloat(amount) || 0;
                          setInterestOrProfitReceived(Math.max(0, tot - p).toString());
                        }}
                        placeholder="0"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs font-mono text-zinc-100 focus:border-blue-400 focus:outline-none"
                      />
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">Reduces capital</span>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-emerald-400 mb-1">
                        Profit / Interest (₹)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={interestOrProfitReceived}
                        onChange={(e) => {
                          setInterestOrProfitReceived(e.target.value);
                          const prof = parseFloat(e.target.value) || 0;
                          const tot = parseFloat(amount) || 0;
                          setPrincipalReturned(Math.max(0, tot - prof).toString());
                        }}
                        placeholder="0"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs font-mono text-zinc-100 focus:border-emerald-400 focus:outline-none"
                      />
                      <span className="text-[10px] text-zinc-400 mt-0.5 block">Counts as earnings</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Receiving Account</label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    >
                      {accounts.filter((a) => a.isActive).map((acc) => (
                        <option key={acc.id} value={acc.id} className="bg-zinc-900 text-zinc-100">
                          {acc.name} ({acc.type === 'bank' ? 'Bank Account' : 'Cash in Hand'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* NEW INVESTMENT SPECIFIC */}
              {activeMode === 'investment' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Investment Name</label>
                    <input
                      type="text"
                      value={invName}
                      onChange={(e) => setInvName(e.target.value)}
                      placeholder="e.g. Royal Enfield Rental Bike, Coffee Kiosk Seed"
                      required
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Investment Type</label>
                      <select
                        value={invType}
                        onChange={(e) => setInvType(e.target.value as InvestmentType)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="rental_asset" className="bg-zinc-900">Rental Asset</option>
                        <option value="business" className="bg-zinc-900">Business Venture</option>
                        <option value="loan" className="bg-zinc-900">Lent Capital / Loan</option>
                        <option value="equipment" className="bg-zinc-900">Productive Equipment</option>
                        <option value="profit_sharing" className="bg-zinc-900">Profit Share</option>
                        <option value="other" className="bg-zinc-900">Other Investment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Funding Account</label>
                      <select
                        value={accountId}
                        onChange={(e) => setAccountId(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      >
                        {accounts.filter((a) => a.isActive).map((acc) => (
                          <option key={acc.id} value={acc.id} className="bg-zinc-900">
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1">Purpose / Asset Role</label>
                    <input
                      type="text"
                      value={invPurpose}
                      onChange={(e) => setInvPurpose(e.target.value)}
                      placeholder="e.g. Purchase bike to rent to weekend tourists"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Expected Return</label>
                      <input
                        type="text"
                        value={invExpectedRate}
                        onChange={(e) => setInvExpectedRate(e.target.value)}
                        placeholder="e.g. ₹12,000/mo rental"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-zinc-400 mb-1">Duration</label>
                      <input
                        type="text"
                        value={invExpectedDuration}
                        onChange={(e) => setInvExpectedDuration(e.target.value)}
                        placeholder="e.g. 24 Months"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* BORROWED MONEY SPECIFIC (Borrow from person/lender) */}
              {activeMode === 'borrowed' && (
                <div className="space-y-3 p-3.5 bg-zinc-950/80 border border-purple-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                    <HandCoins className="w-4 h-4 text-purple-400" />
                    <span>Borrow Money (Loan Inflow)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Which Person / Lender Through? <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={lenderName}
                      onChange={(e) => setLenderName(e.target.value)}
                      placeholder="e.g. Ramesh, Uncle Kumar, SBI Bank, Friend Suresh"
                      required
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-purple-500 focus:outline-none"
                    />
                    {/* Previous lenders chips for quick 1-tap select */}
                    {summary.lendersSummary && summary.lendersSummary.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                        <span className="text-[10px] text-zinc-500">Recent lenders:</span>
                        {summary.lendersSummary.slice(0, 4).map((l) => (
                          <button
                            key={l.lenderName}
                            type="button"
                            onClick={() => setLenderName(l.lenderName)}
                            className="px-2 py-0.5 rounded text-[10px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-purple-300 cursor-pointer"
                          >
                            {l.lenderName}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Receiving Account (Where borrowed money was deposited)
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:border-purple-500 focus:outline-none"
                    >
                      {accounts.filter((a) => a.isActive).map((acc) => (
                        <option key={acc.id} value={acc.id} className="bg-zinc-900 text-zinc-100">
                          {acc.name} ({acc.type === 'bank' ? 'Bank Account' : 'Cash in Hand'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-purple-400" />
                        <span>Duration / Tenure</span>
                      </label>
                      <input
                        type="text"
                        value={borrowedDuration}
                        onChange={(e) => setBorrowedDuration(e.target.value)}
                        placeholder="e.g. 6 Months, 1 Year"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-100 focus:border-purple-500 focus:outline-none"
                      />
                      <div className="flex gap-1 mt-1">
                        {['3 Months', '6 Months', '1 Year'].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setBorrowedDuration(chip)}
                            className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300 mb-1 flex items-center gap-1">
                        <BadgePercent className="w-3 h-3 text-purple-400" />
                        <span>Interest Rate</span>
                      </label>
                      <input
                        type="text"
                        value={borrowedInterestRate}
                        onChange={(e) => setBorrowedInterestRate(e.target.value)}
                        placeholder="e.g. 0%, 2% / mo, 12% p.a."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-100 focus:border-purple-500 focus:outline-none"
                      />
                      <div className="flex gap-1 mt-1">
                        {['0% Free', '1% / mo', '2% / mo'].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setBorrowedInterestRate(chip)}
                            className="text-[10px] text-zinc-400 hover:text-white px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded cursor-pointer"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* REPAY BORROWED MONEY SPECIFIC (Debt Return) */}
              {activeMode === 'borrowed_repayment' && (
                <div className="space-y-3 p-3.5 bg-zinc-950/80 border border-amber-500/30 rounded-xl">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                    <RotateCcw className="w-4 h-4 text-amber-400" />
                    <span>Return Borrowed Money (Debt Repayment)</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Which Person / Lender Are You Repaying? <span className="text-rose-400">*</span>
                    </label>

                    {summary.lendersSummary && summary.lendersSummary.length > 0 ? (
                      <select
                        value={selectedRepayLender}
                        onChange={(e) => {
                          const name = e.target.value;
                          setSelectedRepayLender(name);
                          const lender = summary.lendersSummary.find((l) => l.lenderName === name);
                          if (lender && lender.outstanding > 0) {
                            setAmount(lender.outstanding.toString());
                          }
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                      >
                        <option value="">-- Select Person Borrowed From --</option>
                        {summary.lendersSummary.map((l) => (
                          <option key={l.lenderName} value={l.lenderName} className="bg-zinc-900">
                            {l.lenderName} — {l.outstanding > 0 ? `₹${l.outstanding.toLocaleString('en-IN')} Due` : 'Fully Repaid'}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={selectedRepayLender}
                        onChange={(e) => setSelectedRepayLender(e.target.value)}
                        placeholder="Enter person's name (e.g. Ramesh)"
                        required
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                      />
                    )}
                  </div>

                  {/* Lender summary card */}
                  {currentLenderInfo && (
                    <div className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-1.5 text-xs">
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Total Borrowed:</span>
                        <span className="font-mono text-zinc-200">{formatIndianCurrency(currentLenderInfo.totalBorrowed)}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-400">
                        <span>Already Repaid:</span>
                        <span className="font-mono text-emerald-400">{formatIndianCurrency(currentLenderInfo.totalRepaid)}</span>
                      </div>
                      <div className="border-t border-zinc-800 pt-1 flex justify-between items-center font-bold">
                        <span className="text-amber-400">Remaining Balance:</span>
                        <span className="font-mono text-amber-300">{formatIndianCurrency(currentLenderInfo.outstanding)}</span>
                      </div>

                      {currentLenderInfo.outstanding > 0 && (
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setAmount(currentLenderInfo.outstanding.toString())}
                            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 rounded-lg text-[11px] font-semibold cursor-pointer"
                          >
                            Pay Full ({formatIndianCurrency(currentLenderInfo.outstanding)})
                          </button>
                          {currentLenderInfo.outstanding > 100 && (
                            <button
                              type="button"
                              onClick={() => setAmount(Math.round(currentLenderInfo.outstanding / 2).toString())}
                              className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-[11px] cursor-pointer"
                            >
                              Pay Half ({formatIndianCurrency(Math.round(currentLenderInfo.outstanding / 2))})
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Payment Account (Paid from Bank or Cash)
                    </label>
                    <select
                      value={accountId}
                      onChange={(e) => setAccountId(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 focus:border-amber-500 focus:outline-none"
                    >
                      {accounts.filter((a) => a.isActive).map((acc) => (
                        <option key={acc.id} value={acc.id} className="bg-zinc-900 text-zinc-100">
                          {acc.name} ({acc.type === 'bank' ? 'Bank Account' : 'Cash in Hand'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* TID / Reference & Business Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1 flex items-center gap-1">
                    <ReceiptText className="w-3 h-3 text-zinc-500" />
                    <span>TID / Ref # (Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={tid}
                    onChange={(e) => setTid(e.target.value)}
                    placeholder="e.g. UPI-98721, IMPS-302"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-100 font-mono focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 mb-1">Associated Business (Opt)</label>
                  <input
                    type="text"
                    value={associatedBusiness}
                    onChange={(e) => setAssociatedBusiness(e.target.value)}
                    placeholder="e.g. Bike Rentals, Consulting"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Notes / Description (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Booking deposit, Invoice #409, oil service"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => openQuickEntry(undefined)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                >
                  Save Transaction
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
