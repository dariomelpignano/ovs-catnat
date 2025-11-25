// =============================================================================
// Authentication Store - Secure Implementation
// NOTE: This is a demo/prototype. In production, replace with actual API calls.
// =============================================================================

import { createSignal, createRoot } from "solid-js";
import type { User, UserRole, AuthSession } from "~/types";
import { importQueue } from "~/lib/ingestion/import-queue";
import { policyService } from "~/lib/core/policy-service";
import { lifecycleManager } from "~/lib/core/lifecycle-manager";

// Simulated secure token signing (in production, this happens server-side)
// Using a simple HMAC-like signature for demo purposes
const SECRET_KEY = "ovs-catnat-demo-secret-key-2025";

function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function signToken(payload: { userId: string; role: UserRole; exp: number }): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  const signature = hashString(`${header}.${body}.${SECRET_KEY}`);
  return `${header}.${body}.${signature}`;
}

function verifyToken(token: string): { valid: boolean; payload?: { userId: string; role: UserRole; exp: number } } {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return { valid: false };

    const [header, body, signature] = parts;
    const expectedSignature = hashString(`${header}.${body}.${SECRET_KEY}`);

    if (signature !== expectedSignature) {
      console.warn("[Auth] Token signature verification failed");
      return { valid: false };
    }

    const payload = JSON.parse(atob(body));
    if (payload.exp < Date.now()) {
      console.warn("[Auth] Token has expired");
      return { valid: false };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

// Authorized users database (in production, this is server-side)
const AUTHORIZED_USERS: Array<{ user: User; passwordHash: string }> = [
  {
    user: { id: "admin-1", email: "admin@mag.it", role: "admin", storeCode: null, name: "Admin MAG", createdAt: new Date("2024-01-01"), lastLogin: null },
    passwordHash: hashString("demo123" + SECRET_KEY),
  },
  {
    user: { id: "store-001", email: "store001@ovs.it", role: "store_manager", storeCode: "OVS-001", name: "Store Manager Milano", createdAt: new Date("2024-01-01"), lastLogin: null },
    passwordHash: hashString("demo123" + SECRET_KEY),
  },
  {
    user: { id: "broker-1", email: "broker@example.com", role: "broker", storeCode: null, name: "Broker Test", createdAt: new Date("2024-01-01"), lastLogin: null },
    passwordHash: hashString("demo123" + SECRET_KEY),
  },
];

// Session storage keys with prefix to avoid conflicts
const STORAGE_PREFIX = "ovs_catnat_";
const SESSION_TOKEN_KEY = `${STORAGE_PREFIX}session_token`;

function createAuthStore() {
  const [user, setUser] = createSignal<User | null>(null);
  const [session, setSession] = createSignal<AuthSession | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);

  const isAuthenticated = () => {
    const currentSession = session();
    const currentUser = user();
    if (!currentSession || !currentUser) return false;

    // Verify token is still valid
    const verification = verifyToken(currentSession.token);
    if (!verification.valid) {
      logout();
      return false;
    }

    // Verify user role matches token payload
    if (verification.payload?.role !== currentUser.role) {
      console.warn("[Auth] Role mismatch between session and user");
      logout();
      return false;
    }

    return true;
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      // Simulate server-side authentication
      await new Promise(resolve => setTimeout(resolve, 100));

      const normalizedEmail = email.toLowerCase().trim();
      const passwordHash = hashString(password + SECRET_KEY);

      const authRecord = AUTHORIZED_USERS.find(
        u => u.user.email.toLowerCase() === normalizedEmail && u.passwordHash === passwordHash
      );

      if (!authRecord) {
        console.warn("[Auth] Login failed: invalid credentials");
        return false;
      }

      const { user: foundUser } = authRecord;
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

      // Create signed token with user role embedded
      const token = signToken({
        userId: foundUser.id,
        role: foundUser.role,
        exp: expiresAt,
      });

      const newSession: AuthSession = {
        userId: foundUser.id,
        token,
        expiresAt: new Date(expiresAt),
      };

      const loggedInUser = { ...foundUser, lastLogin: new Date() };

      setUser(loggedInUser);
      setSession(newSession);

      // Only store the signed token (not user data)
      if (typeof window !== "undefined") {
        localStorage.setItem(SESSION_TOKEN_KEY, token);
      }

      return true;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setSession(null);

    // Clear all service data to prevent cross-session data leakage
    importQueue.clearSessionData();
    policyService.clearSessionData();
    lifecycleManager.clearSessionData();

    if (typeof window !== "undefined") {
      // Clear all auth-related storage
      localStorage.removeItem(SESSION_TOKEN_KEY);
      // Also clear any legacy keys
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_session");
    }
  };

  const restoreSession = () => {
    if (typeof window === "undefined") return;

    try {
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
      if (!storedToken) {
        // Clean up any legacy storage
        localStorage.removeItem("auth_user");
        localStorage.removeItem("auth_session");
        return;
      }

      // Verify the token signature and expiration
      const verification = verifyToken(storedToken);
      if (!verification.valid || !verification.payload) {
        console.warn("[Auth] Session restoration failed: invalid token");
        logout();
        return;
      }

      // Look up user from verified payload (simulates server lookup)
      const authRecord = AUTHORIZED_USERS.find(u => u.user.id === verification.payload!.userId);
      if (!authRecord) {
        console.warn("[Auth] Session restoration failed: user not found");
        logout();
        return;
      }

      // Verify role hasn't been tampered with
      if (authRecord.user.role !== verification.payload.role) {
        console.warn("[Auth] Session restoration failed: role mismatch");
        logout();
        return;
      }

      const restoredSession: AuthSession = {
        userId: verification.payload.userId,
        token: storedToken,
        expiresAt: new Date(verification.payload.exp),
      };

      setUser({ ...authRecord.user, lastLogin: new Date() });
      setSession(restoredSession);

    } catch (error) {
      console.error("[Auth] Session restoration error:", error);
      logout();
    }
  };

  // Role checking with additional token verification
  const hasRole = (role: UserRole): boolean => {
    if (!isAuthenticated()) return false;
    return user()?.role === role;
  };

  const isStoreManager = () => hasRole("store_manager");
  const isAdmin = () => hasRole("admin");
  const isBroker = () => hasRole("broker");

  const getStoreCode = (): string | null => {
    if (!isAuthenticated()) return null;
    return user()?.storeCode ?? null;
  };

  // Get current user's role for authorization checks
  const getCurrentRole = (): UserRole | null => {
    if (!isAuthenticated()) return null;
    return user()?.role ?? null;
  };

  return {
    user,
    session,
    isAuthenticated,
    isLoading,
    login,
    logout,
    restoreSession,
    hasRole,
    isStoreManager,
    isAdmin,
    isBroker,
    getStoreCode,
    getCurrentRole,
  };
}

export const authStore = createRoot(createAuthStore);
