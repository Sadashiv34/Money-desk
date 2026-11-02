import {
  Account,
  Investment,
  InvestmentMetrics,
  InvestmentStatus,
  Transaction,
  DashboardSummary,
  DateRange,
} from '../types/financial';

/**
 * Calculate live balance for every account based on opening balance and transactions
 */
export function calculateAccountBalances(
  accounts: Account[],
  transactions: Transaction[]
): {
  balancesByAccountId: Map<string, number>;
  totalBankBalances: number;
  totalCashInHand: number;
  accountsWithBalances: { account: Account; balance: number }[];
} {
  const balancesByAccountId = new Map<string, number>();

  // Initialize with opening balances
  for (const account of accounts) {
    balancesByAccountId.set(account.id, account.openingBalance || 0);
  }

  // Process all transactions
  for (const tx of transactions) {
    const amount = tx.amount || 0;

    switch (tx.type) {
      case 'income': {
        // Increases account balance
        const current = balancesByAccountId.get(tx.accountId) ?? 0;
        balancesByAccountId.set(tx.accountId, current + amount);
        break;
      }
      case 'expense': {
        // Decreases account balance
        const current = balancesByAccountId.get(tx.accountId) ?? 0;
        balancesByAccountId.set(tx.accountId, current - amount);
        break;
      }
      case 'investment_contribution': {
        // Funding account balance decreases by investment amount
        const current = balancesByAccountId.get(tx.accountId) ?? 0;
        balancesByAccountId.set(tx.accountId, current - amount);
        break;
      }
      case 'investment_return': {
        // Receiving account increases by total received amount
        const current = balancesByAccountId.get(tx.accountId) ?? 0;
        balancesByAccountId.set(tx.accountId, current + amount);
        break;
      }
      case 'investment_expense': {
        // Direct expense decreases paying account
        const current = balancesByAccountId.get(tx.accountId) ?? 0;
        balancesByAccountId.set(tx.accountId, current - amount);
        break;
      }
      case 'transfer_internal': {
        // Source decreases
        const sourceCurrent = balancesByAccountId.get(tx.accountId) ?? 0;
        balancesByAccountId.set(tx.accountId, sourceCurrent - amount);

        // Destination increases
        if (tx.toAccountId) {
          const destCurrent = balancesByAccountId.get(tx.toAccountId) ?? 0;
          balancesByAccountId.set(tx.toAccountId, destCurrent + amount);
        }
        break;
      }
      case 'transfer_external': {
        // Tracked account decreases (transfer to untracked external account / owner withdrawal)
        const current = balancesByAccountId.get(tx.accountId) ?? 0;
        balancesByAccountId.set(tx.accountId, current - amount);
        break;
      }
    }
  }

  let totalBankBalances = 0;
  let totalCashInHand = 0;
  const accountsWithBalances: { account: Account; balance: number }[] = [];

  for (const account of accounts) {
    const balance = balancesByAccountId.get(account.id) ?? 0;
    accountsWithBalances.push({ account, balance });

    if (account.isActive) {
      if (account.type === 'bank') {
        totalBankBalances += balance;
      } else if (account.type === 'cash') {
        totalCashInHand += balance;
      }
    }
  }

  return {
    balancesByAccountId,
    totalBankBalances,
    totalCashInHand,
    accountsWithBalances,
  };
}

/**
 * Calculate accurate investment performance and unrecovered principal metrics
 */
