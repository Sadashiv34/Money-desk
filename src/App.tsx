/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Navbar } from './components/Navigation/Navbar';
import { BottomTabBar } from './components/Navigation/BottomTabBar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { EarningsView } from './components/Earnings/EarningsView';
import { ExpensesView } from './components/Expenses/ExpensesView';
import { InvestmentsView } from './components/Investments/InvestmentsView';
import { InsightsView } from './components/Insights/InsightsView';
import { TransactionsView } from './components/Transactions/TransactionsView';
import { SettingsView } from './components/Settings/SettingsView';
import { QuickEntryModal } from './components/Modals/QuickEntryModal';
import { AuthModal } from './components/Auth/AuthModal';
import { PWAInstallPrompt } from './components/PWA/PWAInstallPrompt';

const AppContent: React.FC = () => {
  const { activeTab } = useFinance();

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV !== 'development') {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.log('ServiceWorker registration error:', err));
    }
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Top Header Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-28 lg:pb-12">
        {/* PWA Home Screen Install Banner */}
        <PWAInstallPrompt />

        {/* View Switcher */}
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'earnings' && <EarningsView />}
        {activeTab === 'investments' && <InvestmentsView />}
        {activeTab === 'expenses' && <ExpensesView />}
        {activeTab === 'insights' && <InsightsView />}
        {activeTab === 'transactions' && <TransactionsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>

      {/* Quick Entry Modal (Global Floating Sheet) */}
      <QuickEntryModal />

      {/* Account Isolation & Auth Modal */}
      <AuthModal />

      {/* Mobile Fixed Bottom Tab Bar */}
      <BottomTabBar />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <AppContent />
    </FinanceProvider>
  );
}
