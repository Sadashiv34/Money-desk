# Personal Money Tracker & Investment Intelligence Dashboard

A minimalist, executive-grade financial decision system built for mobile touch ergonomics and responsive desktop clarity. Designed to give complete clarity over net tracked financial position (**My Money**), active investments (rental bikes, software equipment, business equity), bank accounts, physical cash, categorized earnings, operating expenses, and split investment repayments (principal return vs. profit/interest).

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were clarified and confirmed in Phase 1:

- **Confirmed Decision 1 (Initial Data Experience)**: The application will boot pre-seeded with realistic rental and side-business sample data (e.g., Bike Rental Asset, Software Client Contracts, Business Bank Account, Cash in Hand, and historical split repayments). A one-click "Reset / Start Empty" and "Re-seed Demo Data" option will be provided in Settings.
- **Confirmed Decision 2 (Mobile Navigation Architecture)**: Built around an ergonomic, fixed bottom tab navigation bar (`Dashboard`, `Earnings`, `Investments`, `Expenses`, `Insights`) anchored by a prominent central elevated plus (`+`) quick-action button that triggers the quick transaction modal. On desktop viewports, it seamlessly adapts to a clean top navigation bar with quick-add trigger.
- **Confirmed Decision 3 (PWA & Home-Screen Quick-Entry Experience)**: Built with full Progressive Web App (PWA) standards (Web Manifest, service worker, standalone display, Apple touch icon, and in-app install banner with iOS Safari instructions) accompanied by a dedicated ultra-fast Quick-Entry modal mode (`/quick-entry` or quick trigger) remembering recent choices for 3-tap logging.

---

## 1. Overview & Core Concept

- **What It Does**: Replaces complex spreadsheets with a frictionless, double-entry inspired personal financial operating system. Tracks active capital investments, loan advances, and asset purchases separately from operating expenses; distinguishes return of capital from genuine profit; tracks multiple bank accounts and cash in hand; and delivers decision-oriented intelligence.
- **Target Audience & Persona**: Operators running rental assets (bikes, equipment), freelance/software ventures, capital lenders, and side businesses who need immediate visibility into outstanding capital and true net cash flow without accounting bloat.
- **Key Value**: Accurate financial position (**My Money**) computed strictly from authoritative transaction records:
  $$\text{My Money} = \text{Outstanding Investment Principal} + \text{Tracked Bank Balances} + \text{Cash in Hand}$$

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Dashboard & Summary Review**:
   - The user opens the dashboard and immediately sees the primary **My Money** hero card showing total tracked net position with an expandable component breakdown (`Outstanding Principal + Bank + Cash`).
   - Beneath it, a 2x2 grid of primary metric cards: **Investments** (active principal), **In Bank** (aggregate of tracked bank accounts), **In Cash** (physical cash on hand), and the period totals for **Earnings** and **Expenses**.
   - Tap any card to navigate directly into its filtered detail ledger.
2. **3-Option Quick Action (+) Menu**:
   - Tapping the prominent central `+` button reveals a clean bottom sheet with 3 primary options:
     1. **Add Earnings** (Amount, Source dropdown, Date, Bank/Cash destination, Notes)
     2. **Add Expense** (Amount, Category dropdown with "+ New Category" inline, Date, Payment Source, Optional Business, Notes)
     3. **Add Investment** (Name, Type, Initial Principal, Date, Funding Source, Purpose, Expected Return Model)
   - In addition, an accessible shortcut: **Record Investment Return** (split principal return vs. interest/profit with mathematical validation).
3. **Investment Ledger & Performance Details**:
   - Lists active investments with live computed metrics: Initial Principal, Principal Returned, Outstanding Principal, Total Income Received, Net Realized Gain, and Status (`Active`, `Partially Returned`, `Fully Returned`).
   - Clicking an investment reveals its full audit trail, duration, monthly yield, direct expenses, and an action to "Record Return".
4. **Income Source & Expense Category Management**:
   - Earnings and Expense screens include inline "Manage Sources" and "Manage Categories" allowing instant creation, renaming, and deactivation without breaking historical transactions.
5. **Insights & Intelligence Engine**:
   - Period selector (This Month, Last Month, Last 3 Months, Last 6 Months, Financial Year, Custom Range).
   - Generates plain-English decision takeaways: top-performing business, rental net yield, unrepaid loans, cash vs. bank velocity.

### Visual Identity & Theme
- **Aesthetic Direction**: Minimalist, executive charcoal dark theme (`bg-zinc-950` canvas, `bg-zinc-900/80` structural cards, `border-zinc-800/80` hairline dividers).
- **Typography & Formatting**: Clean sans typography (`Plus Jakarta Sans` display, `DM Sans` body) with `font-mono tabular-nums` for all numbers. Indian numbering system formatted with `₹` currency symbol (e.g., `₹1,25,000`).
- **Ergonomics & Anti-Slop Discipline**:
  - Touch targets $\ge 44 \times 44\text{px}$ for one-handed thumb usage.
  - Zero pill badges on static metadata (clean unboxed text with `·` separators).
  - No decorative pulsing dots or pseudo-code comments.
  - 60% neutral dark zinc, 30% structural surfaces, 10% restrained emerald/amber accents for inflows and outflows.
  - Fixed mobile top bar + bottom tab bar staying within the $\le 15\%$ viewport height limit.

---

## 3. Key Product Decisions & Trade-Offs

- **Authoritative Balance Calculation vs. Cached State**:
  - *Chosen Approach*: Account balances and investment principals are dynamically derived from the immutable ledger of transactions starting from opening balances.
  - *Why*: Eliminates out-of-sync drift, ensures editing or deleting any historical transaction automatically ripples through all reports and dashboards with 100% mathematical integrity.
