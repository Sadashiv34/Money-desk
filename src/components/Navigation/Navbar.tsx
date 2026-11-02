import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { PeriodType, ActiveTab } from '../../types/financial';
import { getDateRangeForPeriod } from '../../utils/calculations';
import { 
  Plus, 
  Calendar, 
  Wallet, 
  LayoutDashboard, 
  TrendingUp, 
  CreditCard, 
  Briefcase, 
  BarChart3, 
  ReceiptText, 
  Settings,
  User as UserIcon,
  LogIn
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    dateRange, 
    setDateRange, 
    activeTab, 
    setActiveTab, 
    openQuickEntry, 
    firebaseSyncStatus, 
    currentUser,
    openAuthModal
  } = useFinance();

  const handlePeriodChange = (period: PeriodType) => {
    setDateRange(getDateRangeForPeriod(period));
  };

  const navLinks: { id: ActiveTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'earnings', label: 'Earnings', icon: TrendingUp },
    { id: 'investments', label: 'Investments', icon: Briefcase },
    { id: 'expenses', label: 'Expenses', icon: CreditCard },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'transactions', label: 'History', icon: ReceiptText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-900 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-emerald-400 group-hover:border-emerald-500/40 transition-colors shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-zinc-100 flex items-center gap-1.5 whitespace-nowrap">
                MoneyDesk
                <span className="hidden sm:inline-block text-[11px] font-normal text-zinc-400">· Intelligence</span>
              </span>
            </div>
          </button>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-1 bg-zinc-900/60 border border-zinc-800/80 p-1 rounded-xl">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-zinc-800 text-white shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span>{link.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Cloud Sync, Period Selector & Quick Add Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Account & Isolation Trigger */}
          <button
            onClick={openAuthModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-200 transition-colors cursor-pointer"
            title="User Account & Isolation"
          >
            {currentUser && !currentUser.isAnonymous ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            ) : (
              <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
            )}
            <span className="font-medium text-[11px] max-w-[90px] sm:max-w-[120px] truncate">
              {currentUser 
                ? (currentUser.displayName || currentUser.email?.split('@')[0] || (currentUser.isAnonymous ? 'Guest' : 'Account'))
                : 'Sign In'}
            </span>
          </button>

          {/* Period Dropdown */}
          <div className="relative flex items-center bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300">
            <Calendar className="w-3.5 h-3.5 text-zinc-400 mr-2 shrink-0" />
            <select
              value={dateRange.period}
              onChange={(e) => handlePeriodChange(e.target.value as PeriodType)}
              className="bg-transparent text-xs text-zinc-200 font-medium focus:outline-none cursor-pointer pr-1"
            >
              <option value="this_month" className="bg-zinc-900 text-zinc-200">This Month</option>
              <option value="last_month" className="bg-zinc-900 text-zinc-200">Last Month</option>
              <option value="last_3_months" className="bg-zinc-900 text-zinc-200">Last 3 Months</option>
              <option value="last_6_months" className="bg-zinc-900 text-zinc-200">Last 6 Months</option>
              <option value="this_financial_year" className="bg-zinc-900 text-zinc-200">Financial Year</option>
              <option value="all_time" className="bg-zinc-900 text-zinc-200">All Time</option>
            </select>
          </div>

          {/* Quick Action Button (prominent on desktop & tablet) */}
          <button
            onClick={() => openQuickEntry()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold rounded-lg text-xs transition-colors shadow-xs cursor-pointer shrink-0"
            title="Record New Transaction"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Entry</span>
          </button>
        </div>
      </div>
    </header>
  );
};
