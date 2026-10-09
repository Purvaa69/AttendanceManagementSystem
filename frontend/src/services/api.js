export const API_BASE_URL = "http://localhost:5000/api";

export async function apiFetch(path, options = {}) {
  const token = sessionStorage.getItem("attendanceToken");
  const headers = {
    ...(options.body && !(options.body instanceof FormData)
      ? { "Content-Type": "application/json" }
      : {}),
    ...options.headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new Error("Could not connect to the backend. Make sure the server is running.");
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || `Request failed (${response.status}).`);
  }
  return data;
}
