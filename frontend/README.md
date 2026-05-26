# Weekly Demand Grid — Interactive Planning Dashboard

A React + Vite single-page application for visualizing and managing weekly demand data across categories and regions.

## ✨ Features

- **Interactive demand table** with color-coded cells (Green / Amber / Red) based on target performance
- **Status badges** — Active, Paused, Discontinued with animated indicators
- **Summary row** — live totals for all visible rows, updates with filtering & sorting
- **Category filter** dropdown with "All" option
- **Status filter** checkboxes — toggle active, paused, discontinued
- **Column sorting** — click any W1–W8 column header to sort ascending/descending (▲ ▼)
- **Reset Filters** button
- **Detail Panel** — slide-in side panel with:
  - Item metadata, target, status
  - Overall tracking status: On Target / Below Target / At Risk
  - Average weekly demand & zero-demand week count
  - SVG bar chart with target line
  - Per-week progress bars colored by performance
- **Add Item Modal** — fully validated form:
  - Inline error messages (no alert dialogs)
  - Duplicate item name detection
  - Positive integer validation for target
  - Non-negative integer validation for weekly values
- **localStorage persistence** — added items survive page refresh
- **Escape key** closes any open panel or modal
- Fully **responsive** layout

## 🗂 Folder Structure

```
terra-insight-dashboard/
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── AddItemModal.jsx   # Form modal with validation
│   │   ├── DetailPanel.jsx    # Side panel + bar chart
│   │   ├── DemandTable.jsx    # Main data grid
│   │   ├── FilterBar.jsx      # Category + status filters
│   │   └── StatusBadge.jsx    # Status pill component
│   ├── data/
│   │   └── demandData.js      # Hardcoded demand dataset
│   ├── utils/
│   │   └── helpers.js         # Color logic, tracking status
│   ├── App.jsx                # Root component, state management
│   ├── App.css                # All styles (dark mode design)
│   ├── main.jsx               # React entry point
│   └── index.css              # Minimal global reset
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- npm v9 or higher

### Installation

```bash
npm install
```

### Running Locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Then preview the production build:

```bash
npm run preview
```

## 🎨 Color Coding Logic

| Color | Condition |
|-------|-----------|
| 🟢 Green | Demand ≥ 90% of target |
| 🟡 Amber | Demand is 50%–89% of target |
| 🔴 Red | Demand < 50% of target or zero |

## 📊 Tracking Status

| Status | Condition |
|--------|-----------|
| ✅ On Target | Avg demand ≥ 90% of target |
| ⚠️ Below Target | Avg demand is 50%–89% of target |
| 🚨 At Risk | Avg demand < 50% of target |

## 🛠 Tech Stack

- **React 18** with hooks
- **Vite** — fast dev server & bundler
- **Vanilla CSS** — custom dark-mode design system
- **PropTypes** — runtime prop validation
- **localStorage** — persistent item storage
- SVG for inline bar charts

## 📦 Dependencies

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "prop-types": "^15.x"
}
```
