import { useState, useEffect } from "react";
import { Card, CardBody, Button, Skeleton } from "@heroui/react";
import { Icon } from "@iconify/react";
import ProjectCard from "../../components/Project/ProjectCard";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { Project } from "../../types";

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  // Stati di loading
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Simula il caricamento dei dati
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const response = await axios.get("/project/GET/get-projects");
    setProjects(response.data.projects);

    if (response.status === 200) {
      setIsLoadingProjects(false);
      setIsLoadingStats(false);
    }
  };

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
      title: "Task Rimanenti",
      value: 12,
      icon: "solar:clipboard-list-bold",
      iconColor: "text-warning",
      changeType: "neutral",
      trendChipPosition: "bottom",
      trendType: "neutral",
      trendChipVariant: "flat",
    },
    {
      title: "Team Members",
      value: 8,
      icon: "solar:users-group-rounded-bold",
      iconColor: "text-danger",
      changeType: "negative",
      trendChipPosition: "top",
      trendType: "down",
      trendChipVariant: "flat",
    },
  ];

  // Componente skeleton per le statistiche
  const StatisticSkeleton = () => (
    <Card className="shadow-none border border-primary/20">
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
    <Card className="shadow-none border border-primary/20">
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
          startContent={<Icon icon="mdi:folder-add" />}
          onPress={() => navigate("/projects/create")}
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
              <Card
                key={index}
                className="shadow-none border border-primary/20"
              >
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
                <ProjectCard key={project.project_id} project={project} />
              ))}
        </div>
      </div>
    </div>
  );
}
