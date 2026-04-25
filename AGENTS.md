# AGENTS.md

## Architecture

| Component | Tech |
|-----------|------|
| Frontend | Next.js 16.2.4, React 19.2.4, TypeScript, Tailwind CSS v4 |
| Backend | FastAPI + SQLite (SQLAlchemy ORM), Pydantic |
| Structure | Monorepo with `frontend/` and `backend/` directories |

## Commands

- **Frontend dev**: `cd frontend && npm run dev` (port 3000)
- **Frontend build**: `cd frontend && npm run build`
- **Frontend lint**: `cd frontend && npm run lint`
- **Backend dev**: `cd backend && source venv/bin/activate && python main.py` (port 8000)
- **Backend API docs**: http://localhost:8000/docs

## Developer Workflow

1. **Always read `PROJECT.md`** before writing code — it contains the spec and domain model
2. Next.js 16.x has breaking changes from older versions. Check `node_modules/next/dist/docs/` for details
3. Tailwind CSS v4 uses CSS-first config in CSS files, not `tailwind.config.js`
4. Frontend uses ESLint flat config: `eslint.config.mjs`

## API Endpoints

- `POST /persons/` — create person
- `GET /persons/` — list persons
- `POST /properties/` — create property with loan, cashflow schedules, events
- `GET /properties/` — list all properties
- `GET /properties/{id}` — get single property
- `PUT /properties/{id}` — update property
- `DELETE /properties/{id}` — delete property

## Release 1 Exclusions (do not implement)

- stocks, mutual funds, EPF, PPF, business assets
- taxes and tax optimization
- multi-currency support
- household budgeting beyond property-linked cashflow
- scenario comparison UI beyond a single base projection
- advanced portfolio analytics