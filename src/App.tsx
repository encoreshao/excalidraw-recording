import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "./contexts/AuthContext";
import BoardPage from "./components/BoardPage";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function App() {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-white">
        <div className="text-center max-w-md p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Google Client ID Required
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Create a <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">.env</code> file with:
          </p>
          <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-left text-xs text-gray-700">
            VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
          </pre>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <BoardPage />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
