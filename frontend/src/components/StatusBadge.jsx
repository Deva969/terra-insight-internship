import PropTypes from "prop-types";

/**
 * StatusBadge - renders a colored pill for item status.
 */
function StatusBadge({ status }) {
  return (
    <span className={`status-badge ${status}`}>
      <span className="badge-dot" />
      {status}
    </span>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.oneOf(["active", "paused", "discontinued"]).isRequired,
};

export default StatusBadge;
