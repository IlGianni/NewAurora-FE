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
  projects: Project[];
  project_members: ProjectMember[];
  tasks: Task[];
  sprints: Sprint[];
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
  task_priorities: TaskPriority[];
  sprints: Sprint[];
  tasks: Task[];
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

// Interfaccia per lo stato del task
export interface TaskStatus {
  task_status_id: number;
  name: string;
  color: string;
  created_at: string;
  updated_at: string;
}

// Interfaccia per la priorità del task
export interface TaskPriority {
  task_priority_id: number;
  name: string;
  color: string;
  project_id: number;
  created_at: string;
  updated_at: string;
}

// Interfaccia per i task
export interface Task {
  task_id: number;
  title: string;
  description: string;
  task_status_id: number;
  task_priority_id: number;
  story_points?: number;
  sprint_id?: number | null;
  project_id: number;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  task_status: TaskStatus;
  task_priority: TaskPriority;
  sprint?: Sprint;
  project: Project;
  created_by: User;
}

// Interfaccia per gli Sprint (Scrum)
export interface Sprint {
  sprint_id: number;
  name: string;
  description?: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  project_id: number;
  created_by_id: number;
  created_at: string;
  updated_at: string;
  project: Project;
  created_by: User;
  tasks: Task[];
}
