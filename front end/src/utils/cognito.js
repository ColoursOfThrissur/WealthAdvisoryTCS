const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || "";
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || "";
const COGNITO_STORAGE_PREFIX = "CognitoIdentityServiceProvider.";

let userPool = null;
let cognitoSdk = null;
let storageGuardsInstalled = false;

async function getCognitoSdk() {
  if (!cognitoSdk) {
    cognitoSdk = await import("amazon-cognito-identity-js");
  }
  return cognitoSdk;
}

function ensurePoolConfig() {
  if (!COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) {
    throw new Error(
      "Missing Cognito config. Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_CLIENT_ID."
    );
  }
}

function buildCookieStorage() {
  if (typeof document === "undefined" || typeof window === "undefined") return null;
  const secureFlag = window.location.protocol === "https:" ? "; Secure" : "";
  const maxAgeSeconds = 60 * 60 * 24 * 30;
  const parseCookies = () =>
    document.cookie
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean)
      .reduce((acc, cookie) => {
        const separatorIndex = cookie.indexOf("=");
        if (separatorIndex === -1) return acc;
        const key = decodeURIComponent(cookie.slice(0, separatorIndex));
        const value = decodeURIComponent(cookie.slice(separatorIndex + 1));
        acc[key] = value;
        return acc;
      }, {});

  return {
    setItem(key, value) {
      document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; Max-Age=${maxAgeSeconds}; Path=/; SameSite=Strict${secureFlag}`;
      return value;
    },
    getItem(key) {
      const cookies = parseCookies();
      return Object.prototype.hasOwnProperty.call(cookies, key) ? cookies[key] : null;
    },
    removeItem(key) {
      document.cookie = `${encodeURIComponent(key)}=; Max-Age=0; Path=/; SameSite=Strict${secureFlag}`;
    },
    clear() {
      const cookies = parseCookies();
      Object.keys(cookies).forEach((key) => {
        if (key.startsWith(COGNITO_STORAGE_PREFIX)) {
          document.cookie = `${encodeURIComponent(key)}=; Max-Age=0; Path=/; SameSite=Strict${secureFlag}`;
        }
      });
    },
  };
}

function clearLegacyCognitoWebStorage() {
  if (typeof window === "undefined") return;
  try {
    if (window.localStorage) {
      Object.keys(window.localStorage)
        .filter((key) => key.startsWith(COGNITO_STORAGE_PREFIX))
        .forEach((key) => window.localStorage.removeItem(key));
    }
    if (window.sessionStorage) {
      Object.keys(window.sessionStorage)
        .filter((key) => key.startsWith(COGNITO_STORAGE_PREFIX))
        .forEach((key) => window.sessionStorage.removeItem(key));
    }
  } catch {
    // ignore
  }
}

function installCognitoWebStorageGuards() {
  if (storageGuardsInstalled || typeof window === "undefined") return;
  const cookieStorage = buildCookieStorage();
  if (!cookieStorage) return;
  const wrapStorage = (storage) => {
    if (!storage) return;
    const originalSetItem = storage.setItem.bind(storage);
    const originalGetItem = storage.getItem.bind(storage);
    const originalRemoveItem = storage.removeItem.bind(storage);
    storage.setItem = (key, value) => {
      if (typeof key === "string" && key.startsWith(COGNITO_STORAGE_PREFIX)) {
        cookieStorage.setItem(key, value);
        return;
      }
      originalSetItem(key, value);
    };
    storage.getItem = (key) => {
      if (typeof key === "string" && key.startsWith(COGNITO_STORAGE_PREFIX)) {
        return cookieStorage.getItem(key);
      }
      return originalGetItem(key);
    };
    storage.removeItem = (key) => {
      if (typeof key === "string" && key.startsWith(COGNITO_STORAGE_PREFIX)) {
        cookieStorage.removeItem(key);
        return;
      }
      originalRemoveItem(key);
    };
  };
  try {
    wrapStorage(window.localStorage);
    wrapStorage(window.sessionStorage);
    storageGuardsInstalled = true;
  } catch {
    // ignore
  }
}

async function getUserPool() {
  if (!userPool) {
    ensurePoolConfig();
    clearLegacyCognitoWebStorage();
    const { CognitoUserPool } = await getCognitoSdk();
    const cookieStorage = buildCookieStorage();
    userPool = new CognitoUserPool({
      UserPoolId: COGNITO_USER_POOL_ID,
      ClientId: COGNITO_CLIENT_ID,
      ...(cookieStorage ? { Storage: cookieStorage } : {}),
    });
  }
  return userPool;
}

function normalizeCognitoError(error) {
  const rawType = error?.code || error?.name || error?.__type || "";
  const code = typeof rawType === "string" ? rawType.split("#").pop() : "";
  return {
    ...error,
    code,
    name: code || error?.name || "",
    message: error?.message || "Authentication failed.",
  };
}

export function signInWithCognito(email, password) {
  return getUserPool()
    .then((pool) =>
      getCognitoSdk().then(({ CognitoUser, AuthenticationDetails }) => {
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: pool,
          ...(buildCookieStorage() ? { Storage: buildCookieStorage() } : {}),
        });
        const auth = new AuthenticationDetails({ Username: email, Password: password });
        return new Promise((resolve, reject) => {
          cognitoUser.authenticateUser(auth, {
            onSuccess: (result) => {
              clearLegacyCognitoWebStorage();
              resolve({
                accessToken: result.getAccessToken().getJwtToken(),
                idToken: result.getIdToken().getJwtToken(),
                refreshToken: result.getRefreshToken().getToken(),
              });
            },
            onFailure: (error) => reject(normalizeCognitoError(error)),
          });
        });
      })
    )
    .catch((error) => Promise.reject(normalizeCognitoError(error)));
}

export function signUpWithCognito(email, password) {
  return getUserPool()
    .then((pool) =>
      getCognitoSdk().then(({ CognitoUserAttribute }) => {
        const attributes = [new CognitoUserAttribute({ Name: "email", Value: email })];
        return new Promise((resolve, reject) => {
          pool.signUp(email, password, attributes, [], (err, result) => {
            if (err) { reject(normalizeCognitoError(err)); return; }
            resolve(result?.user);
          });
        });
      })
    )
    .catch((error) => Promise.reject(normalizeCognitoError(error)));
}

export function confirmSignUpWithOtp(email, otp) {
  return getUserPool()
    .then((pool) =>
      getCognitoSdk().then(({ CognitoUser }) => {
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: pool,
          ...(buildCookieStorage() ? { Storage: buildCookieStorage() } : {}),
        });
        return new Promise((resolve, reject) => {
          cognitoUser.confirmRegistration(otp, true, (err, data) => {
            if (err) { reject(normalizeCognitoError(err)); return; }
            resolve(data);
          });
        });
      })
    )
    .catch((error) => Promise.reject(normalizeCognitoError(error)));
}

export function resendSignUpOtp(email) {
  return getUserPool()
    .then((pool) =>
      getCognitoSdk().then(({ CognitoUser }) => {
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: pool,
          ...(buildCookieStorage() ? { Storage: buildCookieStorage() } : {}),
        });
        return new Promise((resolve, reject) => {
          cognitoUser.resendConfirmationCode((err, data) => {
            if (err) { reject(normalizeCognitoError(err)); return; }
            resolve(data);
          });
        });
      })
    )
    .catch((error) => Promise.reject(normalizeCognitoError(error)));
}

export function startForgotPassword(email) {
  return getUserPool()
    .then((pool) =>
      getCognitoSdk().then(({ CognitoUser }) => {
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: pool,
          ...(buildCookieStorage() ? { Storage: buildCookieStorage() } : {}),
        });
        return new Promise((resolve, reject) => {
          cognitoUser.forgotPassword({
            onSuccess: resolve,
            onFailure: (error) => reject(normalizeCognitoError(error)),
            inputVerificationCode: (delivery) => resolve(delivery),
          });
        });
      })
    )
    .catch((error) => Promise.reject(normalizeCognitoError(error)));
}

export function confirmForgotPassword(email, otp, newPassword) {
  return getUserPool()
    .then((pool) =>
      getCognitoSdk().then(({ CognitoUser }) => {
        const cognitoUser = new CognitoUser({
          Username: email,
          Pool: pool,
          ...(buildCookieStorage() ? { Storage: buildCookieStorage() } : {}),
        });
        return new Promise((resolve, reject) => {
          cognitoUser.confirmPassword(otp, newPassword, {
            onSuccess: resolve,
            onFailure: (error) => reject(normalizeCognitoError(error)),
          });
        });
      })
    )
    .catch((error) => Promise.reject(normalizeCognitoError(error)));
}
