"""
database.py — SQLite connection & table bootstrap.

Uses a module-level sentinel so the same DB file is not recreated on every
import, and the table is only created once per process.
"""
import sqlite3
import threading
from pathlib import Path

# ── configurable DB path ─────────────────────────────────────────────────────
_DEFAULT_DB_PATH = Path(__file__).parent.parent / "inventory.db"

# Thread-local storage for connections (safe for multi-threaded test runners)
_local = threading.local()

# The active DB path – can be overridden by tests via set_db_path()
_db_path: Path = _DEFAULT_DB_PATH
_table_created: bool = False


def set_db_path(path: str | Path) -> None:
    """Override the database file path (used by the test suite)."""
    global _db_path, _table_created
    _db_path = Path(path)
    _table_created = False  # force table re-creation on new path


def get_db_path() -> Path:
    return _db_path


def get_connection() -> sqlite3.Connection:
    """
    Return a thread-local SQLite connection.
    The connection is created (and the schema is ensured) on first access
    per thread.
    """
    conn = getattr(_local, "conn", None)
    # Invalidate cached connection if the path changed
    cached_path = getattr(_local, "conn_path", None)
    if conn is None or cached_path != str(_db_path):
        conn = sqlite3.connect(str(_db_path), check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
        _local.conn = conn
        _local.conn_path = str(_db_path)

    _ensure_table(conn)
    return conn


def _ensure_table(conn: sqlite3.Connection) -> None:
    """Create the stock_entries table if it does not already exist."""
    global _table_created
    if _table_created:
        return

    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS stock_entries (
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
        )
        """
    )
    conn.commit()
    _table_created = True
