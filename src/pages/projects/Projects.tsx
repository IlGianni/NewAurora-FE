import {
  Card,
  CardBody,
  Button,
  Chip,
  Avatar,
  AvatarGroup,
  Skeleton,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Projects() {
  const navigate = useNavigate();

  // Stati di loading
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Simula il caricamento dei dati
  useEffect(() => {
    // Simula caricamento statistiche (più veloce)
    const statsTimer = setTimeout(() => {
      setIsLoadingStats(false);
    }, 800);

    // Simula caricamento progetti (più lento)
    const projectsTimer = setTimeout(() => {
      setIsLoadingProjects(false);
    }, 1200);

    return () => {
      clearTimeout(statsTimer);
      clearTimeout(projectsTimer);
    };
  }, []);

  // Dati mock per i progetti
  const projects = [
    {
      id: 1,
      name: "Aurora Design System",
      description: "Sistema di design completo per l'applicazione Aurora",
      status: "In Progress",
      priority: "High",

      team: [
        { name: "Andrea", avatar: "https://i.pravatar.cc/150?img=1" },
        { name: "Marco", avatar: "https://i.pravatar.cc/150?img=2" },
        { name: "Sofia", avatar: "https://i.pravatar.cc/150?img=3" },
      ],
      deadline: "2024-02-15",
      tasks: { completed: 12, total: 16 },
    },
    {
      id: 2,
      name: "Mobile App Redesign",
      description: "Ridisegno completo dell'app mobile con nuove funzionalità",
      status: "Planning",
      priority: "Medium",

      team: [
        { name: "Luca", avatar: "https://i.pravatar.cc/150?img=4" },
        { name: "Elena", avatar: "https://i.pravatar.cc/150?img=5" },
      ],
      deadline: "2024-03-01",
      tasks: { completed: 3, total: 12 },
    },
    {
      id: 3,
      name: "Database Migration",
      description: "Migrazione del database verso PostgreSQL",
      status: "Completed",
      priority: "High",

      team: [{ name: "Roberto", avatar: "https://i.pravatar.cc/150?img=6" }],
      deadline: "2024-01-30",
      tasks: { completed: 8, total: 8 },
    },
  ];

  const statistics = [
    {
      title: "Progetti Attivi",
      value: 12,
      icon: "solar:folder-open-bold",
      iconColor: "text-primary",
      changeType: "positive",
      trendChipPosition: "top",
      trendType: "up",
      trendChipVariant: "flat",
    },
    {
      title: "Task Completate",
      value: 48,
      icon: "solar:check-circle-bold",
      iconColor: "text-success",
      changeType: "neutral",
      trendChipPosition: "bottom",
      trendType: "neutral",
      trendChipVariant: "flat",
    },
    {
      title: "Team Members",
      value: 8,
      icon: "solar:users-group-rounded-bold",
      iconColor: "text-warning",
      changeType: "negative",
      trendChipPosition: "top",
      trendType: "down",
      trendChipVariant: "flat",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "success";
      case "In Progress":
        return "primary";
      case "Planning":
        return "warning";
      default:
        return "default";
    }
  };

  const handleProjectClick = (projectId: number) => {
    console.log("Clicking on project with ID:", projectId);
    console.log("Navigating to:", `/projects/${projectId}`);

    // Prova prima con navigate
    try {
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback con window.location
      window.location.href = `/projects/${projectId}`;
    }
  };

  // Componente skeleton per le statistiche
  const StatisticSkeleton = () => (
    <Card className="shadow-none border border-gray-200">
      <div className="flex p-4">
        <div className="flex items-center gap-3 w-full">
          <Skeleton className="flex rounded-lg w-10 h-10" />
          <div className="flex flex-col gap-y-1">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-5 w-12 rounded" />
          </div>
        </div>
      </div>
    </Card>
  );

  // Componente skeleton per le card dei progetti
  const ProjectCardSkeleton = () => (
    <Card className="shadow-none border border-gray-200">
      <CardBody className="p-6">
        {/* Header con titolo e status */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 rounded mb-2" />
            <Skeleton className="h-3 w-full rounded" />
            <Skeleton className="h-3 w-2/3 rounded mt-1" />
          </div>
          <Skeleton className="flex rounded-full w-16 h-6 ml-3" />
        </div>

        {/* Informazioni essenziali */}
        <div className="flex items-center justify-between text-xs mb-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-12 rounded" />
            <Skeleton className="h-4 w-8 rounded" />
          </div>
          <Skeleton className="h-4 w-16 rounded" />
        </div>

        {/* Team avatars e priority */}
        <div className="flex items-center justify-between pt-4 border-t border-default-100">
          <div className="flex gap-1">
            <Skeleton className="flex rounded-full w-8 h-8" />
            <Skeleton className="flex rounded-full w-8 h-8" />
            <Skeleton className="flex rounded-full w-8 h-8" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="flex rounded-full w-2 h-2" />
            <Skeleton className="h-3 w-12 rounded" />
          </div>
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="space-y-8 ">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Progetti</h1>
          <p className="text-sm text-default-500 mt-1">
            Gestisci e monitora tutti i tuoi progetti
          </p>
        </div>
        <Button
          color="primary"
          size="sm"
          startContent={<Icon icon="solar:add-circle-bold" />}
        >
          Nuovo Progetto
        </Button>
      </div>

      {/* Statistiche */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoadingStats
          ? // Mostra skeleton durante il caricamento
            Array.from({ length: 4 }).map((_, index) => (
              <StatisticSkeleton key={index} />
            ))
          : // Mostra dati reali quando caricati
            statistics.map((statistic, index) => (
              <Card key={index} className="shadow-none border border-gray-200">
                <div className="flex p-4">
                  <div className="flex items-center gap-3 w-full">
                    <div className="p-2 bg-default-100 rounded-lg">
                      <Icon
                        icon={statistic.icon}
                        className={`${statistic.iconColor} text-xl`}
                      />
                    </div>
                    <div className="flex flex-col gap-y-1">
                      <dt className="text-xs text-default-500 font-medium">
                        {statistic.title}
                      </dt>
                      <dd className="text-default-700 text-lg font-semibold">
                        {statistic.value}
                      </dd>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
      </div>

      {/* Lista Progetti */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            I Tuoi Progetti
          </h2>
          <div className="flex gap-2">
            <Button
              variant="bordered"
              size="sm"
              startContent={<Icon icon="solar:filter-outline" />}
            >
              Filtra
            </Button>
            <Button
              variant="bordered"
              size="sm"
              startContent={<Icon icon="solar:sort-outline" />}
            >
              Ordina
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoadingProjects
            ? // Mostra skeleton durante il caricamento
              Array.from({ length: 6 }).map((_, index) => (
                <ProjectCardSkeleton key={index} />
              ))
            : // Mostra progetti reali quando caricati
              projects.map((project) => (
                <Card
                  isPressable
                  key={project.id}
                  className="shadow-none border border-gray-200 hover:shadow-lg hover:border-primary/30 hover:scale-[1.02] transition-all duration-300 cursor-pointer group"
                  onClick={() => handleProjectClick(project.id)}
                >
                  <CardBody className="p-6">
                    {/* Header con titolo e status */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-base text-foreground mb-1 group-hover:text-primary transition-colors">
                          {project.name}
                        </h3>
                        <p className="text-xs text-default-500 line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                      <Chip
                        size="sm"
                        color={getStatusColor(project.status) as any}
                        variant="flat"
                        className="ml-3 text-xs"
                      >
                        {project.status}
                      </Chip>
                    </div>

                    {/* Informazioni essenziali */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        {/* Tasks */}
                        <div className="flex items-center gap-1">
                          <Icon
                            icon="solar:check-circle-outline"
                            className="text-success text-sm"
                          />
                          <span className="text-default-600 font-medium">
                            {project.tasks.completed}/{project.tasks.total}
                          </span>
                        </div>

                        {/* Team */}
                        <div className="flex items-center gap-1">
                          <Icon
                            icon="solar:users-group-rounded-outline"
                            className="text-default-400 text-sm"
                          />
                          <span className="text-default-600">
                            {project.team.length}
                          </span>
                        </div>
                      </div>

                      {/* Deadline */}
                      <div className="flex items-center gap-1 text-default-500">
                        <Icon
                          icon="solar:calendar-outline"
                          className="text-sm"
                        />
                        <span className="text-xs">
                          {new Date(project.deadline).toLocaleDateString(
                            "it-IT",
                            {
                              day: "2-digit",
                              month: "short",
                            }
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Team avatars minimali */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-default-100">
                      <AvatarGroup size="sm" max={3} className="gap-1">
                        {project.team.map((member, index) => (
                          <Avatar
                            key={index}
                            src={member.avatar}
                            name={member.name}
                            size="sm"
                            className="ring-2 ring-background"
                          />
                        ))}
                      </AvatarGroup>

                      {/* Priority indicator */}
                      <div className="flex items-center gap-1">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            project.priority === "High"
                              ? "bg-danger"
                              : project.priority === "Medium"
                              ? "bg-warning"
                              : "bg-success"
                          }`}
                        />
                        <span className="text-xs text-default-500 capitalize">
                          {project.priority.toLowerCase()}
                        </span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
        </div>
      </div>
    </div>
  );
}
