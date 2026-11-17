/**
 * Returns the Authorization header for the current session, if one exists.
 * The token is stored in localStorage by the login flow and cleared on open
 * (the app always launches logged out).
 */
export function authHeaders(): Record<string, string> {
  try {
    const token = localStorage.getItem('nexusroute_session_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}
