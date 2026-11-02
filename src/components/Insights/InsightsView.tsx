import React, { useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatIndianCurrency } from '../../utils/currency';
import { filterTransactionsByDate } from '../../utils/calculations';
import { 
  BarChart3, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Briefcase, 
  Building2, 
  Banknote, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export const InsightsView: React.FC = () => {
  const { 
    summary, 
    transactions, 
    dateRange, 
    incomeSources, 
    expenseCategories, 
    investmentMetricsList,
    setActiveTab,
    setSelectedInvestmentId
  } = useFinance();

  // Period transactions
  const periodTransactions = useMemo(() => {
    return filterTransactionsByDate(transactions, dateRange);
  }, [transactions, dateRange]);

  // Derived Intelligence Calculations
  const intelligence = useMemo(() => {
    // 1. Source Breakdown
    const srcMap = new Map<string, number>();
    for (const tx of periodTransactions) {
      if (tx.type === 'income') {
        const id = tx.sourceId || 'src-other';
        srcMap.set(id, (srcMap.get(id) || 0) + tx.amount);
      } else if (tx.type === 'investment_return') {
        const id = tx.sourceId || 'src-lent-interest';
        srcMap.set(id, (srcMap.get(id) || 0) + (tx.interestOrProfitReceived || 0));
      }
    }

    const sortedSources = Array.from(srcMap.entries())
      .map(([id, amount]) => {
        const s = incomeSources.find((x) => x.id === id);
        return { id, name: s?.name || 'Other Income', amount };
      })
      .sort((a, b) => b.amount - a.amount);

    const topSource = sortedSources[0] || null;

    // 2. Expense Category Breakdown
    const catMap = new Map<string, number>();
    for (const tx of periodTransactions) {
      if (tx.type === 'expense' || tx.type === 'investment_expense') {
        const id = tx.categoryId || 'cat-other';
        catMap.set(id, (catMap.get(id) || 0) + tx.amount);
      }
    }

    const sortedCategories = Array.from(catMap.entries())
      .map(([id, amount]) => {
        const c = expenseCategories.find((x) => x.id === id);
        return { id, name: c?.name || 'Other Expenses', amount };
      })
      .sort((a, b) => b.amount - a.amount);

    const topCategory = sortedCategories[0] || null;

    // 3. Investment Performance Ranks
    const sortedInvestments = [...investmentMetricsList].sort(
      (a, b) => b.netRealizedGain - a.netRealizedGain
    );
    const topInvestment = sortedInvestments[0] || null;

    // 4. Decision Summaries Generation (Dynamic plain-English takeaways)
    const observations: { title: string; text: string; type: 'success' | 'info' | 'warning' }[] = [];

    if (topSource && topSource.amount > 0) {
      const share = Math.round((topSource.amount / (summary.periodEarnings || 1)) * 100);
      observations.push({
        title: 'Primary Revenue Engine',
        text: `Your highest recorded income source this period was "${topSource.name}" generating ${formatIndianCurrency(topSource.amount)} (${share}% of period earnings).`,
        type: 'success',
      });
    }

    if (topCategory && topCategory.amount > 0) {
      const share = Math.round((topCategory.amount / (summary.periodExpenses || 1)) * 100);
      observations.push({
        title: 'Largest Expense Allocation',
        text: `Your largest expense allocation was "${topCategory.name}" totaling ${formatIndianCurrency(topCategory.amount)} (${share}% of period expenses).`,
        type: 'info',
      });
    }

    if (topInvestment) {
      observations.push({
        title: 'Top Asset Performance',
        text: `"${topInvestment.investment.name}" has generated ${formatIndianCurrency(topInvestment.totalIncomeReceived)} in gross income with ${formatIndianCurrency(topInvestment.directExpenses)} direct maintenance costs, delivering a net realized gain of ${formatIndianCurrency(topInvestment.netRealizedGain)}.`,
        type: 'info',
      });
    }

    if (summary.totalInvestmentsOutstanding > 0) {
      observations.push({
        title: 'Capital Preservation Status',
        text: `You have ${formatIndianCurrency(summary.totalInvestmentsOutstanding)} in outstanding capital actively deployed across ${summary.activeInvestmentsCount} assets and ventures.`,
        type: 'info',
      });
    }

    return {
      topSource,
      topCategory,
      topInvestment,
      sortedSources,
      sortedCategories,
      observations,
    };
  }, [periodTransactions, incomeSources, expenseCategories, investmentMetricsList, summary]);

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
          <Sparkles className="w-6 h-6 text-emerald-400" />
          Financial Intelligence & Decision Insights
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Objective evaluation of your capital, revenue streams, asset yields, and operating cash velocity
        </p>
      </div>

      {/* Decision-Focused Observations (Section 11.F requirement) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Decision-Focused Summaries
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {intelligence.observations.map((obs, idx) => (
            <div
              key={idx}
              className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <h3 className="text-xs font-bold text-zinc-100">{obs.title}</h3>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed pl-4">
                {obs.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Section A: Overall Tracked Position vs Period Cash Flow */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
        <h2 className="text-base font-semibold text-white mb-1">Financial Position vs. Period Operating Flow</h2>
        <p className="text-xs text-zinc-400 mb-4">
          Separating current asset backing (**My Money**) from operational cash movements during this period
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
            <span className="text-zinc-400 block">Total Net Position</span>
            <p className="text-base font-bold text-white font-mono mt-1 tabular-nums">
              {formatIndianCurrency(summary.myMoney)}
            </p>
          </div>
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
            <span className="text-zinc-400 block">Period Earnings</span>
            <p className="text-base font-bold text-emerald-400 font-mono mt-1 tabular-nums">
              {formatIndianCurrency(summary.periodEarnings)}
            </p>
          </div>
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
            <span className="text-zinc-400 block">Period Expenses</span>
            <p className="text-base font-bold text-rose-400 font-mono mt-1 tabular-nums">
              {formatIndianCurrency(summary.periodExpenses)}
            </p>
          </div>
          <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl">
            <span className="text-zinc-400 block">Net Cash Flow</span>
            <p className={`text-base font-bold font-mono mt-1 tabular-nums ${
              summary.netOperatingCashFlow >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatIndianCurrency(summary.netOperatingCashFlow)}
            </p>
          </div>
        </div>
      </div>

      {/* Section B & C: Earnings vs. Expenses Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Earnings Ranking */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Income Stream Performance
            </h3>
            <button
              onClick={() => setActiveTab('earnings')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {intelligence.sortedSources.slice(0, 4).map((src, i) => {
              const pct = Math.round((src.amount / (summary.periodEarnings || 1)) * 100);
              return (
                <div key={src.id} className="text-xs space-y-1">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="font-medium truncate max-w-[200px]">{i + 1}. {src.name}</span>
                    <span className="font-mono tabular-nums font-semibold">{formatIndianCurrency(src.amount)} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expenses Ranking */}
        <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-400" />
              Highest Outflow Categories
            </h3>
            <button
              onClick={() => setActiveTab('expenses')}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {intelligence.sortedCategories.slice(0, 4).map((cat, i) => {
              const pct = Math.round((cat.amount / (summary.periodExpenses || 1)) * 100);
              return (
                <div key={cat.id} className="text-xs space-y-1">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="font-medium truncate max-w-[200px]">{i + 1}. {cat.name}</span>
                    <span className="font-mono tabular-nums font-semibold">{formatIndianCurrency(cat.amount)} ({pct}%)</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section D: Investment Capital Recovery Matrix */}
      <div className="p-5 bg-zinc-900/80 border border-zinc-800 rounded-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-white">Investment Capital Recovery & Performance</h3>
            <p className="text-xs text-zinc-400">
              Tracking capital return velocity versus operating profits across ventures
            </p>
          </div>
          <button
            onClick={() => setActiveTab('investments')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <span>Full Register</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-zinc-800/80">
          {investmentMetricsList.map((m) => {
            const recoveryPercent = Math.min(
              100,
              Math.round((m.principalReturned / (m.totalPrincipalInvested || 1)) * 100)
            );
            return (
              <div
                key={m.investment.id}
                onClick={() => {
                  setSelectedInvestmentId(m.investment.id);
                  setActiveTab('investments');
                }}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-800/30 px-2 rounded-xl transition-colors cursor-pointer"
              >
                <div>
                  <h4 className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                    {m.investment.name}
                    <span className="text-[10px] font-mono text-zinc-400">· {m.investment.type.replace('_', ' ')}</span>
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Recovered {formatIndianCurrency(m.principalReturned)} of {formatIndianCurrency(m.totalPrincipalInvested)} initial capital ({recoveryPercent}%)
                  </p>
                </div>

                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Net Gain</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono tabular-nums">
                      {formatIndianCurrency(m.netRealizedGain)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Outstanding</span>
                    <span className="text-xs font-bold text-white font-mono tabular-nums">
                      {formatIndianCurrency(m.outstandingPrincipal)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
