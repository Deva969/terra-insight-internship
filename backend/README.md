# Inventory Ledger API

A FastAPI + SQLite backend for warehouse stock-entry management.

---

## Project Structure

```
backend-inventory-ledger/
├── README.md
├── requirements.txt
├── pytest.ini
├── app/
│   ├── __init__.py
│   ├── main.py        ← FastAPI app factory + custom 422 handler
│   ├── database.py    ← SQLite connection + table bootstrap
│   ├── models.py      ← Raw SQL CRUD helpers
│   ├── schemas.py     ← Pydantic v2 request / response models
│   └── routes.py      ← Route handlers
└── tests/
    ├── __init__.py
    └── test_api.py    ← 12 pytest tests (isolated temp DB)
```

---

## Quickstart

### 1. Install dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the API server

```bash
uvicorn app.main:app --reload
```

The API will be available at **http://127.0.0.1:8000**  
Interactive docs: **http://127.0.0.1:8000/docs**

### 3. Run the test suite

```bash
pytest
```

All 12 tests run against a temporary SQLite file; the production database is
never touched.

---

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/entries` | Create a stock entry |
| `GET` | `/entries` | List entries (with optional filters) |
| `GET` | `/summary` | Aggregated totals per category & week |
| `DELETE` | `/entries/{id}` | Delete an entry by ID |

### Query filters — `GET /entries`

| Param | Type | Description |
|-------|------|-------------|
| `warehouse_id` | string | Exact match |
| `category` | string | Exact match |
| `week_number` | int | Exact match |
| `min_quantity` | int | quantity ≥ value |

### Query filters — `GET /summary`

| Param | Type | Description |
|-------|------|-------------|
| `warehouse_id` | string | Limit to warehouse |
| `week_number` | int | Limit to week |

---

## Validation Rules

| Field | Rules |
|-------|-------|
| `warehouse_id` | Required · 2–20 chars · `[A-Z0-9\-]` only |
| `category` | Required · one of: Electronics, Textiles, Chemicals, Furniture, Pharma |
| `item_name` | Required · 1–100 chars |
| `week_number` | Required · integer 1–52 |
| `quantity` | Required · integer ≥ 0 |
| `unit` | Required · one of: units, kg, litres |
| `recorded_by` | Required · 1–80 chars |

---

## Response Shapes

### 201 Created — `POST /entries`
```json
{
  "id": 1,
  "warehouse_id": "WH-01",
  "category": "Electronics",
  "item_name": "USB Hub",
  "week_number": 10,
  "quantity": 150,
  "unit": "units",
  "recorded_by": "Alice",
  "created_at": "2024-01-15T09:30:00Z"
}
```

### 422 Validation Error
```json
{
  "error": "validation_error",
  "detail": [
    { "field": "week_number", "message": "Input should be less than or equal to 52" }
  ]
}
```

### 409 Duplicate Entry
```json
{
  "error": "duplicate_entry",
  "message": "An entry for this item in week 10 already exists."
}
```

### 404 Not Found
```json
{
  "error": "not_found",
  "message": "Entry with id 99 does not exist."
}
```

---

## Database Schema

```sql
CREATE TABLE stock_entries (
    id           INTEGER  PRIMARY KEY AUTOINCREMENT,
    warehouse_id TEXT     NOT NULL,
    category     TEXT     NOT NULL,
    item_name    TEXT     NOT NULL,
    week_number  INTEGER  NOT NULL,
    quantity     INTEGER  NOT NULL,
    unit         TEXT     NOT NULL,
    recorded_by  TEXT     NOT NULL,
    created_at   DATETIME NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE (warehouse_id, category, item_name, week_number)
);
```

---

## Tech Stack

- **FastAPI** 0.111 — async web framework
- **Pydantic v2** — request/response validation
- **SQLite** (stdlib `sqlite3`) — zero-install database
- **Uvicorn** — ASGI server
- **pytest + httpx** — test runner and HTTP client
