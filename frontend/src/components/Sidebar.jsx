import {
  LayoutDashboard, Users, BookOpen, ClipboardCheck, History,
  ChartNoAxesCombined, GraduationCap, X, LogOut, ChevronRight
} from "lucide-react";

const itemsByRole = {
  admin: [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["students", "Students", Users],
    ["classes", "Classes", BookOpen],
    ["attendance", "Mark Attendance", ClipboardCheck],
    ["history", "Attendance History", History],
    ["reports", "Reports & Analytics", ChartNoAxesCombined],
  ],
  teacher: [
    ["dashboard", "Dashboard", LayoutDashboard],
    ["classes", "Classes", BookOpen],
    ["attendance", "Mark Attendance", ClipboardCheck],
    ["history", "Attendance History", History],
    ["reports", "Reports & Analytics", ChartNoAxesCombined],
  ],
  student: [["dashboard", "My Attendance", LayoutDashboard]],
};

export default function Sidebar({ role, activePage, onNavigate, open, onClose, user, onLogout }) {
  const items = itemsByRole[role] || [];
  return (
    <>
      {open && <button className="mobile-backdrop" aria-label="Close menu" onClick={onClose} />}
      <aside className={`sidebar ${open ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><GraduationCap size={25} /></div>
          <div><strong className="brand-name">markyourattendance</strong><span>ON THE GO</span></div>
          <button className="sidebar-close" aria-label="Close menu" onClick={onClose}><X size={20} /></button>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {items.map(([id, label, Icon]) => (
            <button key={id} className={`nav-item ${activePage === id ? "nav-active" : ""}`}
              onClick={() => { onNavigate(id); onClose(); }}>
              <Icon size={19} /><span>{label}</span>
              {activePage === id && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {role !== "student" && (
            <div className="sidebar-help">
              <div className="help-icon"><GraduationCap size={19} /></div>
              <strong>Keep attendance on track</strong>
              <p>Review attendance records regularly.</p>
              {items.some(([id]) => id === "reports") && (
                <button onClick={() => { onNavigate("reports"); onClose(); }}>
                  View reports <ChevronRight size={15} />
                </button>
              )}
            </div>
          )}
          <div className="profile-mini">
            <div className="profile-avatar"><GraduationCap size={18} /></div>
            <div className="profile-details">
              <strong>{user?.name || user?.email || "User"}</strong>
              <span>{role}</span>
            </div>
            <button className="logout-button" onClick={onLogout} title="Sign out" aria-label="Sign out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
