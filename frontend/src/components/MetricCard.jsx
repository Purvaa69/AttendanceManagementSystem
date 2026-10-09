import { Users } from "lucide-react";

export default function MetricCard({ icon: Icon = Users, label, value, note, tone = "blue" }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}><Icon size={21} /></div>
      <div className="metric-content">
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
    </div>
  );
}
