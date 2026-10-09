import { useEffect, useState } from "react";
import { Users, BookOpen, ClipboardCheck, TrendingUp, Plus, RefreshCw, Search, AlertTriangle } from "lucide-react";
import { apiFetch } from "../services/api";
import MetricCard from "../components/MetricCard";
import StatusPill from "../components/StatusPill";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function AdminDashboard({ activePage, setActivePage }) {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [records, setRecords] = useState([]);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [rollNumber, setRollNumber] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [className, setClassName] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date().toLocaleDateString("en-CA"));
  const [statuses, setStatuses] = useState({});
  const [search, setSearch] = useState("");

  async function loadData() {
    setError("");
    try {
      const [s, c, a, r] = await Promise.all([
        apiFetch("/students"), apiFetch("/classes"), apiFetch("/attendance"), apiFetch("/reports/attendance")
      ]);
      setStudents(Array.isArray(s) ? s : []);
      setClasses(Array.isArray(c) ? c : []);
      setRecords(Array.isArray(a) ? a : []);
      setReports(Array.isArray(r) ? r : []);
    } catch (err) { setError(err.message); }
  }
  useEffect(() => { loadData(); }, []);

  async function submitStudent(e) {
    e.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      await apiFetch("/students", { method: "POST", body: JSON.stringify({
        roll_number: rollNumber.trim(), name: name.trim(), email: email.trim() || null
      }) });
      setRollNumber(""); setName(""); setEmail(""); setMessage("Student added successfully.");
      await loadData();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function submitClass(e) {
    e.preventDefault(); setLoading(true); setError(""); setMessage("");
    try {
      await apiFetch("/classes", { method: "POST", body: JSON.stringify({
        class_name: className.trim(), subject: subject.trim()
      }) });
      setClassName(""); setSubject(""); setMessage("Class created successfully.");
      await loadData();
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  async function submitAttendance(e) {
    e.preventDefault();
    if (!selectedClass) { setError("Please select a class."); return; }
    if (!students.length) { setError("Add students before marking attendance."); return; }
    setLoading(true); setError(""); setMessage("");
    try {
      for (const student of students) {
        await apiFetch("/attendance", { method: "POST", body: JSON.stringify({
          student_id: student.id, class_id: Number(selectedClass),
          attendance_date: attendanceDate, status: statuses[student.id] || "Present"
        }) });
      }
      setMessage("Attendance saved successfully.");
      await loadData(); setActivePage("history");
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  const present = records.filter(r => r.status === "Present").length;
  const absent = records.filter(r => r.status === "Absent").length;
  const late = records.filter(r => r.status === "Late").length;
  const attendancePct = records.length ? (((present + late) / records.length) * 100).toFixed(1) : "0.0";
  const filteredStudents = students.filter(s => [s.name, s.roll_number, s.email].some(v => String(v || "").toLowerCase().includes(search.toLowerCase())));

  const PIE_COLORS = ["#16a34a", "#ef4444", "#f59e0b"];

const statusChartData = [
  { name: "Present", value: present },
  { name: "Absent", value: absent },
  { name: "Late", value: late },
];

const classChartData = Object.values(
  records.reduce((map, record) => {
    const key = `${record.class_name || "Class"} - ${
      record.subject || ""
    }`;

    if (!map[key]) {
      map[key] = {
        name: key,
        total: 0,
        attended: 0,
      };
    }

    map[key].total += 1;

    if (
      record.status === "Present" ||
      record.status === "Late"
    ) {
      map[key].attended += 1;
    }

    return map;
  }, {})
).map((item) => ({
  name: item.name,
  percentage: Number(
    ((item.attended / item.total) * 100).toFixed(1)
  ),
}));

  return (
    <>
      <section className="page-title-row">
        <div><span className="eyebrow">ADMIN WORKSPACE</span><h1>{({
          dashboard: "Dashboard", students: "Students", classes: "Classes",
          attendance: "Mark Attendance", history: "Attendance History", reports: "Reports & Analytics"
        })[activePage] || "Dashboard"}</h1></div>
        <button className="button-secondary" onClick={loadData}><RefreshCw size={16}/> Refresh data</button>
      </section>
      {message && <p className="alert-message alert-success">{message}</p>}
      {error && <p className="alert-message alert-error"><AlertTriangle size={18}/>{error}</p>}

      {activePage === "dashboard" && <>
        <section className="welcome-panel"><div><span className="eyebrow-light">OVERVIEW</span><h2>Welcome to your dashboard</h2><p>Manage students, classes and attendance in one place.</p>
          <button className="button-light" onClick={() => setActivePage("attendance")}><ClipboardCheck size={17}/> Mark attendance</button></div></section>
        <section className="metric-grid">
          <MetricCard icon={Users} label="Total students" value={students.length} note="Registered students" tone="blue"/>
          <MetricCard icon={BookOpen} label="Total classes" value={classes.length} note="Available classes" tone="purple"/>
          <MetricCard icon={ClipboardCheck} label="Attendance records" value={records.length} note="Saved entries" tone="green"/>
          <MetricCard icon={TrendingUp} label="Overall attendance" value={`${attendancePct}%`} note="Present + late records" tone="orange"/>
        </section>
        
<section className="analytics-grid">
  <div className="card chart-card">
    <div className="card-heading">
      <div>
        <h3>Attendance overview</h3>
        <p>Distribution of attendance records</p>
      </div>
    </div>

    {records.length === 0 ? (
      <div className="empty-state">
        Save attendance records to see the chart.
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={statusChartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="46%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
          >
            {statusChartData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={PIE_COLORS[index]}
              />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )}
  </div>

  <div className="card chart-card">
    <div className="card-heading">
      <div>
        <h3>Class performance</h3>
        <p>Attendance percentage by class</p>
      </div>
    </div>

    {classChartData.length === 0 ? (
      <div className="empty-state">
        Attendance by class will appear after records are saved.
      </div>
    ) : (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={classChartData}
          margin={{
            top: 12,
            right: 10,
            left: 0,
            bottom: 45,
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
          />
          <XAxis
            dataKey="name"
            angle={-15}
            textAnchor="end"
            interval={0}
            height={65}
          />
          <YAxis domain={[0, 100]} />
          <Tooltip
            formatter={(value) => [`${value}%`, "Attendance"]}
          />
          <Bar
            dataKey="percentage"
            name="Attendance"
            fill="#5965e8"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    )}
  </div>
</section>

      </>}

      {activePage === "students" && <section className="content-columns">
        <div className="card form-card"><h3>Add a student</h3><form className="app-form" onSubmit={submitStudent}>
          <label>Roll number *</label><input value={rollNumber} onChange={e => setRollNumber(e.target.value)} required placeholder="e.g. CS001"/>
          <label>Full name *</label><input value={name} onChange={e => setName(e.target.value)} required placeholder="Student name"/>
          <label>Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="student@example.com"/>
          <button className="button-primary" disabled={loading}><Plus size={16}/> Add student</button>
        </form></div>
        <div className="card"><h3>Student directory ({students.length})</h3><div className="search-box"><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students"/></div>
          <div className="table-wrap"><table><thead><tr><th>Name</th><th>Roll number</th><th>Email</th></tr></thead><tbody>
            {filteredStudents.map(s => <tr key={s.id}><td>{s.name}</td><td>{s.roll_number}</td><td>{s.email || "—"}</td></tr>)}
            {!filteredStudents.length && <tr><td colSpan="3">No students found.</td></tr>}
          </tbody></table></div>
        </div>
      </section>}

      {activePage === "classes" && <section className="content-columns">
        <div className="card form-card"><h3>Create a class</h3><form className="app-form" onSubmit={submitClass}>
          <label>Class name *</label><input value={className} onChange={e => setClassName(e.target.value)} required placeholder="e.g. BE Computer Engineering"/>
          <label>Subject *</label><input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="e.g. Web Technology"/>
          <button className="button-primary" disabled={loading}><Plus size={16}/> Create class</button>
        </form></div>
        <div className="card"><h3>Available classes ({classes.length})</h3><div className="table-wrap"><table><thead><tr><th>ID</th><th>Class</th><th>Subject</th></tr></thead><tbody>
          {classes.map(c => <tr key={c.id}><td>{c.id}</td><td>{c.class_name}</td><td>{c.subject}</td></tr>)}
          {!classes.length && <tr><td colSpan="3">No classes created yet.</td></tr>}
        </tbody></table></div></div>
      </section>}

      {activePage === "attendance" && <section className="card">
        <div className="form-toolbar"><div className="field-inline"><label>Class</label><select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} required><option value="">Choose a class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.class_name} — {c.subject}</option>)}</select></div>
          <div className="field-inline"><label>Date</label><input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} required/></div></div>
        <form onSubmit={submitAttendance}><div className="table-wrap"><table><thead><tr><th>Student</th><th>Roll number</th><th>Status</th></tr></thead><tbody>
          {students.map(s => <tr key={s.id}><td>{s.name}</td><td>{s.roll_number}</td><td><select value={statuses[s.id] || "Present"} onChange={e => setStatuses(p => ({...p, [s.id]: e.target.value}))}><option>Present</option><option>Absent</option><option>Late</option></select></td></tr>)}
          {!students.length && <tr><td colSpan="3">Add students first.</td></tr>}
        </tbody></table></div><button className="button-primary" disabled={loading || !students.length || !classes.length}>Save attendance</button></form>
      </section>}

      {activePage === "history" && <section className="card"><h3>Attendance history</h3><div className="table-wrap"><table><thead><tr><th>Date</th><th>Student</th><th>Roll No.</th><th>Class</th><th>Subject</th><th>Status</th></tr></thead><tbody>
        {[...records].reverse().map((r, i) => <tr key={r.id ?? i}><td>{r.attendance_date}</td><td>{r.student_name}</td><td>{r.roll_number}</td><td>{r.class_name}</td><td>{r.subject}</td><td><StatusPill status={r.status}/></td></tr>)}
        {!records.length && <tr><td colSpan="6">No attendance records found.</td></tr>}
      </tbody></table></div></section>}

      {activePage === "reports" && <section className="card"><h3>Student attendance report</h3><div className="table-wrap"><table><thead><tr><th>Student</th><th>Total classes</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance %</th><th>Status</th></tr></thead><tbody>
        {reports.map(r => { const pct = Number(r.attendance_percentage || 0); return <tr key={r.student_id}><td>{r.student_name}</td><td>{r.total_classes}</td><td>{r.present_count}</td><td>{r.absent_count}</td><td>{r.late_count}</td><td>{pct.toFixed(1)}%</td><td><StatusPill status={pct < 75 ? "Below 75%" : "Satisfactory"}/></td></tr>; })}
        {!reports.length && <tr><td colSpan="7">No reports available.</td></tr>}
      </tbody></table></div></section>}
    </>
  );
}
