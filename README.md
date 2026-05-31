# Amarilis Beauté — Backend API

Node.js/Express + PostgreSQL + Prisma + TypeScript

## Setup

```bash
npm install
npx prisma generate
# Configure .env (copy from .env.example)
npm run dev
```

Server starts at http://localhost:3001

## Database

PostgreSQL + Prisma ORM. Connection string configured via `DATABASE_URL` in `.env`.

To apply schema:
```bash
npx prisma migrate dev
```

## Seed

```bash
npm run seed               # categories + products
npm run seed:categories    # categories only
npm run seed:products      # products only (requires categories)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled build |
| `npm run seed` | Seed database with sample data |

## API

See [API.md](./API.md) for full endpoint documentation.

### Quick reference

```
GET  /health
POST /api/auth/register
POST /api/auth/login

GET    /api/categories
GET    /api/categories/:id
POST   /api/categories        (admin)
PUT    /api/categories/:id    (admin)
DELETE /api/categories/:id    (admin)

GET    /api/products
GET    /api/products/search/:query
GET    /api/products/:id
POST   /api/products          (admin)
PUT    /api/products/:id      (admin)
DELETE /api/products/:id      (admin)
```
