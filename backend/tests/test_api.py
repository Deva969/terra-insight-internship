"""
tests/test_api.py
=================
Full pytest suite for the Inventory Ledger API.

Strategy
--------
- A module-scoped temporary SQLite file is created at the start of the
  session and injected into `app.database` via `set_db_path()`.
- The TestClient is constructed AFTER the path override so all routes
  use the test DB.
- Each test that inserts data cleans up after itself (or uses unique keys)
  so tests are independent and order-agnostic.
"""

import tempfile
import os
import pytest
from fastapi.testclient import TestClient

# ── set up isolated test database BEFORE importing the app ────────────────────
@pytest.fixture(scope="session", autouse=True)
def _test_db():
    """
    Create a fresh temporary SQLite file for the entire test session.
    Overrides the production DB path in database.py before the app is used.
    """
    from app import database

    tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
    tmp.close()
    database.set_db_path(tmp.name)
    yield tmp.name
    # Teardown: remove the temp file after all tests finish
    try:
        os.unlink(tmp.name)
    except OSError:
        pass


@pytest.fixture(scope="session")
def client(_test_db):
    """Single TestClient reused across all tests."""
    from app.main import app
    with TestClient(app) as c:
        yield c


# ── reusable payloads ─────────────────────────────────────────────────────────
def valid_payload(**overrides) -> dict:
    base = {
        "warehouse_id": "WH-01",
        "category": "Electronics",
        "item_name": "USB Hub",
        "week_number": 10,
        "quantity": 150,
        "unit": "units",
        "recorded_by": "Alice",
    }
    base.update(overrides)
    return base


# ══════════════════════════════════════════════════════════════════════════════
# T1 — Valid POST returns 201 and correct shape
# ══════════════════════════════════════════════════════════════════════════════
def test_T1_valid_post_returns_201(client):
    payload = valid_payload(item_name="USB Hub T1", week_number=1)
    resp = client.post("/entries", json=payload)

    assert resp.status_code == 201, resp.text

    data = resp.json()
    # Required fields present
    for field in ("id", "warehouse_id", "category", "item_name",
                  "week_number", "quantity", "unit", "recorded_by", "created_at"):
        assert field in data, f"Missing field: {field}"

    assert isinstance(data["id"], int)
    assert data["warehouse_id"] == payload["warehouse_id"]
    assert data["category"] == payload["category"]
    assert data["item_name"] == payload["item_name"]
    assert data["week_number"] == payload["week_number"]
    assert data["quantity"] == payload["quantity"]
    assert data["unit"] == payload["unit"]
    assert data["recorded_by"] == payload["recorded_by"]
    assert isinstance(data["created_at"], str) and len(data["created_at"]) > 0


# ══════════════════════════════════════════════════════════════════════════════
# T2 — Missing required field returns 422
# ══════════════════════════════════════════════════════════════════════════════
def test_T2_missing_required_field_returns_422(client):
    # Send payload without `item_name`
    payload = valid_payload(week_number=2)
    del payload["item_name"]
    resp = client.post("/entries", json=payload)

    assert resp.status_code == 422, resp.text

    data = resp.json()
    assert data["error"] == "validation_error"
    assert "detail" in data
    assert isinstance(data["detail"], list)
    assert len(data["detail"]) >= 1

    fields = [d["field"] for d in data["detail"]]
    assert "item_name" in fields


# ══════════════════════════════════════════════════════════════════════════════
# T3 — Invalid category returns 422
# ══════════════════════════════════════════════════════════════════════════════
def test_T3_invalid_category_returns_422(client):
    payload = valid_payload(category="Weapons", week_number=3)
    resp = client.post("/entries", json=payload)

    assert resp.status_code == 422, resp.text

    data = resp.json()
    assert data["error"] == "validation_error"
    fields = [d["field"] for d in data["detail"]]
    assert "category" in fields


# ══════════════════════════════════════════════════════════════════════════════
# T4 — week_number 0 and 53 return 422
# ══════════════════════════════════════════════════════════════════════════════
def test_T4_week_number_boundaries_return_422(client):
    for bad_week in (0, 53):
        payload = valid_payload(week_number=bad_week)
        resp = client.post("/entries", json=payload)
        assert resp.status_code == 422, f"Expected 422 for week_number={bad_week}, got {resp.status_code}"

        data = resp.json()
        assert data["error"] == "validation_error"
        fields = [d["field"] for d in data["detail"]]
        assert "week_number" in fields, f"week_number not in error detail for week={bad_week}"


# ══════════════════════════════════════════════════════════════════════════════
# T5 — quantity -1 returns 422
# ══════════════════════════════════════════════════════════════════════════════
def test_T5_negative_quantity_returns_422(client):
    payload = valid_payload(quantity=-1, week_number=4)
    resp = client.post("/entries", json=payload)

    assert resp.status_code == 422, resp.text

    data = resp.json()
    assert data["error"] == "validation_error"
    fields = [d["field"] for d in data["detail"]]
    assert "quantity" in fields


# ══════════════════════════════════════════════════════════════════════════════
# T6 — Duplicate entry returns 409
# ══════════════════════════════════════════════════════════════════════════════
def test_T6_duplicate_entry_returns_409(client):
    payload = valid_payload(item_name="Duplicate Item", week_number=5)

    # First insert — must succeed
    r1 = client.post("/entries", json=payload)
    assert r1.status_code == 201, r1.text

    # Second insert with same (warehouse_id, category, item_name, week_number)
    r2 = client.post("/entries", json=payload)
    assert r2.status_code == 409, r2.text

    data = r2.json()
    assert data["error"] == "duplicate_entry"
    assert "message" in data
    assert "5" in data["message"]  # week_number referenced in message


