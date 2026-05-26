import PropTypes from "prop-types";
import StatusBadge from "./StatusBadge";
import { getDemandColor, getTrackingStatus, getTrackingStatusClass } from "../utils/helpers";

const WEEK_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8"];

/**
 * SparklineChart - SVG-based bar chart for weekly demands.
 */
function SparklineChart({ weeks, target }) {
  const maxVal = Math.max(...weeks, target, 1);
  const barWidth = 28;
  const barGap = 8;
  const chartHeight = 80;
  const totalWidth = weeks.length * (barWidth + barGap) - barGap;

  return (
    <div className="sparkline-wrap">
      <div className="sparkline-title">Weekly Demand Trend</div>
      <svg
        width="100%"
        viewBox={`0 0 ${totalWidth} ${chartHeight + 24}`}
        aria-label="Weekly demand bar chart"
        role="img"
        style={{ overflow: "visible" }}
      >
        {/* Target line */}
        <line
          x1="0"
          y1={(1 - target / maxVal) * chartHeight}
          x2={totalWidth}
          y2={(1 - target / maxVal) * chartHeight}
          stroke="rgba(99,102,241,0.5)"
          strokeWidth="1.5"
          strokeDasharray="4,3"
        />
        <text
          x={totalWidth + 4}
          y={(1 - target / maxVal) * chartHeight + 4}
          fontSize="8"
          fill="rgba(99,102,241,0.7)"
          fontFamily="Inter,sans-serif"
        >
          Target
        </text>

        {weeks.map((val, i) => {
          const colorClass = getDemandColor(val, target);
          const fillMap = {
            green: "url(#barGreen)",
            amber: "url(#barAmber)",
            red: "url(#barRed)",
          };
          const barH = Math.max((val / maxVal) * chartHeight, 2);
          const x = i * (barWidth + barGap);
          const y = chartHeight - barH;

          return (
            <g key={i}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barH}
                rx="4"
                fill={fillMap[colorClass]}
                opacity="0.9"
              />
              <text
                x={x + barWidth / 2}
                y={chartHeight + 14}
                fontSize="9"
                fill="#64748b"
                textAnchor="middle"
                fontFamily="Inter,sans-serif"
                fontWeight="600"
              >
                {WEEK_LABELS[i]}
              </text>
            </g>
          );
        })}

        <defs>
          <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="barAmber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="barRed" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

/**
 * DetailPanel - sliding side panel showing item analytics.
 */
function DetailPanel({ item, onClose }) {
  const total = item.weeks.reduce((s, v) => s + v, 0);
  const avg = (total / item.weeks.length).toFixed(1);
  const zeroWeeks = item.weeks.filter((v) => v === 0).length;
  const trackingStatus = getTrackingStatus(item.weeks, item.target);
  const trackingClass = getTrackingStatusClass(trackingStatus);

  const maxVal = Math.max(...item.weeks, 1);

  return (
    <>
      <div className="panel-overlay" onClick={onClose} aria-hidden="true" />
      <aside
        className="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Details for ${item.item}`}
      >
        {/* Header */}
        <div className="panel-header">
          <div className="panel-title-area">
            <div className="panel-item-name">{item.item}</div>
            <StatusBadge status={item.status} />
          </div>
          <button
            className="panel-close-btn"
            onClick={onClose}
            aria-label="Close detail panel"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="panel-body">
          {/* Item info */}
          <div className="panel-section">
            <div className="panel-section-title">Item Details</div>
            <div className="panel-meta-grid">
              <div className="panel-meta-item">
                <span className="meta-label">Category</span>
                <span className="meta-value">{item.category}</span>
              </div>
              <div className="panel-meta-item">
                <span className="meta-label">Region</span>
                <span className="meta-value">{item.region}</span>
              </div>
              <div className="panel-meta-item">
                <span className="meta-label">Target</span>
                <span className="meta-value target-value">{item.target.toLocaleString()}</span>
              </div>
              <div className="panel-meta-item">
                <span className="meta-label">Status</span>
                <span className="meta-value">{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
              </div>
            </div>
          </div>

          {/* Tracking status */}
          <div className={`tracking-status ${trackingClass}`}>
            <span className="tracking-label">Overall Tracking</span>
            <span className="tracking-value">{trackingStatus}</span>
          </div>

          {/* Key stats */}
          <div className="panel-stats">
            <div className="stat-card">
              <span className="stat-label">Total Demand</span>
              <span className="stat-value">{total.toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Avg / Week</span>
              <span className="stat-value">{Number(avg).toLocaleString()}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Zero-Demand Weeks</span>
              <span className={`stat-value ${zeroWeeks > 0 ? "zero-weeks" : ""}`}>
                {zeroWeeks}
              </span>
            </div>
            <div className="stat-card">
              <span className="stat-label">Target</span>
              <span className="stat-value">{item.target.toLocaleString()}</span>
            </div>
          </div>

          {/* Bar chart */}
          <div className="panel-section">
            <SparklineChart weeks={item.weeks} target={item.target} />
          </div>

          {/* Weekly breakdown */}
          <div className="panel-section">
            <div className="panel-section-title">Weekly Breakdown</div>
            <div className="weekly-list">
              {item.weeks.map((val, idx) => {
                const colorClass = getDemandColor(val, item.target);
                const pct = (val / maxVal) * 100;
                return (
                  <div key={idx} className="weekly-row">
                    <span className="weekly-row-label">{WEEK_LABELS[idx]}</span>
                    <div className="weekly-row-bar-wrap">
                      <div
                        className={`weekly-row-bar ${colorClass}`}
                        style={{ width: `${pct}%` }}
                        role="progressbar"
                        aria-valuenow={val}
                        aria-valuemin={0}
                        aria-valuemax={maxVal}
                      />
                    </div>
                    <span className={`weekly-row-value ${colorClass}`}>{val.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

DetailPanel.propTypes = {
  item: PropTypes.shape({
    item: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    region: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    target: PropTypes.number.isRequired,
    weeks: PropTypes.arrayOf(PropTypes.number).isRequired,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

SparklineChart.propTypes = {
  weeks: PropTypes.arrayOf(PropTypes.number).isRequired,
  target: PropTypes.number.isRequired,
};

export default DetailPanel;
