import AuthPage from "./pages/authentication/AuthPage";
import Dashboard from "./pages/dashboard/Dashboard";
import Settings from "./pages/settings/Settings";
import Projects from "./pages/projects/Projects";
import ProjectDetail from "./pages/projects/ProjectDetail";
import Tasks from "./pages/tasks/Tasks";
import AppLayout from "./components/Layout/AppLayout";

import axios from "axios";
import { useEffect, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import ProjectCreator from "./pages/projects/ProjectCreator";

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

    return () => clearInterval(sessionInterval);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AppLayout isAuth={isAuth}>
      <Routes>
        {!isAuth ? (
          <>
            <Route path="/" element={<AuthPage />} />
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
            <Route path="/tasks" element={<Tasks />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </>
        )}
      </Routes>
    </AppLayout>
  );
}

export default App;
