# Amarilis Beauté — API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication
All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

Obtain a token via `POST /api/auth/login`.

---

## Health

### GET /health
Returns server status.

**Response 200**
```json
{ "status": "ok", "timestamp": "2026-05-30T23:00:00.000Z" }
```

---

## Auth

### POST /api/auth/register
Create a new customer account.

**Body**
```json
{ "email": "user@example.com", "password": "secret", "name": "Ana Lima" }
```

**Response 201**
```json
{
  "user": { "id": "cm...", "email": "user@example.com", "name": "Ana Lima" },
  "token": "<jwt>"
}
```

---

### POST /api/auth/login
Authenticate and receive a JWT.

**Body**
```json
{ "email": "user@example.com", "password": "secret" }
```

**Response 200**
```json
{
  "user": { "id": "cm...", "email": "user@example.com", "name": "Ana Lima" },
  "token": "<jwt>"
}
```

---

## Categories

### GET /api/categories
List all categories ordered by name.

**Response 200**
```json
[
  {
    "id": "cm...",
    "name": "Maquiagem",
    "slug": "maquiagem",
    "description": "Base, batom, sombra...",
    "createdAt": "2026-05-30T23:00:00.000Z",
    "_count": { "products": 5 }
  }
]
```

---

### GET /api/categories/:id
Get a single category with its active products.

**Response 200**
```json
{
  "id": "cm...",
  "name": "Maquiagem",
  "slug": "maquiagem",
  "description": "...",
  "createdAt": "...",
  "products": [
    { "id": "cm...", "name": "Base Líquida FPS 30", "price": 99.90, "stock": 45 }
  ]
}
```

**Response 404** `{ "error": "Category not found" }`

---

### POST /api/categories `ADMIN`
Create a new category.

**Headers:** `Authorization: Bearer <admin_token>`

**Body**
```json
{ "name": "Acessórios", "slug": "acessorios", "description": "Escovas, pincéis..." }
```

**Response 201** — created category object.

---

### PUT /api/categories/:id `ADMIN`
Update name or description.

**Headers:** `Authorization: Bearer <admin_token>`

**Body** *(all optional)*
```json
{ "name": "Acessórios & Pincéis", "description": "Nova descrição" }
```

**Response 200** — updated category object.

---

### DELETE /api/categories/:id `ADMIN`
Remove a category.

**Headers:** `Authorization: Bearer <admin_token>`

**Response 200** `{ "success": true }`

---

## Products

### GET /api/products
List products with pagination and filtering.

**Query params**

| Param | Default | Description |
|-------|---------|-------------|
| `category` | — | Filter by category `slug` |
| `skip` | `0` | Offset for pagination |
| `take` | `20` | Page size (max 100) |
| `sort` | `name` | `name` \| `price_asc` \| `price_desc` \| `newest` |

**Example** `GET /api/products?category=maquiagem&skip=0&take=10&sort=price_asc`

**Response 200**
```json
{
  "data": [
    {
      "id": "cm...",
      "name": "Base Líquida FPS 30",
      "slug": "base-liquida-fps30",
      "price": 99.90,
      "stock": 45,
      "active": true,
      "images": [],
      "category": { "id": "cm...", "name": "Maquiagem", "slug": "maquiagem" }
    }
  ],
  "total": 5,
  "skip": 0,
  "take": 10
}
```

---

### GET /api/products/search/:query
Full-text search across name, description and category name.

**Example** `GET /api/products/search/maquiagem`

**Response 200** — array of matching products.

---

### GET /api/products/:id
Get a single product by ID.

**Response 200** — product with category.  
**Response 404** `{ "error": "Product not found" }`

---

### POST /api/products `ADMIN`
Create a new product.

**Headers:** `Authorization: Bearer <admin_token>`

**Body**
```json
{
  "name": "Gloss Labial Rosé",
  "slug": "gloss-labial-rose",
  "description": "Gloss hidratante com brilho natural",
  "price": 49.90,
  "stock": 80,
  "categoryId": "cm...",
  "images": []
}
```

**Response 201** — created product with category.

---

### PUT /api/products/:id `ADMIN`
Update product fields (all optional).

**Headers:** `Authorization: Bearer <admin_token>`

**Body** *(partial)* `{ "price": 44.90, "stock": 60, "active": true }`

**Response 200** — updated product with category.

---

### DELETE /api/products/:id `ADMIN`
Remove a product.

**Headers:** `Authorization: Bearer <admin_token>`

**Response 200** `{ "success": true }`

---

## Error responses

| Status | Meaning |
|--------|---------|
| 400 | Bad request — missing or invalid fields |
| 401 | Unauthorized — missing or invalid JWT |
| 403 | Forbidden — admin role required |
| 404 | Resource not found |
| 500 | Internal server error |
