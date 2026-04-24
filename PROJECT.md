## Product name

Financial Monitor

## Product goal

Build a financial monitoring app that helps a person understand:

- current wealth
- future net worth
- monthly cashflow
- how property affects both balance sheet and cashflow

The first release starts with one financial object type: **Property**.

## Release 1 scope

### Core user outcomes

- Add a person profile
- Add a property
- Capture purchase, possession, valuation, loan, and cashflow details
- Generate monthly projections for 15 years
- Enter actuals for each month
- Compare projected vs actual outcomes
- Render two graphs:
  1. Assets, liabilities, and net worth over time
  2. Income, expenses, and cash in hand over time

### In scope for property

- residential / commercial / plot / under-construction
- purchase date
- possession date
- sale event
- current valuation and valuation history
- loan / EMI / balance / tenure
- pre-EMI and EMI transitions
- installments that may be self-funded or bank-funded
- rental income
- monthly maintenance / recurring expenses
- property as a primary residence or non-primary residence

### Out of scope for release 1

- stocks, mutual funds, EPF, PPF, business assets
- taxes and tax optimization
- multi-currency support
- household budgeting beyond property-linked cashflow
- scenario comparison UI beyond a single base projection
- advanced portfolio analytics

## Core domain concepts

### Person

The owner of the financial profile.

### FinancialObject

The top-level wrapper for all tracked financial items. In release 1, only property is required.

### Property

A composite financial object that may contribute to:

- assets
- liabilities
- income
- expenses

### Loan

A liability linked to a property. Supports EMI / pre-EMI / overdraft-style repayment.

### CashflowSchedule

A recurring or one-time income or expense item tied to the property.

### Event

A dated future or past event that changes the state of the property:

- possession
- installment
- sale
- rent start
- rent stop
- loan closure
