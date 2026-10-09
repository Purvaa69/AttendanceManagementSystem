
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  BookOpen,
  ClipboardCheck,
  History,
  RefreshCw,
  Users,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

import { apiFetch } from "../services/api";
import MetricCard from "../components/MetricCard";
import StatusPill from "../components/StatusPill";

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [records, setRecords] = useState([]);

  const [selectedClass, setSelectedClass] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );
  const [statuses, setStatuses] = useState({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadTeacherData() {
    setError("");

    try {
      const [classData, studentData, attendanceData] =
        await Promise.all([
          apiFetch("/classes"),
          apiFetch("/students"),
          apiFetch("/attendance"),
        ]);

      setClasses(Array.isArray(classData) ? classData : []);
      setStudents(Array.isArray(studentData) ? studentData : []);
      setRecords(Array.isArray(attendanceData) ? attendanceData : []);
    } catch (err) {
      setError(err.message || "Could not load teacher dashboard.");
    }
  }

  useEffect(() => {
    loadTeacherData();
  }, []);

  const presentCount = records.filter(
    (record) => record.status === "Present"
  ).length;

  const absentCount = records.filter(
    (record) => record.status === "Absent"
  ).length;

  const lateCount = records.filter(
    (record) => record.status === "Late"
  ).length;

  const attendancePercentage = records.length
    ? (
        ((presentCount + lateCount) / records.length) *
        100
      ).toFixed(1)
    : "0.0";

  async function saveAttendance(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!selectedClass) {
      setError("Please select a class.");
      return;
    }

    if (students.length === 0) {
      setError("No students are available.");
      return;
    }

    setLoading(true);

    try {
      for (const student of students) {
        await apiFetch("/attendance", {
          method: "POST",
          body: JSON.stringify({
            student_id: student.id,
            class_id: Number(selectedClass),
            attendance_date: attendanceDate,
            status: statuses[student.id] || "Present",
          }),
        });
      }

      setMessage("Attendance saved successfully.");
      await loadTeacherData();
      setActiveTab("history");
    } catch (err) {
      setError(err.message || "Could not save attendance.");
    } finally {
      setLoading(false);
    }
  }

  const navigation = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "classes", label: "My Classes", icon: BookOpen },
    { id: "attendance", label: "Mark Attendance", icon: ClipboardCheck },
    { id: "history", label: "Attendance History", icon: History },
  ];

  return (
    <div className="teacher-workspace">
      <section className="page-title-row">
        <div>
          <span className="eyebrow">TEACHER WORKSPACE</span>
          <h1>
            {navigation.find((item) => item.id === activeTab)?.label}
          </h1>
          <p>Manage classroom attendance and review records.</p>
        </div>

        <button
          className="button-secondary"
          onClick={loadTeacherData}
          disabled={loading}
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </section>

      <nav className="teacher-tabs" aria-label="Teacher navigation">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={activeTab === id ? "teacher-tab active" : "teacher-tab"}
            onClick={() => {
              setActiveTab(id);
              setError("");
              setMessage("");
            }}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </nav>

      {error && (
        <div className="alert-message alert-error" role="alert">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {message && (
        <div className="alert-message alert-success">
          <CheckCircle2 size={18} />
          {message}
        </div>
      )}

      {activeTab === "dashboard" && (
        <>
          <section className="welcome-panel">
            <div>
              <span className="eyebrow-light">WELCOME, TEACHER</span>
              <h2>Your classroom at a glance</h2>
              <p>
                Review attendance records and keep your classes organized.
              </p>
              <button
                className="button-light"
                onClick={() => setActiveTab("attendance")}
              >
                <ClipboardCheck size={17} />
                Mark attendance
              </button>
            </div>
          </section>

          <section className="metric-grid">
            <MetricCard
              icon={BookOpen}
              label="Classes"
              value={classes.length}
              note="Available classes"
              tone="purple"
            />

            <MetricCard
              icon={Users}
              label="Students"
              value={students.length}
              note="Students in the register"
              tone="blue"
            />

            <MetricCard
              icon={ClipboardCheck}
              label="Attendance records"
              value={records.length}
              note="Saved records"
              tone="green"
            />

            <MetricCard
              icon={CheckCircle2}
              label="Attendance rate"
              value={`${attendancePercentage}%`}
              note="Present and late records"
              tone="orange"
            />
          </section>

          <section className="card">
            <div className="card-heading">
              <div>
                <h3>Attendance summary</h3>
                <p>Distribution across the records returned by the backend</p>
              </div>
            </div>

            <div className="teacher-summary">
              <div>
                <span className="summary-dot present-dot" />
                Present <strong>{presentCount}</strong>
              </div>
              <div>
                <span className="summary-dot absent-dot" />
                Absent <strong>{absentCount}</strong>
              </div>
              <div>
                <span className="summary-dot late-dot" />
                Late <strong>{lateCount}</strong>
              </div>
            </div>

            <button
              className="button-primary"
              onClick={() => setActiveTab("history")}
            >
              View attendance history
            </button>
          </section>
        </>
      )}

      {activeTab === "classes" && (
        <section className="card">
          <div className="card-heading">
            <div>
              <h3>Available classes</h3>
              <p>Class and subject information</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Class ID</th>
                  <th>Class name</th>
                  <th>Subject</th>
                </tr>
              </thead>
              <tbody>
                {classes.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.class_name}</td>
                    <td>{item.subject}</td>
                  </tr>
                ))}

                {classes.length === 0 && (
                  <tr>
                    <td colSpan="3">No classes found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === "attendance" && (
        <section className="card">
          <div className="card-heading">
            <div>
              <h3>Mark attendance</h3>
              <p>Select a class and date, then mark each student's status.</p>
            </div>
          </div>

          <form onSubmit={saveAttendance}>
            <div className="form-toolbar">
              <div className="field-inline">
                <label htmlFor="teacherClass">Class</label>
                <select
                  id="teacherClass"
                  value={selectedClass}
                  onChange={(event) => setSelectedClass(event.target.value)}
                  required
                >
                  <option value="">Choose a class</option>
                  {classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.class_name} — {item.subject}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field-inline">
                <label htmlFor="teacherDate">Date</label>
                <input
                  id="teacherDate"
                  type="date"
                  value={attendanceDate}
                  onChange={(event) => setAttendanceDate(event.target.value)}
                  required
                />
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Roll number</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.roll_number}</td>
                      <td>
                        <select
                          value={statuses[student.id] || "Present"}
                          onChange={(event) =>
                            setStatuses((previous) => ({
                              ...previous,
                              [student.id]: event.target.value,
                            }))
                          }
                        >
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Late">Late</option>
                        </select>
                      </td>
                    </tr>
                  ))}

                  {students.length === 0 && (
                    <tr>
                      <td colSpan="3">No students found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="form-footer">
              <span>{students.length} students</span>
              <button
                className="button-primary"
                type="submit"
                disabled={loading || !students.length || !classes.length}
              >
                {loading ? "Saving..." : "Save attendance"}
              </button>
            </div>
          </form>
        </section>
      )}

      {activeTab === "history" && (
        <section className="card">
          <div className="card-heading">
            <div>
              <h3>Attendance history</h3>
              <p>Review saved attendance records.</p>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Student</th>
                  <th>Roll number</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {[...records].reverse().map((record, index) => (
                  <tr key={record.id ?? index}>
                    <td>{record.attendance_date}</td>
                    <td>{record.student_name}</td>
                    <td>{record.roll_number}</td>
                    <td>{record.class_name || "—"}</td>
                    <td>{record.subject || "—"}</td>
                    <td><StatusPill status={record.status} /></td>
                  </tr>
                ))}

                {records.length === 0 && (
                  <tr>
                    <td colSpan="6">No attendance records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
