const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function fetchCampusSummary(days = 30, buildingId = null) {
  let url = `${API_BASE}/api/summary?days=${days}`;
  if (buildingId) url += `&building_id=${encodeURIComponent(buildingId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch campus summary");
  return res.json();
}

export async function fetchBuildings() {
  const res = await fetch(`${API_BASE}/api/buildings`);
  if (!res.ok) throw new Error("Failed to fetch buildings");
  return res.json();
}

export async function fetchReadings(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.building_id) searchParams.append("building_id", params.building_id);
  if (params.start) searchParams.append("start", params.start);
  if (params.end) searchParams.append("end", params.end);
  if (params.limit) searchParams.append("limit", params.limit);

  const res = await fetch(`${API_BASE}/api/readings?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch readings");
  return res.json();
}

export async function fetchAnomalies(buildingId = null) {
  let url = `${API_BASE}/api/anomalies`;
  if (buildingId) url += `?building_id=${encodeURIComponent(buildingId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch anomalies");
  return res.json();
}

export async function injectAnomaly(payload) {
  const res = await fetch(`${API_BASE}/api/anomalies/inject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to inject anomaly");
  return res.json();
}

export async function updateAnomalyStatus(id, status, notes = "") {
  const res = await fetch(`${API_BASE}/api/anomalies/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, notes }),
  });
  if (!res.ok) throw new Error("Failed to update anomaly status");
  return res.json();
}

export async function fetchRecommendations() {
  const res = await fetch(`${API_BASE}/api/recommendations`);
  if (!res.ok) throw new Error("Failed to fetch recommendations");
  return res.json();
}

export async function applyRecommendation(id) {
  const res = await fetch(`${API_BASE}/api/recommendations/${id}/apply`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to apply recommendation");
  return res.json();
}

export async function runWhatIfSimulation(payload) {
  const res = await fetch(`${API_BASE}/api/simulate/what-if`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to run what-if simulation");
  return res.json();
}

export async function fetchLeaderboard() {
  const res = await fetch(`${API_BASE}/api/leaderboard`);
  if (!res.ok) throw new Error("Failed to fetch leaderboard");
  return res.json();
}

export async function fetchSettings() {
  const res = await fetch(`${API_BASE}/api/settings`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateSettings(settings) {
  const res = await fetch(`${API_BASE}/api/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

export async function fetchReport(days = 7) {
  const res = await fetch(`${API_BASE}/api/report?days=${days}`);
  if (!res.ok) throw new Error("Failed to generate report");
  return res.json();
}

export async function uploadReadingsCsv(file) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(`${API_BASE}/api/data/upload`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) throw new Error("Failed to upload CSV");
  return res.json();
}

export async function triggerReSeed(days = 30, reset = true) {
  const res = await fetch(`${API_BASE}/api/seed?days=${days}&reset=${reset}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to re-seed database");
  return res.json();
}
