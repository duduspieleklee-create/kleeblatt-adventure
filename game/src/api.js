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

export async function guestLogin(username = null) {
  const body = username ? { username } : {};
  const res = await fetch(`${API_BASE}/guest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Guest login failed: ${res.status}`);
  }
  const data = await res.json();
  saveSession(data);
  return data;
}

export async function walletLogin(walletAddress, username = null) {
  const body = { wallet_address: walletAddress };
  if (username) body.username = username;
  const res = await fetch(`${API_BASE}/wallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Wallet login failed: ${res.status}`);
  }
  const data = await res.json();
  saveSession(data);
  return data;
}

export async function linkWallet(token, walletAddress, username = null) {
  const body = { wallet_address: walletAddress };
  if (username) body.username = username;
  const res = await fetch(`${API_BASE}/link-wallet?token=${token}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Link wallet failed: ${res.status}`);
  }
  const data = await res.json();
  saveSession(data);
  return data;
}

export async function updateUsername(token, username) {
  const res = await fetch(`${API_BASE}/username?token=${token}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Update username failed: ${res.status}`);
  }
  const data = await res.json();
  saveSession(data);
  return data;
}

export async function checkUsername(username) {
  const res = await fetch(`${API_BASE}/check-username?username=${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error(`Check username failed: ${res.status}`);
  return res.json();
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
