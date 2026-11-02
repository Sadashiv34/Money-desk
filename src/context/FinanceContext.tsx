import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from 'react';
import {
  Account,
  ActiveTab,
  DashboardSummary,
  DateRange,
  ExpenseCategory,
  IncomeSource,
  Investment,
  InvestmentMetrics,
  Transaction,
} from '../types/financial';
import {
  INITIAL_ACCOUNTS,
  INITIAL_EXPENSE_CATEGORIES,
  INITIAL_INCOME_SOURCES,
  INITIAL_INVESTMENTS,
  INITIAL_TRANSACTIONS,
} from '../data/sampleData';
import {
  calculateDashboardSummary,
  calculateInvestmentMetrics,
  getDateRangeForPeriod,
  getDisplayMonthYear,
  shiftMonthRange
} from '../utils/calculations';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
  sanitizeForFirestore
} from '../firebase/firebase';
import {
  onAuthStateChanged,
  signInWithPopup,
  signInAnonymously,
  signOut as fbSignOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  User
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  writeBatch,
  getDocs
} from 'firebase/firestore';

interface TestResult {
  id: number;
  title: string;
  expected: string;
  actual: string;
  passed: boolean;
  notes?: string;
}

export type FirebaseSyncStatus = 'connected' | 'syncing' | 'offline' | 'error' | 'unauthenticated';

interface FinanceContextType {
  accounts: Account[];
  incomeSources: IncomeSource[];
  expenseCategories: ExpenseCategory[];
  investments: Investment[];
  transactions: Transaction[];
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  summary: DashboardSummary;
  investmentMetricsList: InvestmentMetrics[];
  
  // Firebase Auth, Isolation & Modals
  currentUser: User | null;
  isAuthLoading: boolean;
  firebaseSyncStatus: FirebaseSyncStatus;
  firebaseProjectId: string;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signInWithGoogle: () => Promise<void>;
  signInAsGuest: () => Promise<void>;
  signUpWithEmailOrPhone: (identifier: string, pass: string, name?: string) => Promise<{ success: boolean; error?: string }>;
  signInWithEmailOrPhone: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (emailOrPhone: string) => Promise<{ success: boolean; error?: string }>;
  logOut: () => Promise<void>;
  uploadLocalDataToFirebase: () => Promise<{ success: boolean; count?: number; error?: string }>;

  // Month navigation
  shiftMonth: (offset: number) => void;
  currentMonthLabel: string;

  // Quick Entry Modal State
  isQuickEntryOpen: boolean;
  quickEntryType: 'income' | 'expense' | 'investment' | 'investment_return' | 'transfer' | 'borrowed' | 'borrowed_repayment' | null;
  openQuickEntry: (type?: 'income' | 'expense' | 'investment' | 'investment_return' | 'transfer' | 'borrowed' | 'borrowed_repayment') => void;
  closeQuickEntry: () => void;

  // Security & Hard Deletion PIN
  deletionPin: string;
  updateDeletionPin: (newPin: string) => Promise<{ success: boolean; error?: string }>;
  deleteTransactionPermanently: (id: string, reason: string, pin: string) => Promise<{ success: boolean; error?: string }>;

  // Selected Investment Detail Modal
  selectedInvestmentId: string | null;
  setSelectedInvestmentId: (id: string | null) => void;

  // CRUD Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => { success: boolean; error?: string; txId?: string };
  updateTransaction: (id: string, updates: Partial<Transaction>) => { success: boolean; error?: string };
  deleteTransaction: (id: string) => { success: boolean };
  
  addInvestment: (inv: Omit<Investment, 'id'>, autoCreateContributionTx?: boolean) => { success: boolean; error?: string; investmentId?: string };
  updateInvestment: (id: string, updates: Partial<Investment>) => { success: boolean };
  
  addIncomeSource: (src: Omit<IncomeSource, 'id'>) => IncomeSource;
  updateIncomeSource: (id: string, updates: Partial<IncomeSource>) => void;
  
  addExpenseCategory: (cat: Omit<ExpenseCategory, 'id'>) => ExpenseCategory;
  updateExpenseCategory: (id: string, updates: Partial<ExpenseCategory>) => void;
  
  addAccount: (acc: Omit<Account, 'id'>) => Account;
  updateAccount: (id: string, updates: Partial<Account>) => void;

  // System actions
  resetToSampleData: () => void;
  clearAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonString: string) => { success: boolean; error?: string };
  runAccountingTestSuite: () => TestResult[];
}

