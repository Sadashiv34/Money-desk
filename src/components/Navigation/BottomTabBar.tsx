import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { ActiveTab } from '../../types/financial';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Briefcase, 
  BarChart3, 
  Plus,
  CreditCard,
  ReceiptText
} from 'lucide-react';

export const BottomTabBar: React.FC = () => {
  const { activeTab, setActiveTab, openQuickEntry } = useFinance();

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-lg border-t border-zinc-900 pb-safe">
      <div className="grid grid-cols-5 items-center h-16 max-w-lg mx-auto px-2">
        {/* Tab 1: Dashboard */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Dashboard</span>
        </button>

        {/* Tab 2: Earnings */}
        <button
          onClick={() => setActiveTab('earnings')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'earnings' ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Earnings</span>
        </button>

        {/* Tab 3: Prominent Central Elevated Plus (+) Button */}
        <div className="flex items-center justify-center relative -top-3">
          <button
            onClick={() => openQuickEntry()}
            className="w-13 h-13 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-zinc-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 border-4 border-zinc-950 transition-all cursor-pointer"
            aria-label="Add Transaction"
          >
            <Plus className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        {/* Tab 4: Investments */}
        <button
          onClick={() => setActiveTab('investments')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'investments' ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Briefcase className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Investments</span>
        </button>

        {/* Tab 5: Insights */}
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
            activeTab === 'insights' ? 'text-emerald-400 font-semibold' : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] tracking-tight mt-1">Insights</span>
        </button>
      </div>

      {/* Secondary quick-switch utility pills on mobile */}
      <div className="flex items-center justify-center gap-6 py-1 border-t border-zinc-900/60 bg-zinc-950 text-[11px] text-zinc-400">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`hover:text-zinc-200 flex items-center gap-1 py-1 ${activeTab === 'expenses' ? 'text-zinc-200 font-medium' : ''}`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Expenses</span>
        </button>
        <span className="text-zinc-700">·</span>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`hover:text-zinc-200 flex items-center gap-1 py-1 ${activeTab === 'transactions' ? 'text-zinc-200 font-medium' : ''}`}
        >
          <ReceiptText className="w-3.5 h-3.5" />
          <span>History</span>
        </button>
        <span className="text-zinc-700">·</span>
        <button
          onClick={() => setActiveTab('settings')}
          className={`hover:text-zinc-200 flex items-center gap-1 py-1 ${activeTab === 'settings' ? 'text-zinc-200 font-medium' : ''}`}
        >
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
};
