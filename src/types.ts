// Interfaccia per lo stato del progetto
export interface ProjectStatus {
  project_status_id: string;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// Interfaccia per l'utente creatore
export interface User {
  user_id: string;
  name: string;
  surname: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

// Interfaccia per i membri del progetto
export interface ProjectMember {
  project_member_id?: string;
  project_id?: string;
  user_id: string;
  user?: User;
  role?: string;
  joined_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Interfaccia principale per il progetto
export interface Project {
  project_id: string;
  unique_id: string;
  name: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  project_status_id: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
  project_status: ProjectStatus;
  created_by: User;
  project_members: ProjectMember[];
}
