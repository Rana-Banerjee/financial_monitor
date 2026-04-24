# AGENTS.md

## Project Overview
Financial Monitor — personal finance app tracking wealth, net worth, cashflow, and property impact. Release 1 focuses exclusively on **Property** as the only financial object type.

## Key Files
- `PROJECT.md` — product spec and domain model. Always read before writing code.

## Domain Model (Release 1 scope)
- **Person** → owner of the financial profile
- **FinancialObject** → top-level wrapper (Property is the only implementation)
- **Property** → may contribute to assets, liabilities, income, expenses
- **Loan** → linked liability (EMI/pre-EMI/overdraft styles)
- **CashflowSchedule** → recurring or one-time income/expense tied to property
- **Event** → dated events: possession, installment, sale, rent start/stop, loan closure

## Release 1 Exclusions (do not implement)
- stocks, mutual funds, EPF, PPF, business assets
- taxes and tax optimization
- multi-currency support
- household budgeting beyond property-linked cashflow
- scenario comparison UI beyond a single base projection
- advanced portfolio analytics

## Workflow
- Read `PROJECT.md` before writing any code to ensure alignment with the spec
- No CI, tests, or linting configured yet — establish these when code is added