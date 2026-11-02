import {
  Account,
  ExpenseCategory,
  IncomeSource,
  Investment,
  Transaction,
} from '../types/financial';

const today = new Date().toISOString().split('T')[0];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    id: 'acc-main-bank',
    name: 'Business Bank Account',
    type: 'bank',
    openingBalance: 0,
    openingDate: today,
    isActive: true,
    accountNumber: 'Primary',
  },
  {
    id: 'acc-cash',
    name: 'Cash in Hand',
    type: 'cash',
    openingBalance: 0,
    openingDate: today,
    isActive: true,
  },
];

export const INITIAL_INCOME_SOURCES: IncomeSource[] = [
  {
    id: 'src-bike-rentals',
    name: 'Bike Rentals',
    category: 'Rental Business',
    associatedBusiness: 'Rental Fleet',
    description: 'Vehicle and asset rental income',
    isActive: true,
  },
  {
    id: 'src-software-services',
    name: 'Software Development',
    category: 'Business Income',
    associatedBusiness: 'Software Services',
    description: 'Engineering retainers and contract projects',
    isActive: true,
  },
  {
    id: 'src-investment-interest',
    name: 'Investment Interest',
    category: 'Interest Income',
    description: 'Interest received from lent capital or notes',
    isActive: true,
  },
  {
    id: 'src-business-profit',
    name: 'Business Profit Share',
    category: 'Business Profit',
    description: 'Distributions and profit dividends',
    isActive: true,
  },
  {
    id: 'src-other-income',
    name: 'Other Income',
    category: 'Other',
    description: 'Miscellaneous receipts and one-off sales',
    isActive: true,
  },
];

export const INITIAL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'cat-rent', name: 'Rent & Space', isActive: true },
  { id: 'cat-maintenance', name: 'Equipment & Maintenance', isActive: true },
  { id: 'cat-fuel', name: 'Travel & Fuel', isActive: true },
  { id: 'cat-software', name: 'Software & Subscriptions', isActive: true },
  { id: 'cat-contractors', name: 'Employee & Contractor Payments', isActive: true },
  { id: 'cat-utilities', name: 'Electricity & Utilities', isActive: true },
  { id: 'cat-internet', name: 'Internet & Phone', isActive: true },
  { id: 'cat-food', name: 'Food & Refreshments', isActive: true },
  { id: 'cat-marketing', name: 'Marketing & Ads', isActive: true },
  { id: 'cat-taxes', name: 'Taxes & Statutory Payments', isActive: true },
  { id: 'cat-bank-charges', name: 'Bank Charges', isActive: true },
  { id: 'cat-other', name: 'Other Expenses', isActive: true },
];

// Clean empty investments list
export const INITIAL_INVESTMENTS: Investment[] = [];

// Clean empty transactions list
export const INITIAL_TRANSACTIONS: Transaction[] = [];
