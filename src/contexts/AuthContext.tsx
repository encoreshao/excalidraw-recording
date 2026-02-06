import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";

const USER_STORAGE_KEY = "excalidraw-recording-user";

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  loading: boolean;
  /** Whether Google OAuth is configured (client ID provided) */
  googleConfigured: boolean;
  signInWithGoogle: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function loadUser(): GoogleUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

function saveUser(user: GoogleUser | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

/**
 * Internal provider that uses useGoogleLogin.
 * Must be rendered inside GoogleOAuthProvider.
 */
function GoogleAuthInner({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(loadUser);
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const res = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          },
        );
        if (!res.ok) throw new Error("Failed to fetch user info");
        const profile = await res.json();
        const userData: GoogleUser = {
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
        };
        setUser(userData);
        saveUser(userData);
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      } finally {
        setLoading(false);
      }
    },
    onError: (error) => {
      console.error("Google sign-in failed:", error);
      setLoading(false);
    },
  });

  const handleLogout = useCallback(() => {
    googleLogout();
    setUser(null);
    saveUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        googleConfigured: true,
        signInWithGoogle: login,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * AuthProvider that works in two modes:
 * - googleConfigured=true  → uses GoogleAuthInner with real OAuth hooks
 * - googleConfigured=false → provides a stub context, sign-in button is disabled
 */
export function AuthProvider({
  children,
  googleConfigured,
}: {
  children: ReactNode;
  googleConfigured: boolean;
}) {
  if (googleConfigured) {
    return <GoogleAuthInner>{children}</GoogleAuthInner>;
  }
  return <FallbackAuthInner>{children}</FallbackAuthInner>;
}

function FallbackAuthInner({ children }: { children: ReactNode }) {
  const [user] = useState<GoogleUser | null>(loadUser);

  const noop = useCallback(() => {
    console.warn(
      "Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to your .env file.",
    );
  }, []);

  const handleLogout = useCallback(() => {
    saveUser(null);
    window.location.reload();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading: false,
        googleConfigured: false,
        signInWithGoogle: noop,
        logout: handleLogout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
