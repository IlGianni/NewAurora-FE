import {
  Card,
  CardBody,
  Chip,
  Progress,
  Avatar,
  AvatarGroup,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Project } from "../../../types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardProps {
  project: Project | null;
}

export default function Dashboard({ project }: DashboardProps) {
  if (!project) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-default-500">Caricamento dati...</p>
      </div>
    );
  }

  // Calcolo statistiche task
  const totalTasks = project.tasks.length;
  const completedTasks = project.tasks.filter(
    (task) => task.task_status.name.toLowerCase() === "completed"
  ).length;

  // Progresso progetto
  const projectProgress =
    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Preparazione dati per il grafico delle task completate nel tempo
  const getCompletedTasksOverTime = () => {
    const completedTasksList = project.tasks.filter(
      (task) => task.task_status.name.toLowerCase() === "completed"
    );

    // Raggruppa per data (solo data, senza ora)
    const tasksByDate: Record<string, number> = {};
    completedTasksList.forEach((task) => {
      if (task.updated_at) {
        const date = new Date(task.updated_at).toLocaleDateString("it-IT", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
        tasksByDate[date] = (tasksByDate[date] || 0) + 1;
      }
    });

    // Converti in array e ordina per data
    const chartData = Object.entries(tasksByDate)
      .map(([date, count]) => ({
        date,
        completate: count,
      }))
      .sort((a, b) => {
        const dateA = new Date(a.date.split("/").reverse().join("-"));
        const dateB = new Date(b.date.split("/").reverse().join("-"));
        return dateA.getTime() - dateB.getTime();
      });

    // Calcola il totale cumulativo
    let cumulative = 0;
    return chartData.map((item) => {
      cumulative += item.completate;
      return {
        ...item,
        totale: cumulative,
      };
    });
  };

  const chartData = getCompletedTasksOverTime();

  // Calcolo avanzamento temporale del progetto
  const getTimeProgress = () => {
    if (!project.start_date || !project.end_date) return null;

    const startDate = new Date(project.start_date);
    const endDate = new Date(project.end_date);
    const today = new Date();

    const totalDuration = endDate.getTime() - startDate.getTime();
    const elapsed = today.getTime() - startDate.getTime();

    if (totalDuration <= 0) return null;

    const progress = Math.min(
      Math.max((elapsed / totalDuration) * 100, 0),
      100
    );
    const daysRemaining = Math.ceil(
      (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      progress,
      daysRemaining,
      isOverdue: today > endDate,
    };
  };

  const timeProgress = getTimeProgress();

  // Numero di membri del team
  const teamMembersCount = project.project_members.length;

  return (
    <div className="space-y-6">
      {/* Panoramica Progetto con Descrizione */}
      <Card className="shadow-none border border-default-200">
        <CardBody className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <Icon icon="solar:document-text-bold" className="text-xl" />
            Panoramica Progetto
          </h3>
          {project.description ? (
            <p className="text-sm text-default-600 leading-relaxed whitespace-pre-wrap">
              {project.description}
            </p>
          ) : (
            <p className="text-sm text-default-400 italic">
              Nessuna descrizione disponibile per questo progetto.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Creatore del Progetto e Avanzamento Temporale */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Creatore del Progetto */}
        <Card className="shadow-none border border-default-200">
          <CardBody className="p-6">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Icon icon="solar:user-bold" className="text-lg" />
              Creatore del Progetto
            </h3>
            <div className="flex items-center gap-4">
              <Avatar
                size="lg"
                src={undefined}
                name={`${project.created_by.name} ${project.created_by.surname}`}
                className="ring-2 ring-primary"
              />
              <div className="flex-1">
                <p className="text-base font-semibold text-foreground">
                  {project.created_by.name} {project.created_by.surname}
                </p>
                <p className="text-xs text-default-500 mt-1">
                  {project.created_by.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Icon
                    icon="solar:calendar-linear"
                    className="text-xs text-default-400"
                  />
                  <span className="text-xs text-default-500">
                    Creato il{" "}
                    {new Date(project.created_at).toLocaleDateString("it-IT", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Avanzamento Temporale */}
        {timeProgress ? (
          <Card className="shadow-none border border-default-200">
            <CardBody className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                  <Icon icon="solar:calendar-mark-bold" className="text-lg" />
                  Avanzamento Temporale
                </h3>
                <Chip
                  size="sm"
                  variant="flat"
                  color={
                    timeProgress.isOverdue
                      ? "danger"
                      : timeProgress.daysRemaining < 7
                      ? "warning"
                      : "success"
                  }
                >
                  {timeProgress.isOverdue
                    ? "Scaduto"
                    : timeProgress.daysRemaining > 0
                    ? `${timeProgress.daysRemaining} giorni rimanenti`
                    : "Oggi"}
                </Chip>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-default-500">Data Inizio</span>
                  <span className="text-foreground font-medium">
                    {project.start_date
                      ? new Date(project.start_date).toLocaleDateString("it-IT")
                      : "Non impostata"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-default-500">Data Fine</span>
                  <span className="text-foreground font-medium">
                    {project.end_date
                      ? new Date(project.end_date).toLocaleDateString("it-IT")
                      : "Non impostata"}
                  </span>
                </div>
                <Progress
                  value={timeProgress.progress}
                  color={
                    timeProgress.isOverdue
                      ? "danger"
                      : timeProgress.daysRemaining < 7
                      ? "warning"
                      : "success"
                  }
                  className="w-full mt-4"
                  size="lg"
                />
                <p className="text-xs text-default-500 text-center">
                  {timeProgress.progress.toFixed(0)}% del tempo trascorso
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card className="shadow-none border border-default-200">
            <CardBody className="p-6">
              <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
                <Icon icon="solar:calendar-mark-bold" className="text-lg" />
                Avanzamento Temporale
              </h3>
              <p className="text-sm text-default-500">
                Le date di inizio e fine non sono state impostate.
              </p>
            </CardBody>
          </Card>
        )}
      </div>

      {/* Progresso Task */}
      <Card className="shadow-none border border-default-200">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground mb-1">
                Progresso Task
              </h3>
              <p className="text-xs text-default-500">
                {completedTasks} di {totalTasks} task completate
              </p>
            </div>
            <div className="text-3xl font-bold text-primary">
              {projectProgress.toFixed(0)}%
            </div>
          </div>
          <Progress
            value={projectProgress}
            color="primary"
            className="w-full"
            size="lg"
          />
        </CardBody>
      </Card>

      {/* Grafico e Team */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Grafico Task Completate nel Tempo (più piccolo) */}
        <Card className="shadow-none border border-default-200">
          <CardBody className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon icon="solar:chart-2-bold" className="text-base" />
              Task Completate nel Tempo
            </h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: "10px" }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: "10px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#fff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totale"
                    stroke="#0070f3"
                    strokeWidth={2}
                    dot={{ fill: "#0070f3", r: 3 }}
                    activeDot={{ r: 5 }}
                    name="Totale Completate"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px]">
                <p className="text-xs text-default-500">
                  Nessuna task completata ancora
                </p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Team */}
        <Card className="shadow-none border border-default-200">
          <CardBody className="p-5">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Icon
                icon="solar:users-group-rounded-bold-duotone"
                className="text-base"
              />
              Team
            </h3>
            <div className="space-y-3">
              <AvatarGroup size="md" max={8} className="justify-start">
                {project.project_members.map((member, index) => (
                  <Avatar
                    key={member.project_member_id || index}
                    src={undefined}
                    name={`${member.user?.name || ""} ${
                      member.user?.surname || ""
                    }`}
                    className="ring-2 ring-background"
                  />
                ))}
              </AvatarGroup>
              <p className="text-xs text-default-500">
                {teamMembersCount}{" "}
                {teamMembersCount === 1 ? "membro" : "membri"} nel team
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
