// Helper for persistent guest session
export function getOrCreatePlayerId() {
  let id = localStorage.getItem('natis_player_id');
  if (!id) {
    id = 'p_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
    localStorage.setItem('natis_player_id', id);
  }
  return id;
}

export function getStoredNickname() {
  return localStorage.getItem('natis_nickname') || '';
}

export function setStoredNickname(nickname) {
  const trimmed = nickname.trim();
  if (trimmed) {
    localStorage.setItem('natis_nickname', trimmed);
  }
}
