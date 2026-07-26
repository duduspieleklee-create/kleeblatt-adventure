const API_BASE = 'https://game.kleeblatt.space/api/game';
const SESSION_KEY = 'kleeblatt_session';

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export async function guestLogin() {
  const res = await fetch(`${API_BASE}/guest`, { method: 'POST' });
  if (!res.ok) throw new Error(`Guest login failed: ${res.status}`);
  const data = await res.json();
  saveSession(data);
  return data;
}

export async function walletLogin(walletAddress) {
  const res = await fetch(`${API_BASE}/wallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
  if (!res.ok) throw new Error(`Wallet login failed: ${res.status}`);
  const data = await res.json();
  saveSession(data);
  return data;
}

export async function getProfile(token) {
  const res = await fetch(`${API_BASE}/profile?token=${token}`);
  if (!res.ok) throw new Error(`Profile fetch failed: ${res.status}`);
  return res.json();
}

export async function submitScore(token, score, treasuresCollected) {
  const res = await fetch(`${API_BASE}/score?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ score, treasures_collected: treasuresCollected }),
  });
  if (!res.ok) throw new Error(`Score submit failed: ${res.status}`);
  return res.json();
}

export async function getLeaderboard(limit = 20) {
  const res = await fetch(`${API_BASE}/leaderboard?limit=${limit}`);
  if (!res.ok) throw new Error(`Leaderboard fetch failed: ${res.status}`);
  return res.json();
}