export function calculateInvestmentMetrics(
  investment: Investment,
  transactions: Transaction[]
): InvestmentMetrics {
  const initialPrincipal = investment.initialPrincipal || 0;

  // Contributions from transactions for this investment
  const contributionTransactions = transactions
    .filter((t) => t.investmentId === investment.id && t.type === 'investment_contribution');

  const totalContributionsFromTx = contributionTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

  // If contribution transactions exist, they represent the invested principal recorded in the ledger.
  // Otherwise, fallback to initialPrincipal. NEVER add initialPrincipal + contributionTransactions together
  // because the initial capital outflow transaction is itself the initialPrincipal!
  const totalPrincipalInvested = totalContributionsFromTx > 0 
    ? totalContributionsFromTx 
    : initialPrincipal;

  const additionalContributions = Math.max(0, totalPrincipalInvested - initialPrincipal);

  // Principal returned
  const principalReturned = transactions
    .filter((t) => t.investmentId === investment.id && t.type === 'investment_return')
    .reduce((sum, t) => sum + (t.principalReturned || 0), 0);

  // Outstanding principal cannot be negative
  const outstandingPrincipal = Math.max(0, totalPrincipalInvested - principalReturned);

  // Interest or profit received directly from returns
  const interestOrProfitReceived = transactions
    .filter((t) => t.investmentId === investment.id && t.type === 'investment_return')
    .reduce((sum, t) => sum + (t.interestOrProfitReceived || 0), 0);

  // Rental income or operating revenue linked to this investment/asset
  const rentalOrAssociatedIncome = transactions
    .filter(
      (t) =>
        t.type === 'income' &&
        (t.investmentId === investment.id ||
          (investment.associatedEntity &&
            t.associatedBusiness &&
            t.associatedBusiness.trim().toLowerCase() === investment.associatedEntity.trim().toLowerCase()))
    )
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalIncomeReceived = interestOrProfitReceived + rentalOrAssociatedIncome;

  // Direct expenses (e.g. repairs, maintenance for a rental bike)
  const directExpenses = transactions
    .filter((t) => t.investmentId === investment.id && t.type === 'investment_expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalCashReturned = principalReturned + totalIncomeReceived;
  const netRealizedGain = totalIncomeReceived - directExpenses;

  // Determine status
  let computedStatus: InvestmentStatus = investment.status;
  if (investment.status !== 'closed') {
    if (outstandingPrincipal === 0 && totalPrincipalInvested > 0) {
      computedStatus = 'fully_returned';
    } else if (principalReturned > 0) {
      computedStatus = 'partially_returned';
    } else {
      computedStatus = 'active';
    }
  }

  // Days active
  let daysActive = 0;
  if (investment.date) {
    const start = new Date(investment.date).getTime();
    const now = new Date().getTime();
    daysActive = Math.max(1, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
  }

  const relatedTxs = transactions.filter(
    (t) =>
      t.investmentId === investment.id ||
      (investment.associatedEntity &&
        t.associatedBusiness &&
        t.associatedBusiness.trim().toLowerCase() === investment.associatedEntity.trim().toLowerCase())
  );

  return {
    investment,
    initialPrincipal,
    additionalContributions,
    totalPrincipalInvested,
    principalReturned,
    outstandingPrincipal,
    interestOrProfitReceived,
    rentalOrAssociatedIncome,
    totalIncomeReceived,
    directExpenses,
    totalCashReturned,
    netRealizedGain,
    computedStatus,
    transactionsCount: relatedTxs.length,
    daysActive,
  };
}

/**
 * Filter transactions within a date range
 */
export function filterTransactionsByDate(
  transactions: Transaction[],
  dateRange: DateRange
): Transaction[] {
  if (dateRange.period === 'all_time') return transactions;
  const start = dateRange.startDate;
  const end = dateRange.endDate;

  return transactions.filter((t) => {
    return t.date >= start && t.date <= end;
  });
}

/**
 * Calculate Period Earnings & Expenses
 * Rule: Principal return is NOT earnings. Transfers are NOT earnings/expenses.
 */
export function calculatePeriodEarningsAndExpenses(
  transactions: Transaction[],
  dateRange?: DateRange
): {
  earnings: number;
  expenses: number;
  netOperatingCashFlow: number;
  earningsBySource: Map<string, number>;
  expensesByCategory: Map<string, number>;
} {
  const targetTxs = dateRange ? filterTransactionsByDate(transactions, dateRange) : transactions;

  let earnings = 0;
  let expenses = 0;
  const earningsBySource = new Map<string, number>();
  const expensesByCategory = new Map<string, number>();

  for (const tx of targetTxs) {
    if (tx.type === 'income') {
      earnings += tx.amount;
      const key = tx.sourceId || 'other_income';
      earningsBySource.set(key, (earningsBySource.get(key) || 0) + tx.amount);
    } else if (tx.type === 'investment_return') {
      // ONLY the interest or profit received counts as earnings!
      const profit = tx.interestOrProfitReceived || 0;
      earnings += profit;
      const key = tx.sourceId || 'investment_interest';
      earningsBySource.set(key, (earningsBySource.get(key) || 0) + profit);
    } else if (tx.type === 'expense') {
      expenses += tx.amount;
      const key = tx.categoryId || 'other_expenses';
      expensesByCategory.set(key, (expensesByCategory.get(key) || 0) + tx.amount);
    } else if (tx.type === 'investment_expense') {
      expenses += tx.amount;
      const key = tx.categoryId || 'investment_maintenance';
      expensesByCategory.set(key, (expensesByCategory.get(key) || 0) + tx.amount);
    }
  }

  return {
    earnings,
    expenses,
    netOperatingCashFlow: earnings - expenses,
    earningsBySource,
    expensesByCategory,
  };
}

/**
 * Calculate the overall Dashboard Summary including My Money:
 * My Money = Outstanding Investment Principal + Tracked Bank Balances + Cash in Hand
 */
export function calculateDashboardSummary(
  accounts: Account[],
  investments: Investment[],
  transactions: Transaction[],
  dateRange: DateRange
): DashboardSummary {
  // 1. Live account balances
  const { totalBankBalances, totalCashInHand, accountsWithBalances } = calculateAccountBalances(
    accounts,
    transactions
  );

  // 2. Outstanding investment principal
  let totalInvestmentsOutstanding = 0;
  let activeInvestmentsCount = 0;

  for (const investment of investments) {
    if (investment.status !== 'closed') {
      const metrics = calculateInvestmentMetrics(investment, transactions);
      totalInvestmentsOutstanding += metrics.outstandingPrincipal;
      if (metrics.computedStatus !== 'fully_returned') {
        activeInvestmentsCount++;
      }
    }
  }

  // 3. My Money Formula
  const myMoney = totalInvestmentsOutstanding + totalBankBalances + totalCashInHand;

  // 4. Period earnings and expenses
  const { earnings: periodEarnings, expenses: periodExpenses, netOperatingCashFlow } =
    calculatePeriodEarningsAndExpenses(transactions, dateRange);

  return {
    myMoney,
    totalInvestmentsOutstanding,
    totalBankBalances,
    totalCashInHand,
    periodEarnings,
    periodExpenses,
    netOperatingCashFlow,
    accountsBreakdown: accountsWithBalances,
    activeInvestmentsCount,
  };
}

/**
 * Generate standard date ranges for period filters
 */
export function getDateRangeForPeriod(period: DateRange['period']): DateRange {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  const pad = (n: number) => n.toString().padStart(2, '0');
  const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === 'this_month') {
    const startDate = `${year}-${pad(month + 1)}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const endDate = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
    return { startDate, endDate, period };
  }

  if (period === 'last_month') {
    const prevMonthDate = new Date(year, month - 1, 1);
    const prevYear = prevMonthDate.getFullYear();
    const prevMonth = prevMonthDate.getMonth();
    const startDate = `${prevYear}-${pad(prevMonth + 1)}-01`;
    const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
    const endDate = `${prevYear}-${pad(prevMonth + 1)}-${pad(lastDay)}`;
    return { startDate, endDate, period };
  }

  if (period === 'last_3_months') {
    const start = new Date(year, month - 2, 1);
    const lastDay = new Date(year, month + 1, 0).getDate();
    return {
      startDate: format(start),
      endDate: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
      period,
    };
  }

  if (period === 'last_6_months') {
    const start = new Date(year, month - 5, 1);
    const lastDay = new Date(year, month + 1, 0).getDate();
    return {
      startDate: format(start),
      endDate: `${year}-${pad(month + 1)}-${pad(lastDay)}`,
      period,
    };
  }

  if (period === 'this_financial_year') {
    // Indian FY runs 1st April to 31st March
    const fyStartYear = month >= 3 ? year : year - 1;
    const startDate = `${fyStartYear}-04-01`;
    const endDate = `${fyStartYear + 1}-03-31`;
    return { startDate, endDate, period };
  }

  // All time
  return {
    startDate: '2020-01-01',
    endDate: '2030-12-31',
    period: 'all_time',
  };
}

/**
 * Generate date range for a specific year and month (0-indexed month)
 */
export function getDateRangeForSpecificMonth(year: number, month: number): DateRange {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const startDate = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
  return { startDate, endDate, period: 'this_month' };
}

/**
 * Shift the date range backwards or forwards by N months
 */
export function shiftMonthRange(currentRange: DateRange, offset: number): DateRange {
  // Parse year and month from startDate
  const parts = currentRange.startDate.split('-');
  const year = parseInt(parts[0], 10) || new Date().getFullYear();
  const month = (parseInt(parts[1], 10) || 1) - 1; // 0-indexed

  const targetDate = new Date(year, month + offset, 1);
  return getDateRangeForSpecificMonth(targetDate.getFullYear(), targetDate.getMonth());
}

/**
 * Format date range for month display (e.g. "November 2026" or "All Time")
 */
export function getDisplayMonthYear(range: DateRange): string {
  if (range.period === 'all_time') return 'All Time';
  if (range.period === 'this_financial_year') return 'Financial Year';
  if (range.period === 'last_3_months') return 'Last 3 Months';
  if (range.period === 'last_6_months') return 'Last 6 Months';

  try {
    const parts = range.startDate.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const d = new Date(year, month, 1);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  } catch {
    return `${range.startDate} - ${range.endDate}`;
  }
}
