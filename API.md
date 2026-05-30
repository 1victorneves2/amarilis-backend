# Amarilis Beauté — API Reference

Base URL: `http://localhost:3001`

## Health

### GET /health
```json
{ "status": "ok", "timestamp": "..." }
```

## Authentication

### POST /api/auth/register
```json
// Request
{ "email": "user@example.com", "password": "123456", "name": "User Name" }

// Response 201
{ "user": { "id": "...", "email": "...", "name": "..." }, "token": "<JWT>" }
```

### POST /api/auth/login
```json
// Request
{ "email": "user@example.com", "password": "123456" }

// Response 200
{ "user": { "id": "...", "email": "...", "name": "..." }, "token": "<JWT>" }
```

## Protected Routes
Pass JWT in header: `Authorization: Bearer <token>`
