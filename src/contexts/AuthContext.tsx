import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useGoogleLogin, googleLogout } from "@react-oauth/google";

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: GoogleUser | null;
  loading: boolean;
  signInWithGoogle: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(false);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        // Use the access token to fetch user profile info
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
        setUser({
          name: profile.name,
          email: profile.email,
          picture: profile.picture,
        });
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
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle: login,
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
