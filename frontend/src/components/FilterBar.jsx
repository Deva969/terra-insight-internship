import PropTypes from "prop-types";
import { CATEGORIES } from "../data/demandData";

const STATUSES = ["active", "paused", "discontinued"];

/**
 * FilterBar - category dropdown, status checkboxes, reset button.
 */
function FilterBar({
  categoryFilter,
  onCategoryChange,
  statusFilters,
  onStatusFilterChange,
  onResetFilters,
  items,
}) {
  const visibleCount = items
    .filter((it) => categoryFilter === "All" || it.category === categoryFilter)
    .filter((it) => statusFilters[it.status]).length;

  return (
    <div className="filter-bar" role="search" aria-label="Filter controls">
      {/* Category filter */}
      <div className="filter-group">
        <span className="filter-label">Category</span>
        <select
          id="category-filter"
          className="filter-select"
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          aria-label="Filter by category"
        >
          <option value="All">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-divider" />

      {/* Status filter */}
      <div className="filter-group">
        <span className="filter-label">Status</span>
        <div className="status-checks" role="group" aria-label="Filter by status">
          {STATUSES.map((status) => (
            <label key={status} className="checkbox-label" htmlFor={`status-${status}`}>
              <input
                type="checkbox"
                id={`status-${status}`}
                checked={statusFilters[status]}
                onChange={() => onStatusFilterChange(status)}
              />
              <span className={`custom-checkbox ${status} ${statusFilters[status] ? "checked" : ""}`}>
                <span className="check-icon">✓</span>
              </span>
              <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="filter-actions">
        <span className="filter-results">
          {visibleCount} of {items.length} items
        </span>
        <button
          id="reset-filters-btn"
          className="btn-reset"
          onClick={onResetFilters}
          aria-label="Reset all filters"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}

FilterBar.propTypes = {
  categoryFilter: PropTypes.string.isRequired,
  onCategoryChange: PropTypes.func.isRequired,
  statusFilters: PropTypes.object.isRequired,
  onStatusFilterChange: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  items: PropTypes.array.isRequired,
};

export default FilterBar;
