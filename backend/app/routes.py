"""
routes.py — all API route handlers.

Each handler pulls a fresh connection from the database module and delegates
business logic to models.py. Validation is done by Pydantic; only duplicate /
not-found errors require manual HTTP responses.
"""
import sqlite3
from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

from app import database, models
from app.schemas import (
    DeleteOut,
    DuplicateErrorOut,
    EntriesListOut,
    NotFoundErrorOut,
    StockEntryCreate,
    StockEntryOut,
    SummaryOut,
    SummaryItem,
)

router = APIRouter()


# ─────────────────────────────────────────────────────────────────────────────
# POST /entries
# ─────────────────────────────────────────────────────────────────────────────
@router.post(
    "/entries",
    status_code=201,
    response_model=StockEntryOut,
    responses={
        409: {"model": DuplicateErrorOut},
    },
    summary="Create a new stock entry",
)
def create_entry(body: StockEntryCreate):
    """
    Create a stock entry.  Returns 201 on success, 409 on duplicate,
    422 on validation failure (handled globally by FastAPI / Pydantic).
    """
    conn = database.get_connection()
    try:
        entry = models.create_entry(
            conn=conn,
            warehouse_id=body.warehouse_id,
            category=body.category,
            item_name=body.item_name,
            week_number=body.week_number,
            quantity=body.quantity,
            unit=body.unit,
            recorded_by=body.recorded_by,
        )
    except sqlite3.IntegrityError:
        return JSONResponse(
            status_code=409,
            content={
                "error": "duplicate_entry",
                "message": (
                    f"An entry for this item in week {body.week_number} already exists."
                ),
            },
        )
    return StockEntryOut(**entry)


# ─────────────────────────────────────────────────────────────────────────────
# GET /entries
# ─────────────────────────────────────────────────────────────────────────────
@router.get(
    "/entries",
    response_model=EntriesListOut,
    summary="List stock entries with optional filters",
)
def list_entries(
    warehouse_id: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    week_number: Optional[int] = Query(default=None),
    min_quantity: Optional[int] = Query(default=None),
):
    conn = database.get_connection()
    entries = models.list_entries(
        conn=conn,
        warehouse_id=warehouse_id,
        category=category,
        week_number=week_number,
        min_quantity=min_quantity,
    )
    return EntriesListOut(
        count=len(entries),
        entries=[StockEntryOut(**e) for e in entries],
    )


# ─────────────────────────────────────────────────────────────────────────────
# GET /summary
# ─────────────────────────────────────────────────────────────────────────────
@router.get(
    "/summary",
    response_model=SummaryOut,
    summary="Aggregated quantity summary per category and week",
)
def get_summary(
    warehouse_id: Optional[str] = Query(default=None),
    week_number: Optional[int] = Query(default=None),
):
    conn = database.get_connection()
    rows = models.get_summary(
        conn=conn,
        warehouse_id=warehouse_id,
        week_number=week_number,
    )
    return SummaryOut(summary=[SummaryItem(**r) for r in rows])


# ─────────────────────────────────────────────────────────────────────────────
# DELETE /entries/{id}
# ─────────────────────────────────────────────────────────────────────────────
@router.delete(
    "/entries/{entry_id}",
    response_model=DeleteOut,
    responses={
        404: {"model": NotFoundErrorOut},
    },
    summary="Delete a stock entry by ID",
)
def delete_entry(entry_id: int):
    conn = database.get_connection()
    deleted = models.delete_entry(conn=conn, entry_id=entry_id)
    if not deleted:
        return JSONResponse(
            status_code=404,
            content={
                "error": "not_found",
                "message": f"Entry with id {entry_id} does not exist.",
            },
        )
    return DeleteOut(deleted=True, id=entry_id)
