# AGENTS.md

## Architecture

| Component | Tech |
|-----------|------|
| Frontend | Next.js 16.2.4, React 19.2.4, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI + SQLite (SQLAlchemy ORM), Pydantic |
| Structure | Monorepo with `frontend/` and `backend/` directories |

## Commands

- **Frontend dev**: `cd frontend && npm run dev`
- **Frontend build**: `cd frontend && npm run build`
- **Frontend lint**: `cd frontend && npm run lint`
- **Backend dev**: `cd backend && source venv/bin/activate && python main.py` (runs on port 8000)

## First Steps for Agents

1. **Always read `PROJECT.md`** before writing code — it contains the spec and domain model
2. Next.js 16.x has breaking changes from older versions — APIs and file structure differ from training data. Check `node_modules/next/dist/docs/` for details
3. Tailwind CSS v4 uses CSS-first config, not `tailwind.config.js` — styles are in CSS files
4. Frontend uses ESLint flat config: `eslint.config.mjs`

## Domain Model (Release 1)

- **Person** → owner of financial profile
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

## Testing & CI

- No tests configured yet
- No CI/CD pipelines yet
- Establish testing and lint checks after adding significant code

## Database

- SQLite at `backend/financial_monitor.db`
- SQLAlchemy ORM with auto-created tables on backend startup