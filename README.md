# OpKit

Mini-CRM for task management with JWT authentication, REST API, real-time WebSocket updates, and PostgreSQL persistence.

## Stack

| Layer | Technology |
|---|---|
| Backend | NestJS, TypeScript |
| Database | PostgreSQL 17 + Prisma ORM |
| Auth | Passport, JWT, bcrypt |
| Real-time | WebSocket (Socket.IO) + Redis pub/sub |
| Frontend | React 19, TypeScript, Vite |
| Tests | Jest |
| Infra | Docker Compose |

## Quick Start

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Backend
cd backend
npm install
npx prisma migrate deploy
npm run start:dev

# 3. Frontend
cd frontend
npm install
npm run dev
```

- API: `http://localhost:3000`
- Frontend: `http://localhost:5173`

## API

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register with `{ email, password }` |
| `POST` | `/auth/login` | — | Login, returns JWT |

### Tasks (all require `Authorization: Bearer <token>`)

| Method | Path | Description |
|---|---|---|
| `GET` | `/tasks` | List user's tasks |
| `POST` | `/tasks` | Create task `{ title, description? }` |
| `PATCH` | `/tasks/:id` | Update `{ title?, description?, status? }` |
| `DELETE` | `/tasks/:id` | Delete task |

### WebSocket

Connect to `/socket.io` with `{ auth: { token } }`. Events are scoped per user:

- `task.created` — new task created
- `task.updated` — task updated
- `task.deleted` — task deleted

## Project Structure

```
backend/
├── src/
│   ├── auth/          # Auth module (JWT, guards, decorators)
│   ├── user/          # User service (Prisma)
│   ├── task/          # Task CRUD + WebSocket gateway
│   ├── database/      # Prisma client (global)
│   └── redis/         # Redis pub/sub (global)
├── prisma/            # Schema + migrations
└── jest.config.js

frontend/
└── src/
    ├── api/           # HTTP + WebSocket clients
    ├── components/    # LoginPage, TaskForm, TaskList, TaskItem
    ├── socket.ts      # Socket.IO connection
    └── types.ts       # Shared types
```

## Features

- **JWT auth** with 7-day expiry — global guard, opt-out with `@Public()`
- **Kanban board** — drag-free columns for TODO / In Progress / Done
- **Real-time sync** — WebSocket updates via Redis pub/sub across instances
- **Dark theme** — modern dark UI with indigo accent
- **Task ownership** — all operations scoped to authenticated user
- **Validation** — class-validator DTOs, whitelist mode
