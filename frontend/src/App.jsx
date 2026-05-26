import { useState, useEffect, useCallback } from "react";
import { demandData as initialData } from "./data/demandData";
import DemandTable from "./components/DemandTable";
import FilterBar from "./components/FilterBar";
import DetailPanel from "./components/DetailPanel";
import AddItemModal from "./components/AddItemModal";
import "./App.css";

const STORAGE_KEY = "demand_grid_items";

function App() {
  const [items, setItems] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (_) {}
    return initialData;
  });

  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilters, setStatusFilters] = useState({
    active: true,
    paused: true,
    discontinued: true,
  });
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setSelectedItem(null);
        setShowAddModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSort = useCallback((weekKey) => {
    setSortConfig((prev) => ({
      key: weekKey,
      direction: prev.key === weekKey && prev.direction === "asc" ? "desc" : "asc",
    }));
  }, []);

  const handleStatusFilterChange = useCallback((status) => {
    setStatusFilters((prev) => ({ ...prev, [status]: !prev[status] }));
  }, []);

  const handleResetFilters = useCallback(() => {
    setCategoryFilter("All");
    setStatusFilters({ active: true, paused: true, discontinued: true });
    setSortConfig({ key: null, direction: "asc" });
  }, []);

  const handleAddItem = useCallback((newItem) => {
    setItems((prev) => {
      const maxId = prev.reduce((m, i) => Math.max(m, i.id), 0);
      return [...prev, { ...newItem, id: maxId + 1 }];
    });
    setShowAddModal(false);
  }, []);

  const filteredItems = items
    .filter((item) => categoryFilter === "All" || item.category === categoryFilter)
    .filter((item) => statusFilters[item.status]);

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const idx = parseInt(sortConfig.key.replace("W", ""), 10) - 1;
    const aVal = a.weeks[idx] ?? 0;
    const bVal = b.weeks[idx] ?? 0;
    return sortConfig.direction === "asc" ? aVal - bVal : bVal - aVal;
  });

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-logo">
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill="url(#grad)" />
                <path d="M8 22L14 12L20 18L26 10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8" cy="22" r="2" fill="white" />
                <circle cx="14" cy="12" r="2" fill="white" />
                <circle cx="20" cy="18" r="2" fill="white" />
                <circle cx="26" cy="10" r="2" fill="white" />
                <defs>
                  <linearGradient id="grad" x1="0" y1="0" x2="32" y2="32">
                    <stop offset="0%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <h1 className="app-title">Weekly Demand Grid</h1>
              <p className="app-subtitle">Interactive Planning Dashboard</p>
            </div>
          </div>
          <button
            className="btn-add-item"
            onClick={() => setShowAddModal(true)}
            aria-label="Add new item"
          >
            <span className="btn-add-icon">+</span>
            Add Item
          </button>
        </div>
      </header>

      <main className="app-main">
        <FilterBar
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          statusFilters={statusFilters}
          onStatusFilterChange={handleStatusFilterChange}
          onResetFilters={handleResetFilters}
          items={items}
        />

        <div className="table-wrapper">
          <DemandTable
            items={sortedItems}
            sortConfig={sortConfig}
            onSort={handleSort}
            onRowClick={setSelectedItem}
            selectedItemId={selectedItem?.id}
          />
        </div>
      </main>

      {selectedItem && (
        <DetailPanel item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}

      {showAddModal && (
        <AddItemModal onClose={() => setShowAddModal(false)} onAdd={handleAddItem} existingItems={items} />
      )}
    </div>
  );
}

export default App;
