import { useEffect, useState } from "react";
import { GraduationCap, LogOut, RefreshCw } from "lucide-react";
import LoginPage from "./pages/LoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import Sidebar from "./components/Sidebar";
import { apiFetch } from "./services/api";
import "./App.css";

export default function App() {
  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("attendanceUser") || "null");
    } catch {
      return null;
    }
  });
  const [activePage, setActivePage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [globalError, setGlobalError] = useState("");

  useEffect(() => {
    if (!authUser) setActivePage("dashboard");
  }, [authUser]);

  function handleLogin(user) {
    setAuthUser(user);
    setActivePage("dashboard");
    setGlobalError("");
  }

  function handleLogout() {
    sessionStorage.removeItem("attendanceToken");
    sessionStorage.removeItem("attendanceUser");
    setAuthUser(null);
    setActivePage("dashboard");
    setGlobalError("");
  }

  async function refreshSessionData() {
    if (!authUser) return;
    try {
      if (authUser.role === "student") {
        await apiFetch("/student/attendance");
      } else {
        await Promise.all([
          apiFetch("/students"),
          apiFetch("/classes"),
          apiFetch("/attendance"),
        ]);
      }
      window.location.reload();
    } catch (error) {
      setGlobalError(error.message || "Could not refresh data.");
    }
  }

  if (!authUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const role = String(authUser.role || "").toLowerCase();

  return (
    <div className="app-shell">
      <Sidebar
        role={role}
        activePage={activePage}
        onNavigate={setActivePage}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={authUser}
        onLogout={handleLogout}
      />

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="menu-button" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              ☰
            </button>
            <div className="breadcrumbs">
              <span>MarkYourAttendance</span>
              <strong>{activePage === "dashboard" ? "Dashboard" : activePage[0].toUpperCase() + activePage.slice(1)}</strong>
            </div>
          </div>
          <div className="topbar-right">
            <span>{authUser.name || authUser.email}</span>
            <button className="icon-button" onClick={refreshSessionData} title="Refresh data">
              <RefreshCw size={17} />
            </button>
            <button className="icon-button" onClick={handleLogout} title="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </header>

        <main className="page-content">
          {globalError && <p className="inline-error" role="alert">{globalError}</p>}
          {role === "admin" && (
            <AdminDashboard activePage={activePage} setActivePage={setActivePage} />
          )}
          {role === "teacher" && (
            <TeacherDashboard activePage={activePage} setActivePage={setActivePage} />
          )}
          {role === "student" && <StudentDashboard />}
          {!["admin", "teacher", "student"].includes(role) && (
            <section className="card">
              <GraduationCap size={30} />
              <h2>Role not recognized</h2>
              <p>Your account role is not supported. Contact the administrator.</p>
            </section>
          )}
          <footer className="page-footer">
            <span>MarkYourAttendance · On the Go</span>
            <span>Attendance management made simpler</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
