export default function StatusPill({ status }) {
  const normalized = String(status || "Unknown").toLowerCase().replace(/\s+/g, "-");
  return <span className={`status-pill status-${normalized}`}>{status || "Unknown"}</span>;
}
