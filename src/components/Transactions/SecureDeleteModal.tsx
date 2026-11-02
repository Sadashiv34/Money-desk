import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types/financial';
import { formatIndianCurrency, formatDate } from '../../utils/currency';
import { 
  AlertTriangle, 
  X, 
  ShieldAlert, 
  KeyRound, 
  Trash2, 
  Check, 
  Lock,
  ReceiptText
} from 'lucide-react';

interface SecureDeleteModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onDeleted?: () => void;
}

const COMMON_REASONS = [
  'Mistaken / Wrong Entry',
  'Duplicate Transaction',
  'Wrong Amount or Date',
  'Wrong Account Selected',
  'Dummy or Test Record'
];

export const SecureDeleteModal: React.FC<SecureDeleteModalProps> = ({
  transaction,
  onClose,
  onDeleted
}) => {
  const { deleteTransactionPermanently, accounts, investments, deletionPin } = useFinance();

  const [selectedReason, setSelectedReason] = useState<string>('Mistaken / Wrong Entry');
  const [customReason, setCustomReason] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!transaction) return null;

  const account = accounts.find((a) => a.id === transaction.accountId);
  const toAccount = transaction.toAccountId ? accounts.find((a) => a.id === transaction.toAccountId) : null;
  const investment = transaction.investmentId ? investments.find((i) => i.id === transaction.investmentId) : null;

  const effectiveReason = customReason.trim() ? `${selectedReason} - ${customReason.trim()}` : selectedReason;

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!pin || pin.length !== 4) {
      setErrorMessage('Please enter your complete 4-digit Security PIN.');
      return;
    }

    if (!effectiveReason.trim()) {
      setErrorMessage('Please choose or provide a reason for deleting this transaction.');
      return;
    }

    setIsDeleting(true);

    try {
      const res = await deleteTransactionPermanently(transaction.id, effectiveReason, pin);
      if (!res.success) {
        setErrorMessage(res.error || 'Failed to delete transaction. Please check your PIN.');
        setIsDeleting(false);
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsDeleting(false);
        if (onDeleted) onDeleted();
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred during deletion.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-red-500/30 text-zinc-100 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-red-950/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 text-rose-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Hard Transaction Deletion
              </h2>
              <p className="text-[11px] text-zinc-400">PIN verification required for permanent erasure</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Target Transaction Card Preview */}
          <div className="p-3.5 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Transaction Record
              </span>
              <span className="text-sm font-bold font-mono text-white tabular-nums">
                {formatIndianCurrency(transaction.amount)}
              </span>
            </div>

            <div className="text-xs text-zinc-300 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Type:</span>
                <span className="font-medium uppercase text-zinc-200 font-mono text-[11px] bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                  {transaction.type.replace('_', ' ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Date:</span>
                <span className="font-mono text-zinc-200">{formatDate(transaction.date)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-500">Account:</span>
                <span className="font-medium text-zinc-200">
                  {account?.name || 'Unknown'} {toAccount ? `→ ${toAccount.name}` : ''}
                </span>
              </div>
              {transaction.tid && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">TID / Ref:</span>
                  <span className="font-mono text-zinc-300">{transaction.tid}</span>
                </div>
              )}
              {transaction.notes && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Notes:</span>
                  <span className="text-zinc-300 truncate max-w-[200px]">{transaction.notes}</span>
                </div>
              )}
            </div>
          </div>

          {/* Hard Delete Warning Notice */}
          <div className="p-3 bg-red-950/30 border border-red-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <p className="leading-relaxed">
              This record will be <strong className="text-white">permanently purged</strong> from local storage and your live Firebase Cloud Firestore. Bank account balances, investment principals, and total My Money will automatically be recalculated.
            </p>
          </div>

          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 font-medium">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Record permanently deleted. Recalculating balances...</span>
            </div>
          )}

          <form onSubmit={handleDelete} className="space-y-4">
            {/* Step 1: Reason Selection */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                1. Reason for Deletion <span className="text-rose-400">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {COMMON_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setSelectedReason(reason)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors cursor-pointer ${
                      selectedReason === reason
                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 font-semibold'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Additional notes / context (optional)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-rose-500 focus:outline-none"
              />
            </div>

            {/* Step 2: 4-Digit Security PIN */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-rose-400" />
                  <span>2. Enter 4-Digit Security PIN</span> <span className="text-rose-400">*</span>
                </label>
                <span className="text-[10px] text-zinc-500 font-mono">Default: 1234</span>
              </div>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                    setPin(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••"
                  autoFocus
                  required
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-rose-500 tracking-[0.5em] text-center rounded-xl py-2.5 text-xl font-bold font-mono text-white placeholder-zinc-700 focus:outline-none transition-colors"
                />
                <Lock className="w-4 h-4 text-zinc-600 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <p className="text-[10px] text-zinc-500 mt-1">
                You can change your Deletion Security PIN anytime in Settings.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isDeleting}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDeleting || pin.length !== 4 || isSuccess}
                className={`px-4 py-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-rose-900/30`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Deleting...' : 'Permanently Delete'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
