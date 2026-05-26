"""
schemas.py — Pydantic v2 models for request / response validation.
"""
import re
from typing import Any

from pydantic import BaseModel, Field, field_validator, model_validator

from app.models import ALLOWED_CATEGORIES, ALLOWED_UNITS

# ── regex ─────────────────────────────────────────────────────────────────────
_WAREHOUSE_RE = re.compile(r"^[A-Z0-9\-]{2,20}$")


# ── request body ─────────────────────────────────────────────────────────────
class StockEntryCreate(BaseModel):
    warehouse_id: str = Field(..., description="2–20 chars, A-Z 0-9 hyphens only")
    category: str = Field(..., description="One of the allowed categories")
    item_name: str = Field(..., min_length=1, max_length=100)
    week_number: int = Field(..., ge=1, le=52)
    quantity: int = Field(..., ge=0)
    unit: str = Field(..., description="units | kg | litres")
    recorded_by: str = Field(..., min_length=1, max_length=80)

    @field_validator("warehouse_id")
    @classmethod
    def validate_warehouse_id(cls, v: str) -> str:
        if not _WAREHOUSE_RE.match(v):
            raise ValueError(
                "warehouse_id must be 2–20 characters: uppercase A-Z, digits 0-9, hyphens only"
            )
        return v

    @field_validator("category")
    @classmethod
    def validate_category(cls, v: str) -> str:
        if v not in ALLOWED_CATEGORIES:
            allowed = ", ".join(sorted(ALLOWED_CATEGORIES))
            raise ValueError(f"category must be one of: {allowed}")
        return v

    @field_validator("unit")
    @classmethod
    def validate_unit(cls, v: str) -> str:
        if v not in ALLOWED_UNITS:
            allowed = ", ".join(sorted(ALLOWED_UNITS))
            raise ValueError(f"unit must be one of: {allowed}")
        return v


# ── response shapes ───────────────────────────────────────────────────────────
class StockEntryOut(BaseModel):
    id: int
    warehouse_id: str
    category: str
    item_name: str
    week_number: int
    quantity: int
    unit: str
    recorded_by: str
    created_at: str

    model_config = {"from_attributes": True}


class EntriesListOut(BaseModel):
    count: int
    entries: list[StockEntryOut]


class SummaryItem(BaseModel):
    category: str
    week_number: int
    total_quantity: int
    entry_count: int


class SummaryOut(BaseModel):
    summary: list[SummaryItem]


class DeleteOut(BaseModel):
    deleted: bool
    id: int


# ── error shapes ─────────────────────────────────────────────────────────────
class ValidationErrorDetail(BaseModel):
    field: str
    message: str


class ValidationErrorOut(BaseModel):
    error: str = "validation_error"
    detail: list[ValidationErrorDetail]


class DuplicateErrorOut(BaseModel):
    error: str = "duplicate_entry"
    message: str


class NotFoundErrorOut(BaseModel):
    error: str = "not_found"
    message: str
