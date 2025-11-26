import { useState, useEffect } from "react";
import { Chip, Skeleton, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import type { User, Project } from "../../types";

export default function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Dati utente e dashboard
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Carica dati utente e dashboard
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoadingData(true);
      try {
        // Carica dati utente
        const userResponse = await axios.get(
          "/authentication/GET/get-session-data",
          { withCredentials: true }
        );
        if (userResponse.data?.user) {
          setUser(userResponse.data.user);
        } else if (userResponse.data) {
          setUser(userResponse.data);
        }

        // Carica progetti
        const projectsResponse = await axios.get("/project/GET/get-projects");
        if (projectsResponse.data?.projects) {
          setProjects(projectsResponse.data.projects);
        }
      } catch (error) {
        console.error("Errore nel caricamento dei dati dashboard:", error);
      } finally {
        setIsLoadingData(false);
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Gestisci callback OAuth GitHub
  useEffect(() => {
    const oauth = searchParams.get("oauth");
    const provider = searchParams.get("provider");
    const error = searchParams.get("error");

    if (oauth === "success" && provider === "github") {
      console.log("✅ Login GitHub OAuth completato");
      checkGitHubAuthStatus();
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("oauth");
      newSearchParams.delete("provider");
      setSearchParams(newSearchParams, { replace: true });
    } else if (error) {
      const message = searchParams.get("message");
      console.error("❌ Errore OAuth:", error, message);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete("error");
      newSearchParams.delete("message");
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Verifica stato autenticazione GitHub per vault
  const checkGitHubAuthStatus = async () => {
    try {
      const response = await axios.get("/github/auth/status", {
        withCredentials: true,
      });

      if (response.data.authenticated) {
        console.log("✅ GitHub collegato per vault:", response.data.user);
        window.dispatchEvent(
          new CustomEvent("github-vault-connected", {
            detail: response.data,
          })
        );
      } else {
        console.log("ℹ️ GitHub non collegato per vault");
      }
    } catch (error) {
      console.warn("⚠️ Impossibile verificare stato GitHub:", error);
    }
  };

  // Calcola statistiche
  const activeProjects = projects.filter(
    (p) => p.project_status.name !== "Completed"
  ).length;

  const totalProjects = projects.length;
  const completedProjects = projects.filter(
    (p) => p.project_status.name === "Completed"
  ).length;

  // Progetti recenti (ultimi 5)
  const recentProjects = [...projects]
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 5);

  // Saluto personalizzato
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buongiorno";
    if (hour < 18) return "Buon pomeriggio";
    return "Buonasera";
  };

  const getUserName = () => {
    if (!user) return "Utente";
    return user.name || "Utente";
  };

  // Formatta data relativa
  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Oggi";
    if (diffDays === 1) return "Ieri";
    if (diffDays < 7) return `${diffDays} giorni fa`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} settimane fa`;
    return date.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
    });
  };

  if (isLoading || isLoadingData) {
    return (
      <div className="space-y-6 p-6 md:p-8 mx-auto max-w-7xl">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div className="space-y-2">
            <Skeleton className="h-12 w-64 rounded" />
            <Skeleton className="h-5 w-80 rounded" />
          </div>
          <Skeleton className="h-10 w-40 rounded" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>

        {/* Projects skeleton */}
        <div className="space-y-4">
          <Skeleton className="h-6 w-48 rounded mb-4" />
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Progetti attivi (non completati) per la sezione "Azioni Importanti"
  const activeProjectsList = projects
    .filter((p) => p.project_status.name !== "Completed")
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
    .slice(0, 3);

  return (
    <div className="space-y-6 p-6 md:p-8 mx-auto">
      {/* Header con saluto */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl md:text-3xl mb-2">
            {getGreeting()}, {getUserName()} 👋
          </h1>
        </div>
      </div>
    </div>
  );
}
