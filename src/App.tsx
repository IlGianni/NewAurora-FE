import AuthPage from "./pages/authentication/AuthPage";
import ForgotPassword from "./pages/authentication/ForgotPassword";
import GitHubCallback from "./pages/authentication/GitHubCallback";
import GoogleCallback from "./pages/authentication/GoogleCallback";
import GitHubAuthCallback from "./pages/authentication/GitHubAuthCallback";
import Dashboard from "./pages/dashboard/Dashboard";
import Settings from "./pages/settings/Settings";
import Projects from "./pages/projects/Projects";
import ProjectDetail from "./pages/projects/ProjectDetail";
import FeatureFlagEditor from "./components/Project/ProjectDetail/ProjectFeatureFlags/FeatureFlagEditor";
import AppLayout from "./components/Layout/AppLayout";
import axios from "axios";
import { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import ProjectCreator from "./pages/projects/ProjectCreator";
import { Spinner } from "@heroui/react";

function App() {
  // Set the base URL for API calls

  axios.defaults.baseURL =
    import.meta.env.VITE_API_URL || "http://localhost:3000/API/v1";
  axios.defaults.withCredentials = true;

  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkSession = async () => {
    try {
      const res = await axios.get("/authentication/GET/check-session", {
        withCredentials: true,
      });

      if (res.status === 200 && res.data) {
        setIsAuth(true);
      } else {
        setIsAuth(false);
      }
    } catch (error) {
      console.error("Errore durante il controllo della sessione:", error);
      setIsAuth(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await checkSession();
    };

    fetchData();

    // Check session every 10 minutes
    const sessionInterval = setInterval(() => {
      checkSession();
    }, 10 * 60 * 1000);

    // Ascolta evento logout per aggiornare lo stato di autenticazione
    const handleLogout = () => {
      setIsAuth(false);
    };

    // Ascolta evento login per aggiornare lo stato di autenticazione (OAuth)
    const handleLogin = async () => {
      await checkSession();
    };

    window.addEventListener("user-logout", handleLogout);
    window.addEventListener("user-login", handleLogin);

    return () => {
      clearInterval(sessionInterval);
      window.removeEventListener("user-logout", handleLogout);
      window.removeEventListener("user-login", handleLogin);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner variant="wave" />
      </div>
    );
  }

  return (
    <AppLayout isAuth={isAuth}>
      <Routes>
        {/* Route callback OAuth - accessibile sempre */}
        <Route path="/auth/github/callback" element={<GitHubCallback />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route
          path="/auth/github/auth-callback"
          element={<GitHubAuthCallback />}
        />

        {!isAuth ? (
          <>
            <Route path="/" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/create" element={<ProjectCreator />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            <Route
              path="/projects/:id/feature-flags/:flagKey"
              element={<FeatureFlagEditor />}
            />
            <Route
              path="/projects/:id/feature-flags/new-flag/:groupId"
              element={<FeatureFlagEditor />}
            />
          </>
        )}
      </Routes>
    </AppLayout>
  );
}

export default App;
