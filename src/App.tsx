import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext";
import BoardPage from "./components/BoardPage";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function App() {
  // When no client ID is configured, render without GoogleOAuthProvider.
  // AuthProvider detects this and disables the sign-in button.
  if (!GOOGLE_CLIENT_ID) {
    return (
      <AuthProvider googleConfigured={false}>
        <BoardPage />
      </AuthProvider>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider googleConfigured={true}>
        <BoardPage />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
