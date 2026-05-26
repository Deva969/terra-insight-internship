import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import { CATEGORIES, REGIONS, STATUSES } from "../data/demandData";

const WEEK_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

const INITIAL_FORM = {
  item: "",
  category: CATEGORIES[0],
  region: REGIONS[0],
  target: "",
  status: "active",
  weeks: Array(8).fill(""),
};

/**
 * Validate a single form field. Returns an error string or "".
 */
function validateField(name, value, existingItems) {
  if (name === "item") {
    if (!value.trim()) return "Item name is required.";
    if (existingItems.some((it) => it.item.toLowerCase() === value.trim().toLowerCase()))
      return "An item with this name already exists.";
  }
  if (name === "target") {
    if (value === "" || value === null) return "Target is required.";
    const num = Number(value);
    if (!Number.isInteger(num) || num <= 0) return "Target must be a positive integer.";
  }
  if (name.startsWith("week")) {
    if (value === "" || value === null) return "Value required.";
    const num = Number(value);
    if (!Number.isInteger(num) || num < 0) return "Must be a non-negative integer.";
  }
  return "";
}

/**
 * AddItemModal - form modal to add a new demand item.
 */
function AddItemModal({ onClose, onAdd, existingItems }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = useCallback(
    (field, value) => {
      setForm((prev) => ({ ...prev, [field]: value }));
      // Validate on change if field was touched
      if (touched[field]) {
        const err = validateField(field, value, existingItems);
        setErrors((prev) => ({ ...prev, [field]: err }));
      }
    },
    [touched, existingItems]
  );

  const handleWeekChange = useCallback(
    (idx, value) => {
      setForm((prev) => {
        const weeks = [...prev.weeks];
        weeks[idx] = value;
        return { ...prev, weeks };
      });
      const key = `week${idx}`;
      if (touched[key]) {
        const err = validateField(key, value, existingItems);
        setErrors((prev) => ({ ...prev, [key]: err }));
      }
    },
    [touched, existingItems]
  );

  const handleBlur = useCallback(
    (field, value) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const err = validateField(field, value, existingItems);
      setErrors((prev) => ({ ...prev, [field]: err }));
    },
    [existingItems]
  );

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();

      // Validate all fields
      const newErrors = {};
      newErrors.item = validateField("item", form.item, existingItems);
      newErrors.target = validateField("target", form.target, existingItems);
      form.weeks.forEach((val, idx) => {
        const key = `week${idx}`;
        newErrors[key] = validateField(key, val, existingItems);
      });

      const allTouched = { item: true, target: true };
      form.weeks.forEach((_, idx) => {
        allTouched[`week${idx}`] = true;
      });
      setTouched(allTouched);
      setErrors(newErrors);

      const hasErrors = Object.values(newErrors).some((err) => err !== "");
      if (hasErrors) return;

      onAdd({
        item: form.item.trim(),
        category: form.category,
        region: form.region,
        target: parseInt(form.target, 10),
        status: form.status,
        weeks: form.weeks.map((v) => parseInt(v, 10)),
      });
    },
    [form, existingItems, onAdd]
  );

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Add new item">
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Add New Item</h2>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-grid">
              {/* Item Name */}
              <div className="form-field full-width">
                <label className="form-label" htmlFor="form-item-name">
                  Item Name <span className="required">*</span>
                </label>
                <input
                  id="form-item-name"
                  className={`form-input${errors.item ? " error" : ""}`}
                  type="text"
                  placeholder="e.g. Steel Rods"
                  value={form.item}
                  onChange={(e) => handleChange("item", e.target.value)}
                  onBlur={(e) => handleBlur("item", e.target.value)}
                  autoFocus
                />
                {errors.item && <span className="form-error" role="alert">{errors.item}</span>}
              </div>

              {/* Category */}
              <div className="form-field">
                <label className="form-label" htmlFor="form-category">
                  Category <span className="required">*</span>
                </label>
                <select
                  id="form-category"
                  className="form-select"
                  value={form.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Region */}
              <div className="form-field">
                <label className="form-label" htmlFor="form-region">
                  Region <span className="required">*</span>
                </label>
                <select
                  id="form-region"
                  className="form-select"
                  value={form.region}
                  onChange={(e) => handleChange("region", e.target.value)}
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Target */}
              <div className="form-field">
                <label className="form-label" htmlFor="form-target">
                  Target <span className="required">*</span>
                </label>
                <input
                  id="form-target"
                  className={`form-input${errors.target ? " error" : ""}`}
                  type="number"
                  min="1"
                  step="1"
                  placeholder="e.g. 500"
                  value={form.target}
                  onChange={(e) => handleChange("target", e.target.value)}
                  onBlur={(e) => handleBlur("target", e.target.value)}
                />
                {errors.target && <span className="form-error" role="alert">{errors.target}</span>}
              </div>

              {/* Status */}
              <div className="form-field">
                <label className="form-label" htmlFor="form-status">
                  Status <span className="required">*</span>
                </label>
                <select
                  id="form-status"
                  className="form-select"
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Weekly demand values */}
            <div className="form-section-title">Weekly Demand Values</div>
            <div className="weeks-grid">
              {WEEK_LABELS.map((label, idx) => {
                const key = `week${idx}`;
                return (
                  <div key={label} className="form-field">
                    <label className="form-label" htmlFor={`form-${key}`}>
                      {label} <span className="required">*</span>
                    </label>
                    <input
                      id={`form-${key}`}
                      className={`form-input${errors[key] ? " error" : ""}`}
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={form.weeks[idx]}
                      onChange={(e) => handleWeekChange(idx, e.target.value)}
                      onBlur={(e) => {
                        setTouched((prev) => ({ ...prev, [key]: true }));
                        const err = validateField(key, e.target.value, existingItems);
                        setErrors((prev) => ({ ...prev, [key]: err }));
                      }}
                    />
                    {errors[key] && (
                      <span className="form-error" role="alert">{errors[key]}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" id="submit-add-item">
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

AddItemModal.propTypes = {
  onClose: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  existingItems: PropTypes.array.isRequired,
};

export default AddItemModal;
