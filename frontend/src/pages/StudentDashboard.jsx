import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, RefreshCw, TrendingUp, AlertTriangle } from "lucide-react";
import { apiFetch } from "../services/api";
import MetricCard from "../components/MetricCard";
import StatusPill from "../components/StatusPill";

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAttendance() {
    setLoading(true);
    setError("");
    try {
      setData(await apiFetch("/student/attendance"));
    } catch (err) {
      setError(err.message || "Could not load your attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAttendance(); }, []);

  const records = Array.isArray(data?.records) ? data.records : [];
  const percentage = Number(data?.attendance_percentage ?? 0);
  const attended = Number(data?.attended_classes ?? data?.attended_count ?? data?.present_count ?? 0);
  const total = Number(data?.total_classes ?? data?.total_count ?? records.length);

  return (
    <>
      <section className="page-title-row">
        <div><span className="eyebrow">STUDENT WORKSPACE</span><h1>My Attendance</h1></div>
        <button className="button-secondary" onClick={loadAttendance} disabled={loading}>
          <RefreshCw size={16} /> Refresh
        </button>
      </section>
      {error && <div className="alert-message alert-error"><AlertTriangle size={18} />{error}</div>}
      {loading ? <div className="card">Loading your attendance...</div> : !error && (
        <>
          <section className="welcome-panel">
            <div><span className="eyebrow-light">YOUR PROGRESS</span><h2>Keep showing up!</h2>
              <p>Your attendance summary and class history are shown below.</p>
              <h3>{percentage.toFixed(1)}% attendance</h3>
            </div>
          </section>
          <section className="metric-grid">
            <MetricCard icon={CheckCircle2} label="Attended classes" value={attended} note="Present / attended" tone="green" />
            <MetricCard icon={BookOpen} label="Total class records" value={total} note="Recorded for you" tone="purple" />
            <MetricCard icon={TrendingUp} label="Attendance" value={`${percentage.toFixed(1)}%`} note="Overall percentage" tone="blue" />
          </section>
          <section className="card">
            <div className="card-heading"><div><h3>My attendance history</h3><p>Only records linked to your student account</p></div></div>
            <div className="table-wrap"><table>
              <thead><tr><th>Date</th><th>Class</th><th>Subject</th><th>Status</th></tr></thead>
              <tbody>
                {records.map((r, i) => <tr key={r.id ?? `${r.attendance_date}-${r.class_id}-${i}`}>
                  <td>{r.attendance_date || "—"}</td><td>{r.class_name || "—"}</td>
                  <td>{r.subject || "—"}</td><td><StatusPill status={r.status} /></td>
                </tr>)}
                {!records.length && <tr><td colSpan="4">No attendance records found yet.</td></tr>}
              </tbody>
            </table></div>
          </section>
        </>
      )}
    </>
  );
}
