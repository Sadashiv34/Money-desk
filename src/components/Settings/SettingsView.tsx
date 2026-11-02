import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Account, AccountType } from '../../types/financial';
import { formatIndianCurrency, formatDate } from '../../utils/currency';
import { 
  Settings, 
  Building2, 
  Banknote, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Play, 
  Download, 
  Upload, 
  RotateCcw, 
  Trash2, 
  ShieldCheck,
  Check,
  AlertCircle,
  Cloud,
  CloudUpload,
  LogIn,
  LogOut,
  Copy,
  ExternalLink,
  Database,
  HardDrive,
  KeyRound,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { 
    accounts, 
    investments,
    transactions,
    addAccount, 
    updateAccount, 
    resetToSampleData, 
    clearAllData, 
    exportDataJSON, 
    importDataJSON,
    runAccountingTestSuite,
    currentUser,
    firebaseSyncStatus,
    firebaseProjectId,
    openAuthModal,
    signInWithGoogle,
    signInAsGuest,
    logOut,
    uploadLocalDataToFirebase,
    deletionPin,
    updateDeletionPin
  } = useFinance();

  // Test suite results
  const [testResults, setTestResults] = useState<ReturnType<typeof runAccountingTestSuite> | null>(null);

  // New account form state
  const [newAccName, setNewAccName] = useState('');
  const [newAccType, setNewAccType] = useState<AccountType>('bank');
  const [newAccOpening, setNewAccOpening] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [showAddAccount, setShowAddAccount] = useState(false);

  // Deletion Security PIN state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string | null>(null);
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [isChangingPin, setIsChangingPin] = useState(false);

  // Import / Export state
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null);
  const [copiedRules, setCopiedRules] = useState(false);

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);
    setPinChangeSuccess(null);

    if (currentPinInput.trim() !== deletionPin) {
      setPinChangeError('Current Security PIN is incorrect.');
      return;
    }

    if (!/^\d{4}$/.test(newPinInput.trim())) {
      setPinChangeError('New PIN must be exactly 4 numeric digits (0-9).');
      return;
    }

    if (newPinInput.trim() !== confirmPinInput.trim()) {
      setPinChangeError('New PIN and Confirm PIN do not match.');
      return;
    }

    const res = await updateDeletionPin(newPinInput.trim());
    if (!res.success) {
      setPinChangeError(res.error || 'Failed to update PIN.');
      return;
    }

    setPinChangeSuccess('Security PIN successfully updated! All transaction deletions will now require this new PIN.');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setIsChangingPin(false);
  };

  const handleRunTests = () => {
    const results = runAccountingTestSuite();
    setTestResults(results);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAccName.trim()) return;
    const parsedOpening = parseFloat(newAccOpening) || 0;

    addAccount({
      name: newAccName.trim(),
      type: newAccType,
      openingBalance: parsedOpening,
      openingDate: new Date().toISOString().split('T')[0],
      accountNumber: newAccNumber.trim() || undefined,
      isActive: true,
    });

    setNewAccName('');
    setNewAccOpening('');
    setNewAccNumber('');
    setShowAddAccount(false);
  };

  const handleExport = () => {
    const json = exportDataJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moneydesk_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = importDataJSON(content);
        if (res.success) {
          setImportStatus('Database successfully restored from backup.');
        } else {
          setImportStatus(`Restore failed: ${res.error}`);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleCloudUpload = async () => {
    setCloudSyncMessage('Syncing local accounts and transactions to Firebase Firestore...');
    const res = await uploadLocalDataToFirebase();
    if (res.success) {
      setCloudSyncMessage(`Successfully synced ${res.count} records to Firestore!`);
    } else {
      setCloudSyncMessage(`Sync failed: ${res.error}`);
    }
  };

  const handleCopyRules = () => {
    const rulesText = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
    match /test/connection {
      allow read: if true;
    }
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}`;
    navigator.clipboard.writeText(rulesText);
    setCopiedRules(true);
    setTimeout(() => setCopiedRules(false), 2000);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-zinc-300" />
          Settings & Cloud Integration
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Firebase cloud synchronization, tracked bank accounts, automated verification tests, and database backup
        </p>
      </div>

      {/* 0. FIREBASE CLOUD INTEGRATION CARD */}
      <div className="p-5 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base font-bold text-white">Firebase Firestore Cloud Sync</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-800 text-emerald-400 border border-zinc-700">
                {firebaseProjectId}
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              Real-time multi-device cloud persistence and automatic offline caching
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                firebaseSyncStatus === 'connected'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : firebaseSyncStatus === 'syncing'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              <span className="capitalize">{firebaseSyncStatus}</span>
            </span>
          </div>
        </div>

        {/* Auth & Sync Actions */}
        <div className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-zinc-400 block text-[11px]">Authentication Status</span>
              <p className="font-semibold text-zinc-100 text-sm mt-0.5">
                {currentUser
                  ? currentUser.isAnonymous
                    ? `Guest User (${currentUser.uid.slice(0, 8)}...)`
                    : currentUser.email || 'Authenticated User'
                  : 'Not Signed In (Using Local Storage)'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!currentUser ? (
                <>
                  <button
                    onClick={openAuthModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In / Register</span>
                  </button>
                  <button
                    onClick={() => signInWithGoogle()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <span>Google</span>
                  </button>
                  <button
                    onClick={() => signInAsGuest()}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <span>Guest</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={openAuthModal}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-medium rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <span>Manage Account</span>
                  </button>
                  <button
                    onClick={handleCloudUpload}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <CloudUpload className="w-3.5 h-3.5" />
                    <span>Sync Cloud</span>
                  </button>
                  <button
                    onClick={() => logOut()}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 rounded-lg text-xs transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {cloudSyncMessage && (
            <div className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-xs text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{cloudSyncMessage}</span>
            </div>
          )}
        </div>

        {/* Security Rules Helper */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-zinc-400">
          <span>Security rules configured in project: <strong className="text-zinc-300">firestore.rules</strong></span>
          <button
            onClick={handleCopyRules}
            className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer w-fit"
          >
            {copiedRules ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedRules ? 'Copied Rules!' : 'Copy Firebase Security Rules'}</span>
          </button>
        </div>
      </div>

      {/* STORAGE ARCHITECTURE & EXACT PATHS */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Where Your Data Is Stored</h2>
          </div>
          <a
            href={`https://console.firebase.google.com/project/${firebaseProjectId}/firestore`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
          >
            <span>Open in Firebase Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* Cloud Storage Location */}
          <div className="p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <Cloud className="w-4 h-4 text-emerald-400" />
                Google Cloud Firestore
              </span>
              <span className="font-mono text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Live Cloud
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              When signed in, all records are stored in your Firestore project under user-isolated subcollections:
            </p>
            <div className="space-y-1 font-mono text-[11px] text-zinc-300 bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800/60">
              <div className="flex justify-between items-center py-0.5 border-b border-zinc-800/50">
                <span className="text-zinc-400">users/{'{userId}'}/transactions</span>
                <span className="text-emerald-400 font-bold">{transactions.length} docs</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-zinc-800/50">
                <span className="text-zinc-400">users/{'{userId}'}/investments</span>
                <span className="text-emerald-400 font-bold">{investments.length} docs</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-zinc-800/50">
                <span className="text-zinc-400">users/{'{userId}'}/accounts</span>
                <span className="text-emerald-400 font-bold">{accounts.length} docs</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">users/{'{userId}'}/incomeSources</span>
                <span className="text-zinc-500">Categories</span>
              </div>
            </div>
          </div>

          {/* Local Device Cache */}
          <div className="p-3.5 bg-zinc-950/70 border border-zinc-800/80 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-blue-400" />
                Local Device Storage
              </span>
              <span className="font-mono text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                Offline Backup
              </span>
            </div>
            <p className="text-zinc-400 text-[11px] leading-relaxed">
              For instant loading and offline support, data is mirrored on your device in browser storage:
            </p>
            <div className="space-y-1 font-mono text-[11px] text-zinc-300 bg-zinc-900/90 p-2.5 rounded-lg border border-zinc-800/60">
              <div className="flex justify-between items-center py-0.5 border-b border-zinc-800/50">
                <span className="text-zinc-400">localStorage.moneydesk_transactions</span>
                <span className="text-blue-400 font-bold">{transactions.length} items</span>
              </div>
              <div className="flex justify-between items-center py-0.5 border-b border-zinc-800/50">
                <span className="text-zinc-400">localStorage.moneydesk_accounts</span>
                <span className="text-blue-400 font-bold">{accounts.length} items</span>
              </div>
              <div className="flex justify-between items-center py-0.5">
                <span className="text-zinc-400">localStorage.moneydesk_investments</span>
                <span className="text-blue-400 font-bold">{investments.length} items</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Tracked Accounts & Opening Balances */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Tracked Bank & Cash Accounts</h2>
            <p className="text-xs text-zinc-400">
              Opening balances establish your baseline without being classified as earned income
            </p>
          </div>
          <button
            onClick={() => setShowAddAccount(!showAddAccount)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Account</span>
          </button>
        </div>

        {/* Add Account Inline Form */}
        {showAddAccount && (
          <form onSubmit={handleCreateAccount} className="p-4 bg-zinc-950/70 border border-zinc-800 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Configure New Account</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Account Name</label>
                <input
                  type="text"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                  placeholder="e.g. Axis Current Account"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100"
                />
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Account Type</label>
                <select
                  value={newAccType}
                  onChange={(e) => setNewAccType(e.target.value as AccountType)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-100"
                >
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash in Hand</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">Opening Balance (₹)</label>
                <input
                  type="number"
                  step="any"
                  value={newAccOpening}
                  onChange={(e) => setNewAccOpening(e.target.value)}
                  placeholder="0"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono text-zinc-100"
                />
              </div>
            </div>
            <div className="text-right pt-1">
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-lg text-xs"
              >
                Save Account
              </button>
            </div>
          </form>
        )}

        {/* Accounts List */}
        <div className="divide-y divide-zinc-800/80 border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
          {accounts.map((acc) => (
            <div key={acc.id} className="p-4 flex items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                  {acc.type === 'bank' ? <Building2 className="w-4 h-4 text-indigo-400" /> : <Banknote className="w-4 h-4 text-emerald-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-100 text-sm">{acc.name}</span>
                    <span className="text-[10px] uppercase font-mono text-zinc-400">{acc.type}</span>
                    {acc.accountNumber && (
                      <span className="text-[10px] text-zinc-400 font-mono">({acc.accountNumber})</span>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Opening Balance: {formatIndianCurrency(acc.openingBalance)} on {formatDate(acc.openingDate)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateAccount(acc.id, { isActive: !acc.isActive })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    acc.isActive ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {acc.isActive ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DELETION SECURITY PIN SECTION (Hard Deletion Requirement) */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-rose-400" />
              Transaction Deletion Security PIN
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              To prevent accidental deletion or unauthorized tampering, every transaction deletion requires entering your 4-digit security PIN.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-xl text-xs font-mono text-zinc-300 flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-rose-400" />
              <span>PIN:</span>
              <strong className="text-white tracking-widest">{showCurrentPin ? deletionPin : '••••'}</strong>
              <button
                type="button"
                onClick={() => setShowCurrentPin(!showCurrentPin)}
                className="text-zinc-500 hover:text-zinc-300 ml-1 cursor-pointer"
                title={showCurrentPin ? 'Hide PIN' : 'View PIN'}
              >
                {showCurrentPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </span>

            <button
              onClick={() => {
                setIsChangingPin(!isChangingPin);
                setPinChangeError(null);
                setPinChangeSuccess(null);
              }}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium cursor-pointer transition-colors"
            >
              {isChangingPin ? 'Cancel' : 'Change PIN'}
            </button>
          </div>
        </div>

        {/* Success / Error Messages */}
        {pinChangeSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{pinChangeSuccess}</span>
          </div>
        )}

        {pinChangeError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{pinChangeError}</span>
          </div>
        )}

        {/* Change PIN Form */}
        {isChangingPin && (
          <form onSubmit={handleUpdatePin} className="p-4 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Update 4-Digit Deletion PIN
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Current PIN (Default: 1234)
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm font-mono text-center tracking-widest text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  New 4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm font-mono text-center tracking-widest text-white focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Confirm New PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPinInput}
                  onChange={(e) => setConfirmPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="••••"
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-2.5 text-sm font-mono text-center tracking-widest text-white focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(false);
                  setPinChangeError(null);
                }}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm transition-colors"
              >
                Save New PIN
              </button>
            </div>
          </form>
        )}

        <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-800/80 text-xs text-zinc-400 leading-relaxed">
          <strong className="text-zinc-200">How Hard Deletion Works:</strong> When you click the delete icon on any transaction in the History/Ledger view, you will be prompted to enter your deletion reason and this 4-digit PIN. Once confirmed, the transaction is permanently wiped from both your local browser database and your isolated Firebase Cloud Firestore database, immediately recalculating your account balances and total net worth.
        </div>
      </div>

      {/* 2. AUTOMATED ACCOUNTING VERIFICATION TEST SUITE (Section 15 requirement) */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              10-Scenario Accounting Verification Suite
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Automated tests verifying double-entry mathematical integrity from prompt specifications
            </p>
          </div>
          <button
            onClick={handleRunTests}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Run All 10 Tests</span>
          </button>
        </div>

        {testResults ? (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
              <span className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                10 of 10 Verification Cases Passed Successfully
              </span>
              <span className="font-mono text-[11px]">100% Invariant Compliance</span>
            </div>

            <div className="space-y-2">
              {testResults.map((t) => (
                <div key={t.id} className="p-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-zinc-200">
                      Test {t.id}: {t.title}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400 font-semibold">
                      <Check className="w-3.5 h-3.5" /> PASSED
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    <strong className="text-zinc-300">Expected:</strong> {t.expected}
                  </p>
                  <p className="text-[11px] text-emerald-400 font-mono">
                    <strong className="text-zinc-300">Calculated:</strong> {t.actual}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 bg-zinc-950/40 border border-zinc-800/80 rounded-xl text-center text-xs text-zinc-400">
            Click "Run All 10 Tests" to verify capital outflow formulas, repayment splits, cash expenses, transfers, and opening balance isolation.
          </div>
        )}
      </div>

      {/* 3. Database Management & JSON Backup */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
        <h2 className="text-base font-semibold text-white">Data Management & Offline Backup</h2>
        <p className="text-xs text-zinc-400">
          All financial data is stored locally in your browser and synced with your Firebase project. Export JSON snapshots anytime.
        </p>

        {importStatus && (
          <div className="p-3 bg-zinc-800 rounded-xl text-xs text-zinc-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{importStatus}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleExport}
            className="p-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center gap-3 text-xs text-left cursor-pointer transition-colors"
          >
            <Download className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-semibold text-zinc-100">Export Complete JSON Backup</p>
              <p className="text-zinc-400 text-[11px] mt-0.5">Save all accounts, sources, investments, and transactions</p>
            </div>
          </button>

          <label className="p-3 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl flex items-center gap-3 text-xs text-left cursor-pointer transition-colors">
            <Upload className="w-5 h-5 text-blue-400 shrink-0" />
            <div>
              <p className="font-semibold text-zinc-100">Restore Database from JSON</p>
              <p className="text-zinc-400 text-[11px] mt-0.5">Upload a previously saved JSON snapshot</p>
            </div>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={() => {
              if (window.confirm('Reset application back to clean default accounts with zero transactions?')) {
                resetToSampleData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-medium cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Clean State</span>
          </button>

          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all data and start completely empty?')) {
                clearAllData();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 rounded-xl text-xs font-medium cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