- **Investment Return Split Logic**:
  - *Chosen Approach*: Single transaction record storing `amountReceived`, `principalReturned`, and `interestOrProfitReceived`, validating that $\text{amountReceived} = \text{principalReturned} + \text{interestOrProfitReceived}$.
  - *Why*: Guarantees receiving account is debited once, cash is not double-counted, principal is reduced correctly, and earnings only count the income portion.
- **Client-Side Persistence & Reliability**:
  - *Chosen Approach*: Robust browser `localStorage` engine with JSON export/import backup, schema versioning, and zero-loss offline PWA caching.
  - *Why*: Immediate sub-millisecond response time, complete privacy, works seamlessly offline, and lets users export their complete financial database anytime.
- **Internal vs. External Account Transfers**:
  - Internal transfer (Bank A to Bank B, or Bank to Cash): Balances shift, My Money unchanged, Earnings/Expenses unchanged.
  - External transfer (Tracked Bank to Untracked Personal Account): Tracked balance decreases, My Money decreases, but classified as Owner Withdrawal / External Transfer, NOT as a business expense.

---

## 4. Technical Architecture & Data Strategy

### System Architecture & Navigation Flow

```
┌────────────────────────────────────────────────────────────────────────┐
│                        App Navigation Shell                            │
│  [Top Mobile Bar: Title / Period / PWA Install]                       │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌───────────────────────┐  ┌───────────────────────┐                  │
│  │    Dashboard View     │  │     Earnings View     │                  │
│  │ - My Money Formula    │  │ - Period Total        │                  │
│  │ - 4 Balance Cards     │  │ - Source Breakdown    │                  │
│  │ - Recent Activity     │  │ - Manage Sources      │                  │
│  └───────────────────────┘  └───────────────────────┘                  │
│  ┌───────────────────────┐  ┌───────────────────────┐                  │
│  │    Expenses View      │  │   Investments View    │                  │
│  │ - Category Ledger     │  │ - Investment Register │                  │
│  │ - Filter by Account   │  │ - Performance Metrics │                  │
│  │ - Manage Categories   │  │ - Investment Detail   │                  │
│  └───────────────────────┘  └───────────────────────┘                  │
│  ┌───────────────────────┐  ┌───────────────────────┐                  │
│  │     Insights View     │  │   Transactions View   │                  │
│  │ - Cash Flow Analysis  │  │ - Universal Ledger    │                  │
│  │ - Business Rank       │  │ - Edit / Delete Modal │                  │
│  │ - Decision Summaries  │  │ - Search & Filters    │                  │
│  └───────────────────────┘  └───────────────────────┘                  │
│                                                                        │
├────────────────────────────────────────────────────────────────────────┤
│  [Fixed Bottom Bar: Tabs + Central Elevated (+) Quick Entry Button]    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Quick Entry Sheet: [Add Earnings] [Add Expense] [Add Investment] │  │
│  │                    [Record Investment Return (Split)]            │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Authoritative Data Model
- **Account**: `id`, `name`, `type` (`'bank'` | `'cash'`), `openingBalance` (integer paise/cents to eliminate floating point issues), `openingDate`, `isActive`.
- **IncomeSource**: `id`, `name`, `category`, `associatedBusiness`, `isActive`.
- **ExpenseCategory**: `id`, `name`, `isActive`.
- **Investment**: `id`, `name`, `type` (`'rental_asset'` | `'business'` | `'loan'` | `'equipment'` | `'other'`), `initialPrincipal`, `date`, `fundingAccountId`, `purpose`, `expectedReturnMethod`, `expectedRateOrProfit`, `status` (`'active'` | `'partially_returned'` | `'fully_returned'` | `'closed'`).
- **Transaction**: `id`, `date`, `type` (`'income'` | `'expense'` | `'investment_out'` | `'investment_return'` | `'transfer_internal'` | `'transfer_external'`), `amount`, `accountId`, `toAccountId` (for transfers), `sourceId`, `categoryId`, `investmentId`, `principalReturned`, `interestOrProfitReceived`, `notes`, `createdAt`, `updatedAt`.

### Accounting Verification Test Suite
The app will include a built-in automated test suite accessible from Settings to verify all 10 required prompt scenarios:
1. **New Investment**: ₹1,00,000 bank $\to$ ₹20,000 investment $\implies$ Bank ₹80,000, Investments ₹20,000, My Money ₹1,00,000.
2. **Principal + Interest Repayment**: ₹500 receipt (₹300 principal + ₹200 interest) $\implies$ Principal reduces by ₹300, Bank +₹500, Earnings +₹200, My Money +₹200.
3. **Investment Fully Repaid**: ₹300 remaining principal $\to$ ₹500 received (₹300 principal + ₹200 interest) $\implies$ Principal ₹0, status Fully Returned, Earnings +₹200.
4. **Expense in Cash**: ₹2,000 cash $\to$ ₹500 expense $\implies$ Cash ₹1,500, Expenses +₹500, My Money −₹500.
5. **Internal Transfer**: ₹10,000 Bank A $\to$ Bank B $\implies$ My Money, Earnings, Expenses all unchanged.
6. **External Transfer**: ₹5,000 Bank $\to$ Untracked Personal $\implies$ Bank −₹5,000, My Money −₹5,000, Expenses unchanged.
7. **Edit Saved Transaction**: ₹500 expense edited to ₹400 $\implies$ Account balance and expenses adjust by ₹100.
8. **Prevent Invalid Principal Repayment**: Rejects repayment exceeding outstanding principal.
9. **Opening Balance Handling**: Opening balance does not pollute period earnings.
10. **Duplicate Prevention**: Idempotency and atomic saves prevent double counting.
