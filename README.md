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
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=sms_prices

APP_PORT=3000

PGADMIN_EMAIL=admin@admin.com
PGADMIN_PASSWORD=admin
```

### 3. Запустить PostgreSQL и pgAdmin через Docker Compose

```bash
docker-compose up -d
```

| Сервис    | URL                       | Логин                  | Пароль  |
|-----------|---------------------------|------------------------|---------|
| PostgreSQL| `localhost:5432`          | `postgres`             | `postgres` |
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

## Фронтенд

React + Vite + Tailwind SPA. Проксирует запросы к API через Vite dev-сервер, поэтому CORS не нужен в режиме разработки.

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
