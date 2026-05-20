const AUTH_COOKIE_MAX_AGE_SECONDS = 30 * 60;

const AUTH_COOKIE_NAMES = {
  accessToken: "access_token",
  idToken: "id_token",
  refreshToken: "refresh_token",
  sessionStart: "session_start",
  isAuthenticated: "is_authenticated",
};

function isSecureContextForCookies() {
  if (typeof window === "undefined") return false;
  return window.location.protocol === "https:";
}

function buildCookieOptions(maxAgeSeconds = AUTH_COOKIE_MAX_AGE_SECONDS) {
  const parts = ["Path=/", "SameSite=Strict", `Max-Age=${maxAgeSeconds}`];
  if (isSecureContextForCookies()) parts.push("Secure");
  return parts.join("; ");
}

function setCookie(name, value, maxAgeSeconds = AUTH_COOKIE_MAX_AGE_SECONDS) {
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${buildCookieOptions(maxAgeSeconds)}`;
}

function deleteCookie(name) {
  document.cookie = `${encodeURIComponent(name)}=; Path=/; Max-Age=0; SameSite=Strict${isSecureContextForCookies() ? "; Secure" : ""}`;
}

function getCookie(name) {
  const encodedName = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(encodedName));
  if (!cookie) return "";
  return decodeURIComponent(cookie.slice(encodedName.length));
}

export function persistAuthTokens(tokens) {
  setCookie(AUTH_COOKIE_NAMES.accessToken, tokens.accessToken);
  setCookie(AUTH_COOKIE_NAMES.idToken, tokens.idToken);
  setCookie(AUTH_COOKIE_NAMES.refreshToken, tokens.refreshToken);
  setCookie(AUTH_COOKIE_NAMES.sessionStart, Date.now().toString());
  setCookie(AUTH_COOKIE_NAMES.isAuthenticated, "true");
}

export function clearAuthCookies() {
  Object.values(AUTH_COOKIE_NAMES).forEach(deleteCookie);
}

export function getAuthSessionStart() {
  const raw = getCookie(AUTH_COOKIE_NAMES.sessionStart);
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

export function hasAuthCookies() {
  return Boolean(
    getCookie(AUTH_COOKIE_NAMES.accessToken) &&
    getCookie(AUTH_COOKIE_NAMES.idToken) &&
    getCookie(AUTH_COOKIE_NAMES.refreshToken) &&
    getCookie(AUTH_COOKIE_NAMES.isAuthenticated) === "true"
  );
}

export function touchAuthSessionStart() {
  setCookie(AUTH_COOKIE_NAMES.sessionStart, Date.now().toString());
}

export function clearLegacyAuthStorage() {
  localStorage.removeItem("isAuthenticated");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("id_token");
  sessionStorage.removeItem("refresh_token");
  sessionStorage.removeItem("session_start");
}

export function isAuthSessionExpired(timeoutMs) {
  const sessionStart = getAuthSessionStart();
  if (!sessionStart) return true;
  return Date.now() - sessionStart >= timeoutMs;
}
