import { useState } from "react";
import { AlertTriangle, ChevronRight, GraduationCap, LockKeyhole, Mail } from "lucide-react";
import { API_BASE_URL } from "../services/api";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Login failed. Check your credentials.");
      sessionStorage.setItem("attendanceToken", data.token);
      sessionStorage.setItem("attendanceUser", JSON.stringify(data.user));
      onLogin(data.user);
      setPassword("");
    } catch (err) {
      setError(err.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-screen">
      <section className="login-brand-panel">
        <div className="login-brand">
          <div className="brand-mark"><GraduationCap size={26} /></div>
          <div><strong>markyourattendance</strong><span>ON THE GO</span></div>
        </div>
        <div className="login-hero-copy">
          <span className="eyebrow-light">SMARTER CAMPUS MANAGEMENT</span>
          <h1>Every class counts. Every moment matters.</h1>
          <p>Keep attendance organized, track progress, and make every school day easier.</p>
        </div>
        <span className="login-panel-footer">A simpler way to manage attendance.</span>
      </section>
      <section className="login-form-panel">
        <form className="login-card" onSubmit={submit}>
          <div className="login-lock"><LockKeyhole size={23} /></div>
          <p className="eyebrow">WELCOME BACK</p>
          <h2>Sign in to your account</h2>
          <p className="login-subtitle">Enter your account details to continue.</p>
          {error && <div className="login-error" role="alert"><AlertTriangle size={17} />{error}</div>}
          <label className="login-label" htmlFor="login-email">Email address</label>
          <div className="login-input-wrap"><Mail size={18} />
            <input id="login-email" type="email" autoComplete="username" placeholder="you@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <label className="login-label" htmlFor="login-password">Password</label>
          <div className="login-input-wrap"><LockKeyhole size={18} />
            <input id="login-password" type="password" autoComplete="current-password" placeholder="Enter your password"
              value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"} <ChevronRight size={18} />
          </button>
        </form>
      </section>
    </div>
  );
}
