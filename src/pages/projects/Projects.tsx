import { useState, useEffect } from "react";
import { Card, CardBody, Button, Skeleton, Input } from "@heroui/react";
import { Icon } from "@iconify/react";
import ProjectCard from "../../components/Project/ProjectCard";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { Project } from "../../types";
import AlertComponent from "../../components/Layout/AlertComponent";
import type { AlertData } from "../../types";

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // UI states
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [alertData, setAlertData] = useState<AlertData>({
    title: "",
    description: "",
    type: "info",
    isOpen: false,
    onClose: () => {},
  });

  // Carica i dati iniziali
  useEffect(() => {
    fetchProjects();
  }, []);

  // Filtra i progetti chiamando il backend
  useEffect(() => {
    fetchProjects(searchTerm.trim() || undefined);
  }, [searchTerm]);

  const fetchProjects = async (searchTerm?: string) => {
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) {
        queryParams.append("search", searchTerm);
      }

      const queryString = queryParams.toString();
      const url = queryString
        ? `/project/GET/get-projects?${queryString}`
        : "/project/GET/get-projects";

      const response = await axios.get(url);
      setProjects(response.data.projects);

      if (response.status === 200) {
        setIsLoadingProjects(false);
        setIsLoadingStats(false);
      }
    } catch (error) {
      console.error("Errore nel caricamento dei progetti:", error);
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

  const deleteProject = async (project_id: number) => {
    try {
      setIsLoadingProjects(true);
      const response = await axios.delete(`/project/DELETE/delete-project`, {
        data: { project_id: project_id },
      });

      if (response.status === 200) {
        setAlertData({
          title: "Progetto eliminato con successo",
          description: "Il progetto è stato eliminato con successo",
          type: "success",
          isOpen: true,
          onClose: () => {},
        });
        fetchProjects();
      }
    } catch (error) {
      setAlertData({
        title: "Errore nell'eliminazione del progetto",
        description:
          "Si è verificato un errore durante l'eliminazione del progetto",
        type: "error",
        isOpen: true,
        onClose: () => {},
      });
      console.error("Errore nell'eliminazione del progetto:", error);
      setIsLoadingProjects(false);
    }
  };

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
      <AlertComponent
        title={alertData.title}
        description={alertData.description}
        type={alertData.type}
        isOpen={alertData.isOpen}
        onClose={() =>
          setAlertData({
            title: "",
            description: "",
            type: "info",
            isOpen: false,
            onClose: () => {},
          })
        }
      />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Progetti</h1>
          <p className="text-sm text-default-500 mt-1">
            Gestisci e monitora tutti i tuoi progetti
          </p>
        </div>
        {projects.length > 0 && (
          <Button
            color="primary"
            size="sm"
            startContent={<Icon icon="mdi:folder-add" />}
            onPress={() => navigate("/projects/create")}
          >
            Nuovo Progetto
          </Button>
        )}
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            I tuoi progetti
          </h2>
        </div>

        {/* Barra di ricerca */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Cerca per nome progetto..."
            value={searchTerm}
            variant="bordered"
            onChange={(e) => setSearchTerm(e.target.value)}
            startContent={<Icon icon="solar:magnifer-outline" />}
            endContent={
              searchTerm && (
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={() => setSearchTerm("")}
                  className="min-w-0 w-6 h-6"
                >
                  <Icon
                    icon="solar:close-circle-outline"
                    className="text-default-400"
                  />
                </Button>
              )
            }
            className="max-w-md"
          />
          {searchTerm && (
            <div className="flex items-center text-sm text-default-500">
              {projects.length} progetti trovati
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoadingProjects ? (
            // Mostra skeleton durante il caricamento
            Array.from({ length: 6 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))
          ) : projects.length > 0 ? (
            // Mostra progetti quando caricati
            projects.map((project) => (
              <ProjectCard
                key={project.project_id}
                project={project}
                deleteProject={deleteProject}
              />
            ))
          ) : !isLoadingProjects && searchTerm ? (
            // Empty state quando la ricerca non trova risultati (solo dopo il caricamento)
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <Icon
                    icon="solar:magnifer-outline"
                    className="text-6xl text-default-300 mx-auto"
                  />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nessun progetto trovato
                </h3>
                <p className="text-default-500 mb-6">
                  Non ci sono progetti che corrispondono alla ricerca "
                  {searchTerm}".
                </p>
                <Button
                  variant="bordered"
                  size="md"
                  startContent={<Icon icon="solar:close-circle-outline" />}
                  onPress={() => setSearchTerm("")}
                >
                  Cancella ricerca
                </Button>
              </div>
            </div>
          ) : !isLoadingProjects && projects.length === 0 ? (
            // Empty state quando non ci sono progetti (solo dopo il caricamento e se non ci sono progetti)
            <div className="col-span-full flex flex-col items-center justify-center py-16 px-4">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <Icon
                    icon="solar:folder-open-outline"
                    className="text-6xl text-default-300 mx-auto"
                  />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nessun progetto trovato
                </h3>
                <p className="text-default-500 mb-6">
                  Inizia creando il tuo primo progetto per organizzare e gestire
                  i tuoi lavori.
                </p>
                <Button
                  color="primary"
                  size="md"
                  startContent={<Icon icon="mdi:folder-add" />}
                  onPress={() => navigate("/projects/create")}
                >
                  Crea il tuo primo progetto
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
