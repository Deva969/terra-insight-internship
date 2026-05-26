/**
 * Returns the color class for a weekly demand cell based on target.
 * Green >= 90%, Amber 50%-89%, Red < 50%
 */
export function getDemandColor(value, target) {
  if (!target || target <= 0) return "red";
  const ratio = value / target;
  if (ratio >= 0.9) return "green";
  if (ratio >= 0.5) return "amber";
  return "red";
}

/**
 * Compute the overall tracking status of an item.
 */
export function getTrackingStatus(weeks, target) {
  const avg = weeks.reduce((s, v) => s + v, 0) / weeks.length;
  const ratio = avg / target;
  if (ratio >= 0.9) return "On Target";
  if (ratio >= 0.5) return "Below Target";
  return "At Risk";
}

/**
 * Returns tracking status CSS class key.
 */
export function getTrackingStatusClass(status) {
  if (status === "On Target") return "on-target";
  if (status === "Below Target") return "below-target";
  return "at-risk";
}
