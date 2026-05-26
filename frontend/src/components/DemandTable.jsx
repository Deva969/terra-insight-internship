import PropTypes from "prop-types";
import StatusBadge from "./StatusBadge";
import { getDemandColor } from "../utils/helpers";

const WEEK_KEYS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

/**
 * DemandTable - main data grid with sortable week columns and summary row.
 */
function DemandTable({ items, sortConfig, onSort, onRowClick, selectedItemId }) {
  // Compute column totals for visible/sorted rows
  const weekTotals = WEEK_KEYS.map((_, idx) =>
    items.reduce((sum, item) => sum + (item.weeks[idx] ?? 0), 0)
  );
  const grandTotal = weekTotals.reduce((s, v) => s + v, 0);

  const renderSortHeader = (weekKey) => {
    const isActive = sortConfig.key === weekKey;
    const indicator = isActive ? (sortConfig.direction === "asc" ? "▲" : "▼") : "⇅";
    return (
      <th
        key={weekKey}
        className={`th-sortable${isActive ? " active-sort" : ""}`}
        onClick={() => onSort(weekKey)}
        aria-sort={isActive ? (sortConfig.direction === "asc" ? "ascending" : "descending") : "none"}
        title={`Sort by ${weekKey}`}
      >
        <div className="th-sort-inner">
          {weekKey}
          <span className="sort-indicator">{indicator}</span>
        </div>
      </th>
    );
  };

  return (
    <div className="demand-table-container">
      <table className="demand-table" aria-label="Weekly Demand Grid">
        <thead>
          <tr>
            <th>Item</th>
            <th>Category</th>
            <th>Region</th>
            <th>Status</th>
            {WEEK_KEYS.map(renderSortHeader)}
            <th style={{ textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 ? (
            <tr>
              <td colSpan={13} className="empty-state">
                <div className="empty-icon">📭</div>
                <div className="empty-title">No items match your filters</div>
                <div className="empty-subtitle">Try adjusting the category or status filters.</div>
              </td>
            </tr>
          ) : (
            items.map((item) => {
              const rowTotal = item.weeks.reduce((s, v) => s + v, 0);
              const isSelected = item.id === selectedItemId;
              return (
                <tr
                  key={item.id}
                  className={isSelected ? "row-selected" : ""}
                  onClick={() => onRowClick(item)}
                  aria-selected={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && onRowClick(item)}
                  role="row"
                >
                  <td className="td-item-name">{item.item}</td>
                  <td className="td-category">{item.category}</td>
                  <td className="td-region">{item.region}</td>
                  <td>
                    <StatusBadge status={item.status} />
                  </td>
                  {item.weeks.map((val, idx) => {
                    const colorClass = getDemandColor(val, item.target);
                    return (
                      <td key={idx} className="td-week">
                        <span className={`week-cell ${colorClass}`}>{val.toLocaleString()}</span>
                      </td>
                    );
                  })}
                  <td className="td-total">{rowTotal.toLocaleString()}</td>
                </tr>
              );
            })
          )}

          {/* Summary row */}
          {items.length > 0 && (
            <tr className="summary-row" aria-label="Summary totals row">
              <td>
                <span className="summary-label">Totals</span>
              </td>
              <td colSpan={3} />
              {weekTotals.map((total, idx) => (
                <td key={idx} className="summary-total-cell">
                  <span className="summary-total-badge">{total.toLocaleString()}</span>
                </td>
              ))}
              <td className="summary-grand-total">{grandTotal.toLocaleString()}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

DemandTable.propTypes = {
  items: PropTypes.array.isRequired,
  sortConfig: PropTypes.shape({
    key: PropTypes.string,
    direction: PropTypes.string,
  }).isRequired,
  onSort: PropTypes.func.isRequired,
  onRowClick: PropTypes.func.isRequired,
  selectedItemId: PropTypes.number,
};

export default DemandTable;
