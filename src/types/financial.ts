/**
 * Core Financial Data Types for Personal Money Tracker & Investment Intelligence
 */

export type AccountType = 'bank' | 'cash';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number; // in Rupees
  openingDate: string; // YYYY-MM-DD
  isActive: boolean;
  accountNumber?: string;
}

export interface IncomeSource {
  id: string;
  name: string;
  category: string; // e.g. "Rental Business", "Business Income", "Interest Income", "Business Profit", "Other"
  associatedBusiness?: string; // e.g. "Bike Rentals", "Software Client Projects"
  description?: string;
  isActive: boolean;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export type InvestmentType = 
  | 'rental_asset'
  | 'business'
  | 'loan'
  | 'equipment'
  | 'profit_sharing'
  | 'other';

export type InvestmentStatus = 
  | 'active'
  | 'partially_returned'
  | 'fully_returned'
  | 'closed';

export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  initialPrincipal: number;
  date: string; // YYYY-MM-DD
  fundingAccountId: string;
  purpose: string;
  associatedEntity?: string; // business, asset, or person
  expectedReturnMethod: string; // e.g. "Rental income", "Fixed interest", "Profit share"
  expectedRateOrProfit?: string;
  expectedFrequency?: string; // "Monthly", "Quarterly", "Lump sum"
  expectedDuration?: string;
  status: InvestmentStatus;
  notes?: string;
}

export type TransactionType =
  | 'income' // Operating or source earnings
  | 'expense' // Operating business/personal tracked expense
  | 'investment_contribution' // Initial or additional capital to investment
  | 'investment_return' // Principal repayment + interest/profit split
  | 'investment_expense' // Direct expense attributed to an asset (e.g., bike maintenance)
  | 'transfer_internal' // Between two tracked accounts (Bank <-> Bank, Bank <-> Cash)
  | 'transfer_external'; // External transfer / Owner withdrawal to untracked personal account

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  amount: number; // Total money moved
  accountId: string; // Paying or receiving account
  toAccountId?: string; // Destination for transfer_internal
  sourceId?: string; // For income
  categoryId?: string; // For expense
  investmentId?: string; // For investment transactions
  principalReturned?: number; // Component of investment_return
  interestOrProfitReceived?: number; // Component of investment_return
  notes?: string;
  referenceDoc?: string;
  tid?: string; // Transaction ID / UPI / Cheque / IMPS Reference #
  associatedBusiness?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentMetrics {
  investment: Investment;
  initialPrincipal: number;
  additionalContributions: number;
  totalPrincipalInvested: number;
  principalReturned: number;
  outstandingPrincipal: number;
  interestOrProfitReceived: number;
  rentalOrAssociatedIncome: number;
  totalIncomeReceived: number;
  directExpenses: number;
  totalCashReturned: number;
  netRealizedGain: number;
  computedStatus: InvestmentStatus;
  transactionsCount: number;
  daysActive: number;
}

export interface DashboardSummary {
  myMoney: number;
  totalInvestmentsOutstanding: number;
  totalBankBalances: number;
  totalCashInHand: number;
  periodEarnings: number;
  periodExpenses: number;
  netOperatingCashFlow: number;
  accountsBreakdown: { account: Account; balance: number }[];
  activeInvestmentsCount: number;
}

export type PeriodType = 
  | 'this_month'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months'
  | 'this_financial_year'
  | 'all_time'
  | 'custom';

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  period: PeriodType;
}

export type ActiveTab = 
  | 'dashboard'
  | 'earnings'
  | 'expenses'
  | 'investments'
  | 'insights'
  | 'transactions'
  | 'settings';
