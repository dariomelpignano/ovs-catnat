// =============================================================================
// Authentication Store
// Aligned with ARCHITECTURE.md - JWT-based, per-store credentials
// =============================================================================

import { createSignal, createRoot } from "solid-js";
import type { User, UserRole, AuthSession } from "~/types";

export interface AuthState {
  user: User | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function createAuthStore() {
  const [user, setUser] = createSignal<User | null>(null);
  const [session, setSession] = createSignal<AuthSession | null>(null);
  const [isLoading, setIsLoading] = createSignal(false);

  const isAuthenticated = () => user() !== null && session() !== null;

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call
      // Simulated authentication for development
      const mockUsers: User[] = [
        {
          id: "admin-1",
          email: "admin@mag.it",
          role: "admin",
          storeCode: null,
          name: "Admin MAG",
          createdAt: new Date(),
          lastLogin: null,
        },
        {
          id: "store-001",
          email: "store001@ovs.it",
          role: "store_manager",
          storeCode: "OVS-001",
          name: "Store Manager Milano",
          createdAt: new Date(),
          lastLogin: null,
        },
      ];

      const foundUser = mockUsers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      if (foundUser && password === "demo123") {
        const newSession: AuthSession = {
          userId: foundUser.id,
          token: `jwt-${Date.now()}-${Math.random().toString(36)}`,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        };

        setUser({ ...foundUser, lastLogin: new Date() });
        setSession(newSession);

        // Store in localStorage for persistence
        if (typeof window !== "undefined") {
          localStorage.setItem("auth_user", JSON.stringify(foundUser));
          localStorage.setItem("auth_session", JSON.stringify(newSession));
        }

        return true;
      }

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setSession(null);

    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_user");
      localStorage.removeItem("auth_session");
    }
  };

  const restoreSession = () => {
    if (typeof window === "undefined") return;

    try {
      const storedUser = localStorage.getItem("auth_user");
      const storedSession = localStorage.getItem("auth_session");

      if (storedUser && storedSession) {
        const parsedUser = JSON.parse(storedUser) as User;
        const parsedSession = JSON.parse(storedSession) as AuthSession;

        // Check if session is still valid
        if (new Date(parsedSession.expiresAt) > new Date()) {
          setUser(parsedUser);
          setSession(parsedSession);
        } else {
          // Session expired, clean up
          logout();
        }
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
      logout();
    }
  };

  const hasRole = (role: UserRole): boolean => {
    return user()?.role === role;
  };

  const isStoreManager = () => hasRole("store_manager");
  const isAdmin = () => hasRole("admin");
  const isBroker = () => hasRole("broker");

  const getStoreCode = (): string | null => {
    return user()?.storeCode ?? null;
  };

  return {
    // State
    user,
    session,
    isAuthenticated,
    isLoading,

    // Actions
    login,
    logout,
    restoreSession,

    // Helpers
    hasRole,
    isStoreManager,
    isAdmin,
    isBroker,
    getStoreCode,
  };
}

// Create singleton store
export const authStore = createRoot(createAuthStore);