const STORAGE_KEYS = {
  ACCOUNTS: 'moneydesk_accounts_v2',
  SOURCES: 'moneydesk_sources_v2',
  CATEGORIES: 'moneydesk_categories_v2',
  INVESTMENTS: 'moneydesk_investments_v2',
  TRANSACTIONS: 'moneydesk_transactions_v2',
  HAS_INITIALIZED: 'moneydesk_initialized_v2',
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Navigation & Date
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [dateRange, setDateRange] = useState<DateRange>(getDateRangeForPeriod('this_month'));

  // Quick Action Modal
  const [isQuickEntryOpen, setIsQuickEntryOpen] = useState(false);
  const [quickEntryType, setQuickEntryType] = useState<'income' | 'expense' | 'investment' | 'investment_return' | 'transfer' | 'borrowed' | 'borrowed_repayment' | null>(null);

  // Hard Deletion Security PIN (Default: 1234)
  const [deletionPin, setDeletionPin] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('moneydesk_deletion_pin');
      return saved && /^\d{4}$/.test(saved) ? saved : '1234';
    } catch {
      return '1234';
    }
  });

  // Selected Investment
  const [selectedInvestmentId, setSelectedInvestmentId] = useState<string | null>(null);

  // Auth & Modals State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [firebaseSyncStatus, setFirebaseSyncStatus] = useState<FirebaseSyncStatus>('unauthenticated');
  const firebaseProjectId = 'crucial-haiku-478107-s0';
  const didExplicitlySignOut = useRef(false);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Helper: Deduplicate items by ID
  function dedupeById<T extends { id: string }>(items: T[]): T[] {
    const map = new Map<string, T>();
    for (const item of items) {
      if (item && item.id) {
        map.set(item.id, item);
      }
    }
    return Array.from(map.values());
  }

  // Helper: Normalize Phone or Email identifier
  function normalizeAuthIdentifier(identifier: string): { email: string; isPhone: boolean; phoneRaw?: string } {
    const cleaned = identifier.trim().replace(/\s+/g, '');
    if (cleaned.includes('@')) {
      return { email: cleaned.toLowerCase(), isPhone: false };
    }
    const digits = cleaned.replace(/[^0-9]/g, '');
    if (digits.length >= 7) {
      return {
        email: `phone_${digits}@moneydesk.app`,
        isPhone: true,
        phoneRaw: cleaned
      };
    }
    return { email: cleaned.toLowerCase(), isPhone: false };
  }

  // Month navigation helpers
  const shiftMonth = (offset: number) => {
    setDateRange((prev) => shiftMonthRange(prev, offset));
  };

  const currentMonthLabel = useMemo(() => {
    return getDisplayMonthYear(dateRange);
  }, [dateRange]);

  // Core Data States
  const [accounts, setAccounts] = useState<Account[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      return saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  });

  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOURCES);
      return saved ? JSON.parse(saved) : INITIAL_INCOME_SOURCES;
    } catch {
      return INITIAL_INCOME_SOURCES;
    }
  });

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      return saved ? JSON.parse(saved) : INITIAL_EXPENSE_CATEGORIES;
    } catch {
      return INITIAL_EXPENSE_CATEGORIES;
    }
  });

  const [investments, setInvestments] = useState<Investment[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.INVESTMENTS);
      return saved ? JSON.parse(saved) : INITIAL_INVESTMENTS;
    } catch {
      return INITIAL_INVESTMENTS;
    }
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  });

  // Local Storage backup (isolated by user UID if available)
  useEffect(() => {
    try {
      const prefix = currentUser ? `moneydesk_${currentUser.uid}_` : 'moneydesk_';
      localStorage.setItem(`${prefix}accounts`, JSON.stringify(accounts));
      localStorage.setItem(`${prefix}sources`, JSON.stringify(incomeSources));
      localStorage.setItem(`${prefix}categories`, JSON.stringify(expenseCategories));
      localStorage.setItem(`${prefix}investments`, JSON.stringify(investments));
      localStorage.setItem(`${prefix}transactions`, JSON.stringify(transactions));
    } catch (e) {
      console.warn('Failed to persist to localStorage', e);
    }
  }, [accounts, incomeSources, expenseCategories, investments, transactions, currentUser]);

  // Test Firestore connection on boot
  useEffect(() => {
    testConnection().then((connected) => {
      if (connected && currentUser) {
        setFirebaseSyncStatus('connected');
      }
    });
  }, [currentUser]);

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      if (user) {
        didExplicitlySignOut.current = false;
        setFirebaseSyncStatus('connected');
      } else {
        setFirebaseSyncStatus('unauthenticated');
        // Clear in-memory records on sign out for complete account isolation
        if (didExplicitlySignOut.current) {
          setAccounts([]);
          setInvestments([]);
          setTransactions([]);
        } else {
          // Seamless initial guest sign-in for zero-friction trial
          signInAnonymously(auth).catch(() => {});
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Sync with Account Isolation (/users/{uid}/*)
  useEffect(() => {
    if (!currentUser) return;
    const uid = currentUser.uid;
    setFirebaseSyncStatus('syncing');

    // 1. Isolated Accounts
    const unsubAccounts = onSnapshot(
      collection(db, 'users', uid, 'accounts'),
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudAccounts = dedupeById(snapshot.docs.map((d) => d.data() as Account));
          setAccounts(cloudAccounts);
        } else {
          // New isolated user account: baseline opening balances start at 0!
          const userInitialAccounts: Account[] = [
            {
              id: `acc-bank-${uid.slice(0, 6)}`,
              name: 'Primary Bank Account',
              type: 'bank',
              openingBalance: 0,
              openingDate: new Date().toISOString().split('T')[0],
              isActive: true,
              accountNumber: 'Primary'
            },
            {
              id: `acc-cash-${uid.slice(0, 6)}`,
              name: 'Cash in Hand',
              type: 'cash',
              openingBalance: 0,
              openingDate: new Date().toISOString().split('T')[0],
              isActive: true
            }
          ];
          userInitialAccounts.forEach((acc) => {
            setDoc(doc(db, 'users', uid, 'accounts', acc.id), { ...acc, userId: uid, updatedAt: new Date().toISOString() }).catch(() => {});
          });
          setAccounts(userInitialAccounts);
        }
        setFirebaseSyncStatus('connected');
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/accounts`);
        setFirebaseSyncStatus('offline');
      }
    );

    // 2. Isolated Income Sources
    const unsubSources = onSnapshot(
      collection(db, 'users', uid, 'incomeSources'),
      (snapshot) => {
        if (!snapshot.empty) {
          setIncomeSources(dedupeById(snapshot.docs.map((d) => d.data() as IncomeSource)));
        } else {
          INITIAL_INCOME_SOURCES.forEach((s) => {
            setDoc(doc(db, 'users', uid, 'incomeSources', s.id), { ...s, userId: uid, updatedAt: new Date().toISOString() }).catch(() => {});
          });
          setIncomeSources(INITIAL_INCOME_SOURCES);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/incomeSources`);
      }
    );

    // 3. Isolated Expense Categories
    const unsubCategories = onSnapshot(
      collection(db, 'users', uid, 'expenseCategories'),
      (snapshot) => {
        if (!snapshot.empty) {
          setExpenseCategories(dedupeById(snapshot.docs.map((d) => d.data() as ExpenseCategory)));
        } else {
          INITIAL_EXPENSE_CATEGORIES.forEach((c) => {
            setDoc(doc(db, 'users', uid, 'expenseCategories', c.id), { ...c, userId: uid, updatedAt: new Date().toISOString() }).catch(() => {});
          });
          setExpenseCategories(INITIAL_EXPENSE_CATEGORIES);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/expenseCategories`);
      }
    );

    // 4. Isolated Investments
    const unsubInvestments = onSnapshot(
      collection(db, 'users', uid, 'investments'),
      (snapshot) => {
        const cloudInvestments = dedupeById(snapshot.docs.map((d) => d.data() as Investment));
        setInvestments(cloudInvestments);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/investments`);
      }
    );

    // 5. Isolated Transactions
    const unsubTransactions = onSnapshot(
      collection(db, 'users', uid, 'transactions'),
      (snapshot) => {
        const cloudTxs = dedupeById(snapshot.docs.map((d) => d.data() as Transaction));
        cloudTxs.sort((a, b) => (b.date + (b.createdAt || '')).localeCompare(a.date + (a.createdAt || '')));
        setTransactions(cloudTxs);
        setFirebaseSyncStatus('connected');
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/transactions`);
      }
    );

    // 6. Isolated Security PIN
    const unsubPin = onSnapshot(
      doc(db, 'users', uid, 'settings', 'security'),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.deletionPin && /^\d{4}$/.test(data.deletionPin)) {
            setDeletionPin(data.deletionPin);
            try {
              localStorage.setItem(`moneydesk_pin_${uid}`, data.deletionPin);
              localStorage.setItem('moneydesk_deletion_pin', data.deletionPin);
            } catch {}
          }
        }
      },
      () => {}
    );

    return () => {
      unsubAccounts();
      unsubSources();
      unsubCategories();
      unsubInvestments();
      unsubTransactions();
      unsubPin();
    };
  }, [currentUser]);

  // Helper: Format Firebase Auth errors into clear, friendly guidance
  function formatAuthError(err: unknown): string {
    if (err instanceof Error) {
      const msg = err.message;
      if (msg.includes('auth/email-already-in-use')) {
        return 'This email or phone number is already registered. Please sign in instead.';
      }
      if (msg.includes('auth/invalid-email')) {
        return 'Please enter a valid email address (e.g. user@example.com) or 10-digit phone number.';
      }
      if (msg.includes('auth/weak-password')) {
        return 'Password must be at least 6 characters long.';
      }
      if (
        msg.includes('auth/user-not-found') ||
        msg.includes('auth/wrong-password') ||
        msg.includes('auth/invalid-credential')
      ) {
        return 'Incorrect credentials. Please verify your phone/email and password.';
      }
      if (msg.includes('auth/too-many-requests')) {
        return 'Too many attempts. Please wait a moment and try again.';
      }
      return msg.replace(/^Firebase:\s*/, '').replace(/\(auth\/[^)]+\)\.?/, '').trim();
    }
    return String(err);
  }

  // Auth Actions: Email / Phone Sign-Up, Sign-In, Forgot Password, Google
  const signUpWithEmailOrPhone = async (identifier: string, pass: string, name?: string) => {
    try {
      const { email } = normalizeAuthIdentifier(identifier);
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && cred.user) {
        await updateProfile(cred.user, { displayName: name });
      }
      return { success: true };
    } catch (err) {
      console.error('Sign-up error:', err);
      return { 
        success: false, 
        error: formatAuthError(err)
      };
    }
  };

  const signInWithEmailOrPhone = async (identifier: string, pass: string) => {
    try {
      const { email } = normalizeAuthIdentifier(identifier);
      await signInWithEmailAndPassword(auth, email, pass);
      return { success: true };
    } catch (err) {
      console.error('Sign-in error:', err);
      return { 
        success: false, 
        error: formatAuthError(err)
      };
    }
  };

  const resetPassword = async (emailOrPhone: string) => {
    try {
      const { email, isPhone } = normalizeAuthIdentifier(emailOrPhone);
      if (isPhone) {
        return { 
          success: false, 
          error: 'Please enter the email address linked to your account to receive a reset link.' 
        };
      }
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err) {
      console.error('Password reset error:', err);
      return { 
        success: false, 
        error: formatAuthError(err)
      };
    }
  };

  const signInWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Google Sign-in error:', error);
      throw error;
    }
  };

  const signInAsGuest = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Guest Sign-in error:', error);
      throw error;
    }
  };

  const logOut = async () => {
    try {
      didExplicitlySignOut.current = true;
      await fbSignOut(auth);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  // Upload Local Data to Firebase Cloud
  const uploadLocalDataToFirebase = async () => {
    if (!currentUser) {
      return { success: false, error: 'Please sign in or continue as guest to sync.' };
    }
    const uid = currentUser.uid;
    setFirebaseSyncStatus('syncing');

    try {
      const batch = writeBatch(db);
      let count = 0;

      // User Isolated Accounts
      for (const acc of accounts) {
        batch.set(
          doc(db, 'users', uid, 'accounts', acc.id),
          sanitizeForFirestore({ ...acc, userId: uid, updatedAt: new Date().toISOString() })
        );
        count++;
      }

      // User Isolated Sources
      for (const src of incomeSources) {
        batch.set(
          doc(db, 'users', uid, 'incomeSources', src.id),
          sanitizeForFirestore({ ...src, userId: uid, updatedAt: new Date().toISOString() })
        );
        count++;
      }

      // User Isolated Categories
      for (const cat of expenseCategories) {
        batch.set(
          doc(db, 'users', uid, 'expenseCategories', cat.id),
          sanitizeForFirestore({ ...cat, userId: uid, updatedAt: new Date().toISOString() })
        );
        count++;
      }

      // User Isolated Investments
      for (const inv of investments) {
        batch.set(
          doc(db, 'users', uid, 'investments', inv.id),
          sanitizeForFirestore({ ...inv, userId: uid, updatedAt: new Date().toISOString() })
        );
        count++;
      }

      // User Isolated Transactions
      for (const tx of transactions) {
        batch.set(
          doc(db, 'users', uid, 'transactions', tx.id),
          sanitizeForFirestore({ ...tx, userId: uid, updatedAt: new Date().toISOString() })
        );
        count++;
      }

      await batch.commit();
      setFirebaseSyncStatus('connected');
      return { success: true, count };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${uid}`);
      setFirebaseSyncStatus('error');
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  };

  // Handle URL shortcut (?action=quick-add)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('action') === 'quick-add') {
      setIsQuickEntryOpen(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Compute Live Summaries
  const summary = useMemo(() => {
    return calculateDashboardSummary(accounts, investments, transactions, dateRange);
  }, [accounts, investments, transactions, dateRange]);

  const investmentMetricsList = useMemo(() => {
    return investments.map((inv) => calculateInvestmentMetrics(inv, transactions));
  }, [investments, transactions]);

  // Modal handlers
  const openQuickEntry = (type?: 'income' | 'expense' | 'investment' | 'investment_return' | 'transfer' | 'borrowed' | 'borrowed_repayment') => {
    setQuickEntryType(type || null);
    setIsQuickEntryOpen(true);
  };

  const closeQuickEntry = () => {
    setIsQuickEntryOpen(false);
    setQuickEntryType(null);
  };

  // Transaction CRUD
  const addTransaction = (
    txDataInput: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ): { success: boolean; error?: string; txId?: string } => {
    let txData = { ...txDataInput };
    if (!txData.amount || txData.amount <= 0) {
      return { success: false, error: 'Transaction amount must be greater than zero.' };
    }

    let account = accounts.find((a) => a.id === txData.accountId);
    if (!account && accounts.length > 0) {
      account = accounts[0];
      txData.accountId = account.id;
    }
    if (!account) {
      const fallbackAcc: Account = {
        id: `acc-main-${Date.now().toString(36)}`,
        name: 'Primary Bank Account',
        type: 'bank',
        openingBalance: 0,
        openingDate: new Date().toISOString().split('T')[0],
        isActive: true,
      };
      setAccounts((prev) => [fallbackAcc, ...prev]);
      account = fallbackAcc;
      txData.accountId = fallbackAcc.id;
    }

    if (txData.type === 'income' && !txData.sourceId && incomeSources.length > 0) {
      txData.sourceId = incomeSources[0].id;
    }

    if (txData.type === 'expense' && !txData.categoryId && expenseCategories.length > 0) {
      txData.categoryId = expenseCategories[0].id;
    }

    if (txData.type === 'borrowed_inflow') {
      if (!txData.lenderName || !txData.lenderName.trim()) {
        return { success: false, error: 'Please enter the name of the person/lender borrowed from.' };
      }
      txData.lenderName = txData.lenderName.trim();
    }

    if (txData.type === 'borrowed_repayment') {
      if (!txData.lenderName || !txData.lenderName.trim()) {
        return { success: false, error: 'Please select the person you are returning borrowed money to.' };
      }
      txData.lenderName = txData.lenderName.trim();
    }

    if (txData.type === 'investment_return') {
      if (!txData.investmentId) {
        if (investments.length > 0) {
          txData.investmentId = investments[0].id;
        } else {
          return { success: false, error: 'Please select the associated investment.' };
        }
      }
      const inv = investments.find((i) => i.id === txData.investmentId);
      if (!inv) {
        return { success: false, error: 'Target investment not found.' };
      }

      const metrics = calculateInvestmentMetrics(inv, transactions);
      const principalReturned = txData.principalReturned || 0;
      const profitReceived = txData.interestOrProfitReceived || 0;

      if (Math.round((principalReturned + profitReceived) * 100) !== Math.round(txData.amount * 100)) {
        return {
          success: false,
          error: `Principal returned (₹${principalReturned}) + Profit/Interest (₹${profitReceived}) must equal total amount received (₹${txData.amount}).`,
        };
      }

      if (principalReturned > metrics.outstandingPrincipal) {
        return {
          success: false,
          error: `Principal repayment of ₹${principalReturned} exceeds remaining outstanding principal of ₹${metrics.outstandingPrincipal}.`,
        };
      }
    }

    if (txData.type === 'transfer_internal') {
      if (!txData.toAccountId) {
        const otherAcc = accounts.find((a) => a.id !== txData.accountId);
        if (otherAcc) {
          txData.toAccountId = otherAcc.id;
        } else {
          return { success: false, error: 'Please select a destination account for the internal transfer.' };
        }
      }
      if (txData.accountId === txData.toAccountId) {
        return { success: false, error: 'Source and destination accounts cannot be identical.' };
      }
    }

    const now = new Date().toISOString();
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Direct Cloud Write to root transactions collection (sanitized of any undefined properties)
    const rootPayload = sanitizeForFirestore({
      ...newTx,
      userId: currentUser ? currentUser.uid : 'guest'
    });
    setDoc(doc(db, 'transactions', newTx.id), rootPayload)
      .catch((err) => handleFirestoreError(err, OperationType.CREATE, `transactions/${newTx.id}`));

    if (currentUser) {
      const uid = currentUser.uid;
      const path = `users/${uid}/transactions/${newTx.id}`;
      const userPayload = sanitizeForFirestore({
        ...newTx,
        userId: uid
      });
      setDoc(doc(db, 'users', uid, 'transactions', newTx.id), userPayload)
        .catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
    }

    return { success: true, txId: newTx.id };
  };

  const updateTransaction = (
    id: string,
    updates: Partial<Transaction>
  ): { success: boolean; error?: string } => {
    const existing = transactions.find((t) => t.id === id);
    if (!existing) return { success: false, error: 'Transaction not found.' };

    const merged = { ...existing, ...updates };

    if (merged.type === 'investment_return') {
      const inv = investments.find((i) => i.id === merged.investmentId);
      if (inv) {
        const otherTxs = transactions.filter((t) => t.id !== id);
        const metrics = calculateInvestmentMetrics(inv, otherTxs);
        const pReturned = merged.principalReturned || 0;
        const profit = merged.interestOrProfitReceived || 0;

        if (Math.round((pReturned + profit) * 100) !== Math.round(merged.amount * 100)) {
          return {
            success: false,
            error: `Principal returned (₹${pReturned}) + Profit/Interest (₹${profit}) must equal total amount received (₹${merged.amount}).`,
          };
        }

        if (pReturned > metrics.outstandingPrincipal) {
          return {
            success: false,
            error: `Principal repayment of ₹${pReturned} exceeds outstanding principal of ₹${metrics.outstandingPrincipal}.`,
          };
        }
      }
    }

    const updatedWithTimestamp: Transaction = {
      ...merged,
      updatedAt: new Date().toISOString(),
    };

    setTransactions((prev) => prev.map((t) => (t.id === id ? updatedWithTimestamp : t)));

    // Direct Cloud update to root transactions collection
    const cloudUpdateRoot = sanitizeForFirestore(updatedWithTimestamp);
    setDoc(doc(db, 'transactions', id), cloudUpdateRoot, { merge: true })
      .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `transactions/${id}`));

    if (currentUser) {
      const uid = currentUser.uid;
      const path = `users/${uid}/transactions/${id}`;
      const cloudUpdateUser = sanitizeForFirestore({
        ...updatedWithTimestamp,
        userId: uid
      });
      setDoc(doc(db, 'users', uid, 'transactions', id), cloudUpdateUser, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.UPDATE, path));
    }

    return { success: true };
  };

  const updateDeletionPin = async (newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!/^\d{4}$/.test(newPin)) {
      return { success: false, error: 'Security PIN must be exactly 4 digits (0-9).' };
    }
    setDeletionPin(newPin);
    try {
      localStorage.setItem('moneydesk_deletion_pin', newPin);
      if (currentUser) {
        localStorage.setItem(`moneydesk_pin_${currentUser.uid}`, newPin);
        await setDoc(
          doc(db, 'users', currentUser.uid, 'settings', 'security'),
          {
            deletionPin: newPin,
            updatedAt: new Date().toISOString(),
            userId: currentUser.uid,
          },
          { merge: true }
        );
      }
      return { success: true };
    } catch (err: any) {
      console.warn('Failed to update deletion PIN in cloud:', err);
      return { success: true };
    }
  };

  const deleteTransactionPermanently = async (
    id: string,
    reason: string,
    pin: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (pin.trim() !== deletionPin) {
      return { success: false, error: 'Incorrect 4-digit Security PIN! Deletion aborted.' };
    }
    if (!reason || !reason.trim()) {
      return { success: false, error: 'Please specify or select the reason for deleting this record.' };
    }

    const txToDelete = transactions.find((t) => t.id === id);
    if (!txToDelete) {
      return { success: false, error: 'Transaction not found or already deleted.' };
    }

    // 1. Instantly remove from React state (reactive recalculation of balances & My Money)
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // 2. Remove permanently from local storage
    try {
      const prefix = currentUser ? `moneydesk_${currentUser.uid}_` : 'moneydesk_guest_';
      const updatedList = transactions.filter((t) => t.id !== id);
      localStorage.setItem(`${prefix}transactions`, JSON.stringify(updatedList));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedList));
    } catch (e) {
      console.warn('LocalStorage deletion sync error:', e);
    }

    // 3. Permanent delete from Firebase Firestore
    try {
      // Direct Cloud delete from root transactions collection
      deleteDoc(doc(db, 'transactions', id)).catch((err) =>
        handleFirestoreError(err, OperationType.DELETE, `transactions/${id}`)
      );

      if (currentUser) {
        const uid = currentUser.uid;
        const path = `users/${uid}/transactions/${id}`;
        deleteDoc(doc(db, 'users', uid, 'transactions', id)).catch((err) =>
          handleFirestoreError(err, OperationType.DELETE, path)
        );

        // Record permanent deletion in audit log
        setDoc(doc(db, 'users', uid, 'deletion_audit_log', `${id}_${Date.now()}`), {
          transactionId: id,
          amount: txToDelete.amount,
          type: txToDelete.type,
          date: txToDelete.date,
          accountId: txToDelete.accountId,
          reason: reason.trim(),
          deletedAt: new Date().toISOString(),
          userId: uid,
        }).catch(() => {});
      }
    } catch (cloudErr) {
      console.error('Firestore delete error:', cloudErr);
    }

    return { success: true };
  };

  const deleteTransaction = (id: string): { success: boolean } => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // Direct Cloud delete from root transactions collection
    deleteDoc(doc(db, 'transactions', id))
      .catch((err) => handleFirestoreError(err, OperationType.DELETE, `transactions/${id}`));

    if (currentUser) {
      const uid = currentUser.uid;
      const path = `users/${uid}/transactions/${id}`;
      deleteDoc(doc(db, 'users', uid, 'transactions', id))
        .catch((err) => handleFirestoreError(err, OperationType.DELETE, path));
    }

    return { success: true };
  };

  // Investment CRUD
  const addInvestment = (
    invData: Omit<Investment, 'id'>,
    autoCreateContributionTx = true
  ): { success: boolean; error?: string; investmentId?: string } => {
    if (!invData.name || !invData.name.trim()) {
      return { success: false, error: 'Investment name is required.' };
    }
    if (!invData.initialPrincipal || invData.initialPrincipal <= 0) {
      return { success: false, error: 'Initial investment principal must be greater than zero.' };
    }

    const newInvId = `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newInvestment: Investment = {
      ...invData,
      id: newInvId,
      status: 'active',
    };

    setInvestments((prev) => [newInvestment, ...prev]);

    // Direct Cloud Write to root investments collection
    setDoc(
      doc(db, 'investments', newInvId),
      sanitizeForFirestore({
        ...newInvestment,
        userId: currentUser ? currentUser.uid : 'guest'
      })
    ).catch((err) => handleFirestoreError(err, OperationType.CREATE, `investments/${newInvId}`));

    if (currentUser) {
      const uid = currentUser.uid;
      const path = `users/${uid}/investments/${newInvId}`;
      setDoc(
        doc(db, 'users', uid, 'investments', newInvId),
        sanitizeForFirestore({
          ...newInvestment,
          userId: uid
        })
      ).catch((err) => handleFirestoreError(err, OperationType.CREATE, path));
    }

    // Automatically create the initial capital outflow transaction
    if (autoCreateContributionTx && invData.fundingAccountId) {
      const now = new Date().toISOString();
      const contributionTx: Transaction = {
        id: `tx-inv-${Date.now()}`,
        date: invData.date || new Date().toISOString().split('T')[0],
        type: 'investment_contribution',
        amount: invData.initialPrincipal,
        accountId: invData.fundingAccountId,
        investmentId: newInvId,
        associatedBusiness: invData.associatedEntity,
        notes: `Initial capital invested in ${invData.name}`,
        createdAt: now,
        updatedAt: now,
      };
      setTransactions((prev) => [contributionTx, ...prev]);

      // Direct write to root transactions
      setDoc(
        doc(db, 'transactions', contributionTx.id),
        sanitizeForFirestore({
          ...contributionTx,
          userId: currentUser ? currentUser.uid : 'guest'
        })
      ).catch((err) => handleFirestoreError(err, OperationType.CREATE, `transactions/${contributionTx.id}`));

      if (currentUser) {
        const uid = currentUser.uid;
        setDoc(
          doc(db, 'users', uid, 'transactions', contributionTx.id),
          sanitizeForFirestore({
            ...contributionTx,
            userId: uid
          })
        ).catch((err) => handleFirestoreError(err, OperationType.CREATE, `users/${uid}/transactions/${contributionTx.id}`));
      }
    }

    return { success: true, investmentId: newInvId };
  };

  const updateInvestment = (id: string, updates: Partial<Investment>): { success: boolean } => {
    setInvestments((prev) => prev.map((inv) => (inv.id === id ? { ...inv, ...updates } : inv)));

    // Direct update to root investments
    setDoc(doc(db, 'investments', id), sanitizeForFirestore(updates), { merge: true })
      .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `investments/${id}`));

    if (currentUser) {
      const uid = currentUser.uid;
      setDoc(
        doc(db, 'users', uid, 'investments', id),
        sanitizeForFirestore({
          ...updates,
          userId: uid
        }),
        { merge: true }
      ).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/investments/${id}`));
    }

    return { success: true };
  };

  // Income Sources
  const addIncomeSource = (srcData: Omit<IncomeSource, 'id'>): IncomeSource => {
    const newSrc: IncomeSource = {
      ...srcData,
      id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isActive: true,
    };
    setIncomeSources((prev) => [...prev, newSrc]);

    // Direct write to root incomeSources
    setDoc(
      doc(db, 'incomeSources', newSrc.id),
      sanitizeForFirestore({
        ...newSrc,
        userId: currentUser ? currentUser.uid : 'guest'
      })
    ).catch((err) => handleFirestoreError(err, OperationType.CREATE, `incomeSources/${newSrc.id}`));

    if (currentUser) {
      const uid = currentUser.uid;
      setDoc(
        doc(db, 'users', uid, 'incomeSources', newSrc.id),
        sanitizeForFirestore({
          ...newSrc,
          userId: uid
        })
      ).catch((err) => handleFirestoreError(err, OperationType.CREATE, `users/${uid}/incomeSources/${newSrc.id}`));
    }

    return newSrc;
  };

  const updateIncomeSource = (id: string, updates: Partial<IncomeSource>) => {
    setIncomeSources((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));

    // Direct update to root incomeSources
    setDoc(doc(db, 'incomeSources', id), sanitizeForFirestore(updates), { merge: true })
      .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `incomeSources/${id}`));

    if (currentUser) {
      const uid = currentUser.uid;
      setDoc(
        doc(db, 'users', uid, 'incomeSources', id),
        sanitizeForFirestore({
          ...updates,
          userId: uid
        }),
        { merge: true }
      ).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/incomeSources/${id}`));
    }
  };

  // Expense Categories
  const addExpenseCategory = (catData: Omit<ExpenseCategory, 'id'>): ExpenseCategory => {
    const newCat: ExpenseCategory = {
      ...catData,
      id: `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isActive: true,
    };
    setExpenseCategories((prev) => [...prev, newCat]);

    // Direct write to root expenseCategories
    setDoc(
      doc(db, 'expenseCategories', newCat.id),
      sanitizeForFirestore({
        ...newCat,
        userId: currentUser ? currentUser.uid : 'guest'
      })
    ).catch((err) => handleFirestoreError(err, OperationType.CREATE, `expenseCategories/${newCat.id}`));

    if (currentUser) {
      const uid = currentUser.uid;
      setDoc(
        doc(db, 'users', uid, 'expenseCategories', newCat.id),
        sanitizeForFirestore({
          ...newCat,
          userId: uid
        })
      ).catch((err) => handleFirestoreError(err, OperationType.CREATE, `users/${uid}/expenseCategories/${newCat.id}`));
    }

    return newCat;
  };

  const updateExpenseCategory = (id: string, updates: Partial<ExpenseCategory>) => {
    setExpenseCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));

    // Direct update to root expenseCategories
    setDoc(doc(db, 'expenseCategories', id), sanitizeForFirestore(updates), { merge: true })
      .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `expenseCategories/${id}`));

    if (currentUser) {
      const uid = currentUser.uid;
      setDoc(
        doc(db, 'users', uid, 'expenseCategories', id),
        sanitizeForFirestore({
          ...updates,
          userId: uid
        }),
        { merge: true }
      ).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/expenseCategories/${id}`));
    }
  };

  // Accounts
  const addAccount = (accData: Omit<Account, 'id'>): Account => {
    const newAcc: Account = {
      ...accData,
      id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isActive: true,
    };
    setAccounts((prev) => [...prev, newAcc]);

    // Direct write to root accounts
    setDoc(
      doc(db, 'accounts', newAcc.id),
      sanitizeForFirestore({
        ...newAcc,
        userId: currentUser ? currentUser.uid : 'guest'
      })
    ).catch((err) => handleFirestoreError(err, OperationType.CREATE, `accounts/${newAcc.id}`));

    if (currentUser) {
      const uid = currentUser.uid;
      setDoc(
        doc(db, 'users', uid, 'accounts', newAcc.id),
        sanitizeForFirestore({
          ...newAcc,
          userId: uid
        })
      ).catch((err) => handleFirestoreError(err, OperationType.CREATE, `users/${uid}/accounts/${newAcc.id}`));
    }

    return newAcc;
  };

  const updateAccount = (id: string, updates: Partial<Account>) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, ...updates } : a)));

    // Direct update to root accounts
    setDoc(doc(db, 'accounts', id), sanitizeForFirestore(updates), { merge: true })
      .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `accounts/${id}`));

    if (currentUser) {
      const uid = currentUser.uid;
      setDoc(
        doc(db, 'users', uid, 'accounts', id),
        sanitizeForFirestore({
          ...updates,
          userId: uid
        }),
        { merge: true }
      ).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `users/${uid}/accounts/${id}`));
    }
  };

  // Reset & Clear
  const resetToSampleData = () => {
    setAccounts(INITIAL_ACCOUNTS);
    setIncomeSources(INITIAL_INCOME_SOURCES);
    setExpenseCategories(INITIAL_EXPENSE_CATEGORIES);
    setInvestments(INITIAL_INVESTMENTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setDateRange(getDateRangeForPeriod('this_month'));
  };

  const clearAllData = () => {
    const freshAccounts: Account[] = [
      { id: 'acc-main-bank', name: 'Main Business Bank', type: 'bank', openingBalance: 0, openingDate: new Date().toISOString().split('T')[0], isActive: true },
      { id: 'acc-main-cash', name: 'Cash in Hand', type: 'cash', openingBalance: 0, openingDate: new Date().toISOString().split('T')[0], isActive: true },
    ];
    setAccounts(freshAccounts);
    setInvestments([]);
    setTransactions([]);
  };

  // Export / Import
  const exportDataJSON = (): string => {
    const payload = {
      version: 2,
      exportedAt: new Date().toISOString(),
      firebaseProjectId,
      accounts,
      incomeSources,
      expenseCategories,
      investments,
      transactions,
    };
    return JSON.stringify(payload, null, 2);
  };

  const importDataJSON = (jsonString: string): { success: boolean; error?: string } => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.accounts || !Array.isArray(data.accounts)) {
        return { success: false, error: 'Invalid JSON format: missing accounts array.' };
      }
      setAccounts(data.accounts);
      if (Array.isArray(data.incomeSources)) setIncomeSources(data.incomeSources);
      if (Array.isArray(data.expenseCategories)) setExpenseCategories(data.expenseCategories);
      if (Array.isArray(data.investments)) setInvestments(data.investments);
      if (Array.isArray(data.transactions)) setTransactions(data.transactions);
      return { success: true };
    } catch {
      return { success: false, error: 'Could not parse JSON. Please verify file integrity.' };
    }
  };

  // Automated 10-Case Accounting Verification Test Suite (from Prompt Section 15)
  const runAccountingTestSuite = (): TestResult[] => {
    const results: TestResult[] = [];

    const testAccount: Account = { id: 'test-bank', name: 'Test Bank', type: 'bank', openingBalance: 100000, openingDate: '2026-01-01', isActive: true };
    const testCash: Account = { id: 'test-cash', name: 'Test Cash', type: 'cash', openingBalance: 2000, openingDate: '2026-01-01', isActive: true };
    const testBank2: Account = { id: 'test-bank-2', name: 'Test Bank 2', type: 'bank', openingBalance: 0, openingDate: '2026-01-01', isActive: true };

    // Test 1: New investment
    {
      const inv: Investment = { id: 'test-inv-1', name: 'Test Inv 1', type: 'business', initialPrincipal: 20000, date: '2026-01-02', fundingAccountId: 'test-bank', purpose: 'test', expectedReturnMethod: 'profit', status: 'active' };
      const tx: Transaction = { id: 't1', date: '2026-01-02', type: 'investment_contribution', amount: 20000, accountId: 'test-bank', investmentId: 'test-inv-1', createdAt: '', updatedAt: '' };
      const dummySummary = calculateDashboardSummary([testAccount], [inv], [tx], { startDate: '2026-01-01', endDate: '2026-12-31', period: 'all_time' });

      const passed = dummySummary.totalBankBalances === 80000 && dummySummary.totalInvestmentsOutstanding === 20000 && dummySummary.myMoney === 100000;
      results.push({
        id: 1,
        title: 'New Investment Capital Outflow',
        expected: 'Bank: ₹80,000 | Outstanding Inv: ₹20,000 | My Money: ₹1,00,000',
        actual: `Bank: ₹${dummySummary.totalBankBalances.toLocaleString('en-IN')} | Outstanding Inv: ₹${dummySummary.totalInvestmentsOutstanding.toLocaleString('en-IN')} | My Money: ₹${dummySummary.myMoney.toLocaleString('en-IN')}`,
        passed,
      });
    }

    // Test 2: Principal and interest repayment
    {
      const inv: Investment = { id: 'test-inv-2', name: 'Test Inv 2', type: 'loan', initialPrincipal: 100000, date: '2026-01-01', fundingAccountId: 'test-bank', purpose: 'test', expectedReturnMethod: 'interest', status: 'active' };
      const txInit: Transaction = { id: 't2-init', date: '2026-01-01', type: 'investment_contribution', amount: 100000, accountId: 'test-bank', investmentId: 'test-inv-2', createdAt: '', updatedAt: '' };
      const txReturn: Transaction = { id: 't2-ret', date: '2026-01-05', type: 'investment_return', amount: 500, accountId: 'test-bank', investmentId: 'test-inv-2', principalReturned: 300, interestOrProfitReceived: 200, createdAt: '', updatedAt: '' };

      const metrics = calculateInvestmentMetrics(inv, [txInit, txReturn]);
      const summaryT2 = calculateDashboardSummary([testAccount], [inv], [txInit, txReturn], { startDate: '2026-01-01', endDate: '2026-12-31', period: 'all_time' });

      const passed = metrics.outstandingPrincipal === 99700 && summaryT2.periodEarnings === 200 && summaryT2.totalBankBalances === 500 && summaryT2.myMoney === 100200;
      results.push({
        id: 2,
        title: 'Principal & Interest Repayment Split',
        expected: 'Outstanding Principal: ₹99,700 | Bank +₹500 | Earnings: ₹200 | My Money: +₹200',
        actual: `Outstanding: ₹${metrics.outstandingPrincipal.toLocaleString('en-IN')} | Earnings: ₹${summaryT2.periodEarnings} | My Money: ₹${summaryT2.myMoney.toLocaleString('en-IN')}`,
        passed,
      });
    }

    // Test 3: Investment fully repaid
    {
      const inv: Investment = { id: 'test-inv-3', name: 'Test Inv 3', type: 'business', initialPrincipal: 300, date: '2026-01-01', fundingAccountId: 'test-bank', purpose: 'test', expectedReturnMethod: 'profit', status: 'active' };
      const txInit: Transaction = { id: 't3-init', date: '2026-01-01', type: 'investment_contribution', amount: 300, accountId: 'test-bank', investmentId: 'test-inv-3', createdAt: '', updatedAt: '' };
      const txReturn: Transaction = { id: 't3-ret', date: '2026-01-05', type: 'investment_return', amount: 500, accountId: 'test-bank', investmentId: 'test-inv-3', principalReturned: 300, interestOrProfitReceived: 200, createdAt: '', updatedAt: '' };

      const metrics = calculateInvestmentMetrics(inv, [txInit, txReturn]);
      const summaryT3 = calculateDashboardSummary([testAccount], [inv], [txInit, txReturn], { startDate: '2026-01-01', endDate: '2026-12-31', period: 'all_time' });

      const passed = metrics.outstandingPrincipal === 0 && metrics.computedStatus === 'fully_returned' && summaryT3.periodEarnings === 200;
      results.push({
        id: 3,
        title: 'Investment Fully Repaid Status & Zero Principal',
        expected: 'Outstanding Principal: ₹0 | Status: fully_returned | Earnings: ₹200',
        actual: `Outstanding: ₹${metrics.outstandingPrincipal} | Status: ${metrics.computedStatus} | Earnings: ₹${summaryT3.periodEarnings}`,
        passed,
      });
    }

    // Test 4: Expense paid in cash
    {
      const txExp: Transaction = { id: 't4', date: '2026-01-02', type: 'expense', amount: 500, accountId: 'test-cash', createdAt: '', updatedAt: '' };
      const summaryT4 = calculateDashboardSummary([testCash], [], [txExp], { startDate: '2026-01-01', endDate: '2026-12-31', period: 'all_time' });

      const passed = summaryT4.totalCashInHand === 1500 && summaryT4.periodExpenses === 500 && summaryT4.myMoney === 1500;
      results.push({
        id: 4,
        title: 'Expense Paid in Cash',
        expected: 'Cash: ₹1,500 | Expenses: ₹500 | My Money: ₹1,500 (decreased by ₹500)',
        actual: `Cash: ₹${summaryT4.totalCashInHand} | Expenses: ₹${summaryT4.periodExpenses} | My Money: ₹${summaryT4.myMoney}`,
        passed,
      });
    }

    // Test 5: Internal transfer
    {
      const txTransfer: Transaction = { id: 't5', date: '2026-01-02', type: 'transfer_internal', amount: 10000, accountId: 'test-bank', toAccountId: 'test-bank-2', createdAt: '', updatedAt: '' };
      const summaryT5 = calculateDashboardSummary([testAccount, testBank2], [], [txTransfer], { startDate: '2026-01-01', endDate: '2026-12-31', period: 'all_time' });

      const passed = summaryT5.myMoney === 100000 && summaryT5.periodEarnings === 0 && summaryT5.periodExpenses === 0;
      results.push({
        id: 5,
        title: 'Internal Transfer Between Tracked Accounts',
        expected: 'My Money: ₹1,00,000 (unchanged) | Earnings: ₹0 | Expenses: ₹0',
        actual: `My Money: ₹${summaryT5.myMoney.toLocaleString('en-IN')} | Earnings: ₹${summaryT5.periodEarnings} | Expenses: ₹${summaryT5.periodExpenses}`,
        passed,
      });
    }

    // Test 6: External transfer
    {
      const txExt: Transaction = { id: 't6', date: '2026-01-02', type: 'transfer_external', amount: 5000, accountId: 'test-bank', createdAt: '', updatedAt: '' };
      const summaryT6 = calculateDashboardSummary([testAccount], [], [txExt], { startDate: '2026-01-01', endDate: '2026-12-31', period: 'all_time' });

      const passed = summaryT6.totalBankBalances === 95000 && summaryT6.myMoney === 95000 && summaryT6.periodExpenses === 0;
      results.push({
        id: 6,
        title: 'External Transfer (Owner Withdrawal)',
        expected: 'Bank: ₹95,000 | My Money: ₹95,000 | Expenses: ₹0 (not classified as operating expense)',
        actual: `Bank: ₹${summaryT6.totalBankBalances.toLocaleString('en-IN')} | My Money: ₹${summaryT6.myMoney.toLocaleString('en-IN')} | Expenses: ₹${summaryT6.periodExpenses}`,
        passed,
      });
    }

    // Test 7: Edit a saved transaction
    {
      const txOriginal: Transaction = { id: 't7', date: '2026-01-02', type: 'expense', amount: 500, accountId: 'test-bank', createdAt: '', updatedAt: '' };
      const s1 = calculateDashboardSummary([testAccount], [], [txOriginal], { startDate: '2026-01-01', endDate: '2026-12-31', period: 'all_time' });

      const txEdited: Transaction = { ...txOriginal, amount: 400 };
      const s2 = calculateDashboardSummary([testAccount], [], [txEdited], { startDate: '2026-01-01', endDate: '2026-12-31', period: 'all_time' });

      const passed = s1.periodExpenses === 500 && s2.periodExpenses === 400 && s2.totalBankBalances === 99600;
      results.push({
        id: 7,
        title: 'Edit Saved Transaction Recalculation',
        expected: 'Original: ₹500 expense | Edited: ₹400 expense | Bank increases by ₹100',
        actual: `Original: ₹${s1.periodExpenses} | Edited: ₹${s2.periodExpenses} | Bank: ₹${s2.totalBankBalances.toLocaleString('en-IN')}`,
        passed,
      });
    }

    // Test 8: Prevent invalid principal repayment
    {
      const inv8: Investment = { id: 'test-inv-8', name: 'Test Inv 8', type: 'business', initialPrincipal: 1000, date: '2026-01-01', fundingAccountId: 'test-bank', purpose: 'test', expectedReturnMethod: 'profit', status: 'active' };
      const txInit8: Transaction = { id: 't8-init', date: '2026-01-01', type: 'investment_contribution', amount: 1000, accountId: 'test-bank', investmentId: 'test-inv-8', createdAt: '', updatedAt: '' };
      const metrics8 = calculateInvestmentMetrics(inv8, [txInit8]);
      const attemptedRepayment = 1500;
      const isBlocked = attemptedRepayment > metrics8.outstandingPrincipal;

      results.push({
        id: 8,
        title: 'Prevent Invalid Principal Over-Repayment',
        expected: 'Attempted repayment of ₹1,500 is rejected because outstanding principal is ₹1,000',
        actual: isBlocked ? 'Blocked: Repayment ₹1,500 exceeds outstanding principal ₹1,000' : 'Failed to block',
        passed: isBlocked,
      });
    }

    // Test 9: Opening balance
    {
      const accOpening: Account = { id: 'test-open', name: 'Opening Bank', type: 'bank', openingBalance: 50000, openingDate: '2026-01-01', isActive: true };
      const summaryT9 = calculateDashboardSummary([accOpening], [], [], { startDate: '2026-01-01', endDate: '2026-12-31', period: 'all_time' });

      const passed = summaryT9.totalBankBalances === 50000 && summaryT9.periodEarnings === 0 && summaryT9.myMoney === 50000;
      results.push({
        id: 9,
        title: 'Opening Balance Handling',
        expected: 'Bank: ₹50,000 | Earnings: ₹0 (opening balance excluded from earnings) | My Money: ₹50,000',
        actual: `Bank: ₹${summaryT9.totalBankBalances.toLocaleString('en-IN')} | Earnings: ₹${summaryT9.periodEarnings} | My Money: ₹${summaryT9.myMoney.toLocaleString('en-IN')}`,
        passed,
      });
    }

    // Test 10: Duplicate synchronization prevention
    {
      const txList = [{ id: 'unique-tx-1' }, { id: 'unique-tx-1' }];
      const deduped = Array.from(new Map(txList.map((item) => [item.id, item])).values());
      const passed = deduped.length === 1;

      results.push({
        id: 10,
        title: 'Duplicate Synchronization Idempotency',
        expected: 'Identical repeated transaction IDs deduplicated to exactly 1 record',
        actual: `2 incoming items deduplicated to ${deduped.length} record`,
        passed,
      });
    }

    return results;
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        incomeSources,
        expenseCategories,
        investments,
        transactions,
        dateRange,
        setDateRange,
        activeTab,
        setActiveTab,
        summary,
        investmentMetricsList,

        currentUser,
        isAuthLoading,
        firebaseSyncStatus,
        firebaseProjectId,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signInWithGoogle,
        signInAsGuest,
        signUpWithEmailOrPhone,
        signInWithEmailOrPhone,
        resetPassword,
        logOut,
        uploadLocalDataToFirebase,

        shiftMonth,
        currentMonthLabel,

        isQuickEntryOpen,
        quickEntryType,
        openQuickEntry,
        closeQuickEntry,

        deletionPin,
        updateDeletionPin,
        deleteTransactionPermanently,

        selectedInvestmentId,
        setSelectedInvestmentId,

        addTransaction,
        updateTransaction,
        deleteTransaction,

        addInvestment,
        updateInvestment,

        addIncomeSource,
        updateIncomeSource,

        addExpenseCategory,
        updateExpenseCategory,

        addAccount,
        updateAccount,

        resetToSampleData,
        clearAllData,
        exportDataJSON,
        importDataJSON,
        runAccountingTestSuite,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
