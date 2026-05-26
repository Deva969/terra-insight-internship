"""
models.py — raw SQL helpers (no ORM).

Each function receives a sqlite3.Connection so it can participate in
transactions orchestrated by the caller.
"""
import sqlite3
from datetime import datetime, timezone
from typing import Any


# ── constants ─────────────────────────────────────────────────────────────────
ALLOWED_CATEGORIES: set[str] = {
    "Electronics",
    "Textiles",
    "Chemicals",
    "Furniture",
    "Pharma",
}

ALLOWED_UNITS: set[str] = {"units", "kg", "litres"}


# ── helpers ───────────────────────────────────────────────────────────────────
def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    """Convert a sqlite3.Row to a plain dict."""
    return dict(row)


# ── CRUD ──────────────────────────────────────────────────────────────────────
def create_entry(
    conn: sqlite3.Connection,
    warehouse_id: str,
    category: str,
    item_name: str,
    week_number: int,
    quantity: int,
    unit: str,
    recorded_by: str,
) -> dict[str, Any]:
    """
    Insert a new stock entry and return the full row.
    Raises sqlite3.IntegrityError on duplicate (warehouse_id, category,
    item_name, week_number).
    """
    created_at = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    cursor = conn.execute(
        """
        INSERT INTO stock_entries
            (warehouse_id, category, item_name, week_number,
             quantity, unit, recorded_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (warehouse_id, category, item_name, week_number,
         quantity, unit, recorded_by, created_at),
    )
    conn.commit()
    return get_entry_by_id(conn, cursor.lastrowid)


def get_entry_by_id(
    conn: sqlite3.Connection, entry_id: int
) -> dict[str, Any] | None:
    row = conn.execute(
        "SELECT * FROM stock_entries WHERE id = ?", (entry_id,)
    ).fetchone()
    return _row_to_dict(row) if row else None


def list_entries(
    conn: sqlite3.Connection,
    warehouse_id: str | None = None,
    category: str | None = None,
    week_number: int | None = None,
    min_quantity: int | None = None,
) -> list[dict[str, Any]]:
    """Return entries matching all provided filters (AND logic)."""
    sql = "SELECT * FROM stock_entries WHERE 1=1"
    params: list[Any] = []

    if warehouse_id is not None:
        sql += " AND warehouse_id = ?"
        params.append(warehouse_id)
    if category is not None:
        sql += " AND category = ?"
        params.append(category)
    if week_number is not None:
        sql += " AND week_number = ?"
        params.append(week_number)
    if min_quantity is not None:
        sql += " AND quantity >= ?"
        params.append(min_quantity)

    sql += " ORDER BY id ASC"
    rows = conn.execute(sql, params).fetchall()
    return [_row_to_dict(r) for r in rows]


def get_summary(
    conn: sqlite3.Connection,
    warehouse_id: str | None = None,
    week_number: int | None = None,
) -> list[dict[str, Any]]:
    """
    Aggregate total_quantity and entry_count per (category, week_number).
    Sorted by week_number ASC, then category ASC.
    """
    sql = """
        SELECT
            category,
            week_number,
            SUM(quantity)  AS total_quantity,
            COUNT(*)       AS entry_count
        FROM stock_entries
        WHERE 1=1
    """
    params: list[Any] = []

    if warehouse_id is not None:
        sql += " AND warehouse_id = ?"
        params.append(warehouse_id)
    if week_number is not None:
        sql += " AND week_number = ?"
        params.append(week_number)

    sql += " GROUP BY category, week_number ORDER BY week_number ASC, category ASC"
    rows = conn.execute(sql, params).fetchall()
    return [_row_to_dict(r) for r in rows]


def delete_entry(conn: sqlite3.Connection, entry_id: int) -> bool:
    """
    Delete entry by id. Returns True if a row was deleted, False if not found.
    """
    cursor = conn.execute(
        "DELETE FROM stock_entries WHERE id = ?", (entry_id,)
    )
    conn.commit()
    return cursor.rowcount > 0
