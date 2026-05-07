# SMS Aggregator Prices

Сервис для управления ценами SMS-агрегаторов. Позволяет хранить поставщиков (агрегаторов) и их маршруты с ценами, а также производить поиск и фильтрацию.

## Стек

- **NestJS** — фреймворк для сервера
- **PostgreSQL** — база данных
- **TypeORM** — ORM
- **Swagger** — документация API
- **Docker Compose** — оркестрация PostgreSQL + pgAdmin

---

## Быстрый старт

### 1. Клонировать и установить зависимости

```bash
# Установить зависимости бэкенда
npm install

# Установить зависимости фронтенда
cd client && npm install && cd ..
```

### 2. Настроить переменные окружения

Скопировать `.env.example` в `.env` и заполнить:

```bash
cp .env.example .env
```

```env
DATABASE_URL=
DB_SSL=false

DB_HOST=localhost
DB_PORT=5433
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=sms_prices

APP_PORT=3000
CORS_ORIGIN=http://localhost:5173
TYPEORM_SYNCHRONIZE=true

PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin
```

### 3. Запустить PostgreSQL и pgAdmin через Docker Compose

```bash
docker-compose up -d
```

| Сервис    | URL                       | Логин                  | Пароль  |
|-----------|---------------------------|------------------------|---------|
| PostgreSQL| `localhost:5433`          | `postgres`             | `postgres` |
| pgAdmin   | http://localhost:5050     | `admin@admin.com`      | `admin` |

### 4. Запустить приложение

```bash
# Режим разработки (бэкенд)
npm run start:dev

# Фронтенд (в отдельном терминале)
cd client && npm run dev
```

| Сервис     | URL                            |
|------------|--------------------------------|
| Бэкенд API | http://localhost:3000          |
| Фронтенд   | http://localhost:5173          |
| Swagger    | http://localhost:3000/api/docs |

---

## Деплой на Vercel + Render + Neon

Текущие production URL:

- Frontend: https://sms-manager-alpha.vercel.app
- Backend API: https://sms-aggregator-prices-api.onrender.com
- Swagger: https://sms-aggregator-prices-api.onrender.com/api/docs

### 1. Neon PostgreSQL

1. Создать бесплатный проект в Neon.
2. Скопировать строку подключения PostgreSQL из раздела **Connection string**.
3. Для Render использовать ее как переменную `DATABASE_URL`.

### 2. Render backend

Backend деплоится из корня репозитория. В Render можно создать сервис через `render.yaml` или вручную:

```bash
Build Command: npm ci --include=dev && npm run build
Start Command: npm run start:prod
```

Переменные окружения для Render:

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
DB_SSL=true
TYPEORM_SYNCHRONIZE=true
CORS_ORIGIN=https://your-vercel-project.vercel.app
GROQ_API_KEY=
```

Render сам передает `PORT`, поэтому вручную задавать его не нужно.

### 3. Vercel frontend

Frontend деплоится из папки `client`.

Настройки проекта Vercel:

```bash
Root Directory: client
Build Command: npm run build
Output Directory: dist
```

Переменная окружения для Vercel:

```env
VITE_API_URL=https://your-render-service.onrender.com
```

После первого деплоя Vercel скопируйте домен фронтенда и добавьте его в `CORS_ORIGIN` на Render.

### 4. Автодеплой

Подключите GitHub-репозиторий в Vercel и Render. После `git push` Vercel пересоберет frontend из `client`, а Render пересоберет backend из корня проекта.

---

## Фронтенд

React + Vite + Tailwind SPA. В режиме разработки проксирует запросы к API через Vite dev-сервер. На Vercel использует `VITE_API_URL`.

Экраны:
- **Поставщики** — список агрегаторов, добавление, редактирование, удаление
- **Маршруты** — таблица всех маршрутов с цветными бейджами типа, форма добавления, фильтрация по стране / типу / поставщику / максимальной цене

---

## Swagger документация

После запуска: **http://localhost:3000/api/docs**

---

## API Endpoints

### Поставщики (`/providers`)

| Метод  | URL                | Описание                  |
|--------|--------------------|---------------------------|
| POST   | `/providers`       | Создать поставщика        |
| GET    | `/providers`       | Список всех поставщиков   |
| GET    | `/providers/:id`   | Получить поставщика по ID |
| PATCH  | `/providers/:id`   | Обновить поставщика       |
| DELETE | `/providers/:id`   | Удалить поставщика        |

### Маршруты (`/routes`)

| Метод  | URL                | Описание                  |
|--------|--------------------|---------------------------|
| POST   | `/routes`          | Создать маршрут           |
| GET    | `/routes`          | Список всех маршрутов     |
| GET    | `/routes/search`   | Поиск с фильтрами         |
| GET    | `/routes/:id`      | Получить маршрут по ID    |
| PATCH  | `/routes/:id`      | Обновить маршрут          |
| DELETE | `/routes/:id`      | Удалить маршрут           |

### Поиск маршрутов

```
GET /routes/search?country=япония&routeType=direct&maxPrice=0.05
```

Query-параметры (все опциональные):

| Параметр     | Тип     | Описание                                      |
|--------------|---------|-----------------------------------------------|
| `country`    | string  | Частичное совпадение, регистронезависимо      |
| `routeType`  | enum    | `bypass`, `direct`, `hq`, `sim`               |
| `providerId` | uuid    | Фильтр по ID поставщика                       |
| `maxPrice`   | decimal | Максимальная цена                             |

Результат отсортирован по цене по возрастанию.

---

## Структура проекта

```
src/
├── providers/
│   ├── dto/
│   │   ├── create-provider.dto.ts
│   │   └── update-provider.dto.ts
│   ├── entities/
│   │   └── provider.entity.ts
│   ├── providers.controller.ts
│   ├── providers.service.ts
│   └── providers.module.ts
├── routes/
│   ├── dto/
│   │   ├── create-route.dto.ts
│   │   ├── update-route.dto.ts
│   │   └── search-routes.dto.ts
│   ├── entities/
│   │   └── route.entity.ts
│   ├── routes.controller.ts
│   ├── routes.service.ts
│   └── routes.module.ts
├── app.module.ts
└── main.ts

client/                    ← React фронтенд
├── src/
│   ├── api/               ← API-слой (axios)
│   ├── components/        ← Layout, Spinner, ErrorMessage
│   ├── pages/             ← ProvidersPage, RoutesPage
│   ├── types/             ← TypeScript типы
│   ├── App.tsx
│   └── main.tsx
└── package.json
```

---

## Типы маршрутов (RouteType)

| Значение  | Описание        |
|-----------|-----------------|
| `bypass`  | Обходной        |
| `direct`  | Прямой          |
| `hq`      | Высокого качества|
| `sim`     | SIM-маршрут     |
