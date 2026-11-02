# Personal Money Tracker & Investment Intelligence Dashboard

A minimalist, executive-grade financial decision system built for mobile touch ergonomics and responsive desktop clarity. Designed to give complete clarity over net tracked financial position (**My Money**), active investments, bank accounts, physical cash, categorized earnings, operating expenses, split investment repayments (principal return vs. profit/interest), and **borrowed debt liabilities (loans received & debt repayments)**.

---

## 1. Borrowed Money (Loans Received) & Repayment (Debt Returns) System

### Core Accounting Principles
- **Authoritative Liability Tracking**:
  - When you borrow money from a person/lender, liquid funds in your bank or physical cash increase by ₹X, but you owe a corresponding debt liability of ₹X.
  - To prevent artificial wealth inflation, **My Money** is strictly calculated as:
    $$\text{My Money} = (\text{Investments} + \text{Bank Accounts} + \text{Cash in Hand}) - \text{Total Borrowed Debt}$$
  - When returning borrowed money, your bank or cash account decreases by ₹Y and your debt owed to that lender decreases by ₹Y.

### Implemented Capabilities
1. **Dashboard "Borrowed" Metric Box**:
   - Prominently positioned alongside Cash in Hand.
   - Displays total outstanding debt liability with active lender count badge.
   - Clicking opens the **Borrowed Detail Modal** showing:
     - Outstanding balance per lender
     - Total borrowed vs. total repaid per lender
     - Tenure, interest rate, and receiving account
     - 1-click "Repay" and "+ Borrow More Money" shortcuts
2. **Quick Entry Modal `(+)` Actions**:
   - **Mode 5: Borrow Money (Loan Received)**:
     - Amount (₹), Date (selectable calendar), Lender/Person name, Tenure / Duration (quick chips: 1M, 3M, 6M, 1Y), Interest Rate (quick chips: 0%, 6%, 12%, 18% p.a.), Receiving Account (Bank or Cash), TID, and Notes.
   - **Mode 6: Repay Borrowed Money (Debt Return)**:
     - Dropdown populated with existing lenders (showing balance owed).
     - Amount (₹) with quick chips (Full Repayment, 50%, 25%).
     - Repayment Date, Payment Account (Bank or Cash), TID, and Notes.
3. **Expenses View — Borrowed Money Return Column & Ledger**:
   - Sub-tab switcher: **Operating Expenses** vs. **Borrowed Money Returns (Debt Paid)**.
   - Summary KPIs: All-Time Debt Repaid, Remaining Borrowed Debt, Settled Lenders Count.
   - Inline Quick Repayment Form: Select lender from dropdown, enter amount, pick date and account, and click "Save Repayment".
   - Column Table Ledger for Borrowed Returns:
     - Lender / Person Name
     - Date Returned
     - Amount Returned (-₹...)
     - Paid From Account (Bank / Cash)
     - TID / Reference
     - Notes
     - PIN-protected Secure Delete action
4. **Universal Transactions Ledger & Audit Trail**:
   - Filter chips for `Borrowed (Loans Inflow)` and `Debt Returns (Repayments)`.
   - Dedicated badges with lender name, tenure, and interest rate.
   - Search by lender name, TID, date, or notes.
   - PIN-protected hard deletion synced with Firestore and local storage.
