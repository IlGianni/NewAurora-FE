// Interfaccia per lo stato del progetto
export interface ProjectStatus {
  project_status_id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// Interfaccia per l'utente creatore
export interface User {
  user_id: number;
  name: string;
  surname: string;
  email: string;
  password: string;
  created_at: string;
  updated_at: string;
}

// Interfaccia per i membri del progetto
export interface ProjectMember {
  project_member_id?: number;
  project_id?: number;
  user_id: number;
  user?: User;
  role?: string;
  joined_at?: string;
  created_at?: string;
  updated_at?: string;
}

// Interfaccia principale per il progetto
export interface Project {
  project_id: number;
  unique_id: string;
  name: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
  project_status_id: number;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  project_status: ProjectStatus;
  created_by: User;
  project_members: ProjectMember[];
}

export interface AlertData {
  title: string;
  description: string;
  type: "success" | "error" | "warning" | "info";
  isOpen: boolean;
  onClose: () => void;
}

// Tipi per le metodologie di progetto
export type ProjectMethodology = "scrum" | "kanban";

// Interfaccia per i task
export interface Task {
  task_id: number;
  title: string;
  description: string;
  status: string;
  priority: "low" | "medium" | "high";
  assigned_to?: User;
  sprint_id?: number | null;
  column_id?: number | null;
  order: number;
  story_points?: number;
  created_at: string;
  updated_at: string;
}

// Interfaccia per gli Sprint (Scrum)
export interface Sprint {
  sprint_id: number;
  name: string;
  goal: string;
  start_date: string;
  end_date: string;
  status: "planned" | "active" | "completed";
  project_id: number;
  created_at: string;
  updated_at: string;
  tasks: Task[];
}

// Interfaccia per le Colonne Kanban
export interface KanbanColumn {
  column_id: number;
  name: string;
  color: string;
  order: number;
  wip_limit?: number; // Work In Progress limit
  project_id: number;
  created_at: string;
  updated_at: string;
  tasks: Task[];
}
