# Amarilis Beauté — Backend API

Node.js/Express + PostgreSQL + Prisma + TypeScript

## Setup

```bash
npm install
# Configure .env (copy from .env.example)
npx prisma migrate dev
npm run dev
```

Server starts at http://localhost:3001

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Run compiled build |
