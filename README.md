# OpKit

Мини-CRM для задач с JWT-аутентификацией, CRUD задач, WebSocket-обновлениями и PostgreSQL + Prisma.

## Локальный запуск

1. Поднимите базы:
	```bash
	docker compose up -d
	```
2. Запустите backend:
	```bash
	cd backend
	npm install
	npm run start:dev
	```
3. Запустите frontend:
	```bash
	cd frontend
	npm install
	npm run dev
	```

## Структура

- `backend/` - NestJS API, Prisma, auth, tasks и WebSocket gateway
- `frontend/` - React + TypeScript UI
- `docker-compose.yml` - PostgreSQL и Redis для локального окружения

## Технологии

- React + TypeScript
- NestJS
- PostgreSQL
- Prisma ORM
- Redis
- WebSocket / Socket.IO