"""
main.py — FastAPI application factory.

Mounts the router and installs a custom exception handler that converts
Pydantic v2 RequestValidationError into the contract-specified 422 shape:

  {
    "error": "validation_error",
    "detail": [{ "field": "...", "message": "..." }]
  }
"""
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.routes import router

app = FastAPI(
    title="Inventory Ledger API",
    description=(
        "Stock entry management API for warehouse inventory tracking. "
        "Supports creating, listing, summarising, and deleting stock entries."
    ),
    version="1.0.0",
)


# ── custom 422 handler ────────────────────────────────────────────────────────
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """
    Re-format Pydantic v2 validation errors into the agreed contract shape.
    Each error is mapped to {"field": "<loc>", "message": "<msg>"}.
    """
    detail = []
    for error in exc.errors():
        # loc is a tuple like ("body", "week_number") – we want the field name
        loc = error.get("loc", ())
        # Skip the leading "body" / "query" wrapper if present
        field_parts = [str(p) for p in loc if p not in ("body", "query", "path")]
        field = ".".join(field_parts) if field_parts else str(loc)
        detail.append({"field": field, "message": error["msg"]})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"error": "validation_error", "detail": detail},
    )


# ── mount routes ─────────────────────────────────────────────────────────────
app.include_router(router)
