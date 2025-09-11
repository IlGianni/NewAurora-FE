// Servizio API per gestire le chiamate al backend
const API_BASE_URL = "http://localhost:3000/API/v1";

// Interfaccia per la risposta dei progetti
export interface ProjectResponse {
  message: string;
  projects: Project[];
}

// Interfaccia per un singolo progetto (basata sul modello Prisma)
export interface Project {
  project_id: string;
  unique_id: string;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  project_status_id: string;
  project_status: {
    project_status_id: string;
    name: string;
    created_at: string;
    updated_at: string;
  };
  created_by_id: string;
  created_by: {
    user_id: string;
    name: string;
    surname: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
  project_members: ProjectMember[];
}

export interface ProjectMember {
  project_member_id: string;
  project_id: string;
  user_id: string;
  user: {
    user_id: string;
    name: string;
    surname: string;
    email: string;
    created_at: string;
    updated_at: string;
  };
  created_at: string;
  updated_at: string;
}

// Funzione per fare la GET dei progetti
export const getProjects = async (): Promise<ProjectResponse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/project/GET/get-projects`, {
      method: "GET",
      credentials: "include", // Include i cookie per l'autenticazione
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status}`);
    }

    const data: ProjectResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Errore nel recupero dei progetti:", error);
    throw error;
  }
};

// Funzione per ottenere un progetto per ID
export const getProjectById = async (
  projectId: string
): Promise<{ message: string; project: Project }> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/project/GET/get-project-by-id`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ project_id: projectId }),
      }
    );

    if (!response.ok) {
      throw new Error(`Errore HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Errore nel recupero del progetto:", error);
    throw error;
  }
};