# ══════════════════════════════════════════════════════════════════════════════
# T7 — GET /entries returns count
# ══════════════════════════════════════════════════════════════════════════════
def test_T7_get_entries_returns_count(client):
    resp = client.get("/entries")
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert "count" in data
    assert "entries" in data
    assert isinstance(data["count"], int)
    assert isinstance(data["entries"], list)
    assert data["count"] == len(data["entries"])


# ══════════════════════════════════════════════════════════════════════════════
# T8 — GET /entries?category=Electronics returns only Electronics
# ══════════════════════════════════════════════════════════════════════════════
def test_T8_filter_by_category(client):
    # Seed a non-Electronics entry
    client.post("/entries", json=valid_payload(
        category="Pharma",
        item_name="Paracetamol",
        week_number=6,
        warehouse_id="WH-02",
    ))
    # Seed an Electronics entry
    client.post("/entries", json=valid_payload(
        category="Electronics",
        item_name="Resistor T8",
        week_number=6,
        warehouse_id="WH-02",
    ))

    resp = client.get("/entries", params={"category": "Electronics"})
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert data["count"] > 0
    for entry in data["entries"]:
        assert entry["category"] == "Electronics", (
            f"Non-Electronics entry returned: {entry}"
        )


# ══════════════════════════════════════════════════════════════════════════════
# T9 — GET /entries?min_quantity=500 returns only quantity >= 500
# ══════════════════════════════════════════════════════════════════════════════
def test_T9_filter_by_min_quantity(client):
    # Seed a low-quantity entry
    client.post("/entries", json=valid_payload(
        item_name="Low Stock T9", quantity=10, week_number=7, warehouse_id="WH-03"
    ))
    # Seed a high-quantity entry
    client.post("/entries", json=valid_payload(
        item_name="High Stock T9", quantity=600, week_number=7, warehouse_id="WH-03"
    ))

    resp = client.get("/entries", params={"min_quantity": 500})
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert data["count"] > 0
    for entry in data["entries"]:
        assert entry["quantity"] >= 500, (
            f"Entry with quantity {entry['quantity']} < 500 was returned"
        )


# ══════════════════════════════════════════════════════════════════════════════
# T10 — GET /summary returns correct shape and SUM
# ══════════════════════════════════════════════════════════════════════════════
def test_T10_summary_shape_and_sum(client):
    # Seed two Furniture entries in week 20 under WH-SUMTEST
    client.post("/entries", json=valid_payload(
        warehouse_id="WH-SUMTEST",
        category="Furniture",
        item_name="Table T10",
        week_number=20,
        quantity=100,
    ))
    client.post("/entries", json=valid_payload(
        warehouse_id="WH-SUMTEST",
        category="Furniture",
        item_name="Chair T10",
        week_number=20,
        quantity=200,
    ))

    resp = client.get("/summary", params={"warehouse_id": "WH-SUMTEST", "week_number": 20})
    assert resp.status_code == 200, resp.text

    data = resp.json()
    assert "summary" in data
    assert isinstance(data["summary"], list)
    assert len(data["summary"]) >= 1

    # Locate the Furniture/week-20 bucket
    furniture_bucket = next(
        (s for s in data["summary"]
         if s["category"] == "Furniture" and s["week_number"] == 20),
        None,
    )
    assert furniture_bucket is not None, "Furniture/week-20 bucket missing from summary"

    # Validate shape
    for key in ("category", "week_number", "total_quantity", "entry_count"):
        assert key in furniture_bucket, f"Key '{key}' missing from summary item"

    # Validate aggregation
    assert furniture_bucket["total_quantity"] == 300
    assert furniture_bucket["entry_count"] == 2


# ══════════════════════════════════════════════════════════════════════════════
# T11 — DELETE existing entry returns deleted=true and removes entry
# ══════════════════════════════════════════════════════════════════════════════
def test_T11_delete_existing_entry(client):
    # Create an entry to delete
    create_resp = client.post("/entries", json=valid_payload(
        item_name="Delete Me T11",
        week_number=30,
        warehouse_id="WH-DEL",
    ))
    assert create_resp.status_code == 201, create_resp.text
    entry_id = create_resp.json()["id"]

    # Delete it
    del_resp = client.delete(f"/entries/{entry_id}")
    assert del_resp.status_code == 200, del_resp.text

    del_data = del_resp.json()
    assert del_data["deleted"] is True
    assert del_data["id"] == entry_id

    # Verify the entry is gone via GET /entries
    list_resp = client.get("/entries")
    ids_present = [e["id"] for e in list_resp.json()["entries"]]
    assert entry_id not in ids_present, "Deleted entry still appears in GET /entries"


# ══════════════════════════════════════════════════════════════════════════════
# T12 — DELETE non-existing entry returns 404 not_found
# ══════════════════════════════════════════════════════════════════════════════
def test_T12_delete_nonexistent_entry_returns_404(client):
    resp = client.delete("/entries/999999")
    assert resp.status_code == 404, resp.text

    data = resp.json()
    assert data["error"] == "not_found"
    assert "message" in data
    assert "999999" in data["message"]
