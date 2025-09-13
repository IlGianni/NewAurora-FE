import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Button,
  Skeleton,
  Input,
  Select,
  SelectItem,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  DatePicker,
} from "@heroui/react";
import { parseDate } from "@internationalized/date";
import { Icon } from "@iconify/react";
import ProjectCard from "../../components/Project/ProjectCard";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import type { Project, ProjectStatus } from "../../types";
import AlertComponent from "../../components/Layout/AlertComponent";
import type { AlertData } from "../../types";

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>([]);

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    startDate: null as Date | null,
    endDate: null as Date | null,
    teamMember: "",
  });

  // Sort states
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // UI states
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
  const [alertData, setAlertData] = useState<AlertData>({
    title: "",
    description: "",
    type: "info",
    isOpen: false,
    onClose: () => {},
  });

  // Carica i dati iniziali
  useEffect(() => {
    fetchProjectStatuses();
  }, []);

  // Filtra i progetti chiamando il backend
  useEffect(() => {
    const filterParams: Record<string, any> = {
      ...filters,
      search: searchTerm.trim() || undefined,
    };

    // Remove empty values
    Object.keys(filterParams).forEach((key) => {
      if (
        filterParams[key] === "" ||
        filterParams[key] === null ||
        filterParams[key] === undefined
      ) {
        delete filterParams[key];
      }
    });

    fetchProjects(filterParams);
  }, [searchTerm, filters]);

  // Ordina i progetti quando cambia l'ordinamento
  useEffect(() => {
    if (projects.length > 0) {
      const sortedProjects = [...projects].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sortBy) {
          case "created_at":
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
            break;
          case "start_date":
            aValue = a.start_date ? new Date(a.start_date).getTime() : 0;
            bValue = b.start_date ? new Date(b.start_date).getTime() : 0;
            break;
          case "end_date":
            aValue = a.end_date ? new Date(a.end_date).getTime() : 0;
            bValue = b.end_date ? new Date(b.end_date).getTime() : 0;
            break;
          default:
            aValue = new Date(a.created_at).getTime();
            bValue = new Date(b.created_at).getTime();
        }

        if (sortOrder === "asc") {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        } else {
          return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
        }
      });

      setFilteredProjects(sortedProjects);
    }
  }, [projects, sortBy, sortOrder]);

  const fetchProjects = async (filterParams: Record<string, any> = {}) => {
    try {
      // Build query string from filter parameters
      const queryParams = new URLSearchParams();

      if (filterParams.status)
        queryParams.append("status", filterParams.status);
      if (filterParams.startDate) {
        // Convert Date object to ISO string for backend
        const startDate =
          filterParams.startDate instanceof Date
            ? filterParams.startDate.toISOString().split("T")[0]
            : filterParams.startDate;
        queryParams.append("startDate", startDate);
      }
      if (filterParams.endDate) {
        // Convert Date object to ISO string for backend
        const endDate =
          filterParams.endDate instanceof Date
            ? filterParams.endDate.toISOString().split("T")[0]
            : filterParams.endDate;
        queryParams.append("endDate", endDate);
      }
      if (filterParams.teamMember)
        queryParams.append("teamMember", filterParams.teamMember);
      if (filterParams.search)
        queryParams.append("search", filterParams.search);

      const queryString = queryParams.toString();
      const url = queryString
        ? `/project/GET/get-projects?${queryString}`
        : "/project/GET/get-projects";

      const response = await axios.get(url);
      setProjects(response.data.projects);
      setFilteredProjects(response.data.projects);

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

  const fetchProjectStatuses = async () => {
    try {
      const response = await axios.get("/project/GET/get-project-statuses");
      setProjectStatuses(response.data.project_statuses);
      setIsLoadingStatuses(false);
    } catch (error) {
      console.error("Errore nel caricamento degli status:", error);
      setIsLoadingStatuses(false);
    }
  };

  // Filter management functions
  const updateFilter = (key: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      startDate: null,
      endDate: null,
      teamMember: "",
    });
  };

  // Sort management functions
  const handleSortChange = (newSortBy: string) => {
    if (sortBy === newSortBy) {
      // Se è già selezionato, cambia l'ordine
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Se è nuovo, imposta come nuovo criterio con ordine desc
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return "solar:sort-outline";
    return sortOrder === "asc"
      ? "solar:sort-by-alphabet-outline"
      : "solar:sort-by-alphabet-2-outline";
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.status !== "") count++;
    if (filters.startDate) count++;
    if (filters.endDate) count++;
    if (filters.teamMember !== "") count++;
    return count;
  };

  const getUniqueTeamMembers = () => {
    const members = new Set();
    projects.forEach((project) => {
      project.project_members.forEach((member) => {
        if (member.user) {
          members.add(
            JSON.stringify({
              user_id: member.user_id,
              name: member.user.name,
              surname: member.user.surname,
            })
          );
        }
      });
    });
    return Array.from(members).map((member) => JSON.parse(member as string));
  };

  // Helper function to safely format dates
  const formatDate = (date: any) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid Date";
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
          <h2 className="text-lg font-semibold text-foreground w-3/5">
            I tuoi progetti
          </h2>
          <div className="flex gap-2 w-2/5 justify-end">
            <Button
              variant="bordered"
              startContent={<Icon icon="solar:filter-outline" />}
              onPress={() => setIsFilterModalOpen(true)}
              className={getActiveFiltersCount() > 0 ? "border-primary" : ""}
            >
              Filtra
              {getActiveFiltersCount() > 0 && (
                <Chip size="sm" color="primary" className="ml-2">
                  {getActiveFiltersCount()}
                </Chip>
              )}
            </Button>

            <Select
              placeholder={sortBy ? undefined : "Ordina per"}
              selectedKeys={sortBy ? [sortBy] : []}
              onSelectionChange={(keys) => {
                const selectedKey = Array.from(keys)[0] as string;
                if (selectedKey) handleSortChange(selectedKey);
              }}
              startContent={<Icon icon={getSortIcon(sortBy)} />}
              className="w-1/2"
              variant="bordered"
              aria-label="Seleziona criterio di ordinamento"
              renderValue={(items) => {
                return items.map((item) => (
                  <div key={item.key} className="flex items-center gap-2">
                    <Icon
                      icon={getSortIcon(item.key as string)}
                      className="text-sm"
                    />
                    {item.key === "created_at" && "Data creazione"}
                    {item.key === "start_date" && "Data inizio"}
                    {item.key === "end_date" && "Data fine"}
                  </div>
                ));
              }}
            >
              <SelectItem key="created_at" textValue="Data creazione">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:calendar-outline" className="text-sm" />
                  Data creazione
                </div>
              </SelectItem>
              <SelectItem key="start_date" textValue="Data inizio">
                <div className="flex items-center gap-2">
                  <Icon icon="solar:calendar-add-outline" className="text-sm" />
                  Data inizio
                </div>
              </SelectItem>
              <SelectItem key="end_date" textValue="Data fine">
                <div className="flex items-center gap-2">
                  <Icon icon="mdi:arm-barrier-outline" className="text-sm" />
                  Data fine
                </div>
              </SelectItem>
            </Select>
            <Button
              variant="bordered"
              isIconOnly
              onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="min-w-0"
            >
              <Icon
                icon={
                  sortOrder === "asc"
                    ? "uil:sort-amount-up"
                    : "uil:sort-amount-down"
                }
                height={15}
              />
            </Button>
          </div>
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
          {(searchTerm || getActiveFiltersCount() > 0) && (
            <div className="flex items-center text-sm text-default-500">
              {filteredProjects.length} di {projects.length} progetti
            </div>
          )}
        </div>

        {/* Active Filters and Sort Display */}
        {(getActiveFiltersCount() > 0 ||
          sortBy !== "created_at" ||
          sortOrder !== "desc") && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Sort Display */}
              {(sortBy !== "created_at" || sortOrder !== "desc") && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-default-600">
                    Ordinamento:
                  </span>
                  <Chip
                    size="md"
                    color="secondary"
                    variant="flat"
                    startContent={
                      <Icon icon={getSortIcon(sortBy)} className="text-sm" />
                    }
                    className="font-medium"
                  >
                    {sortBy === "created_at" && "Data creazione"}
                    {sortBy === "start_date" && "Data inizio"}
                    {sortBy === "end_date" && "Data fine"} -{" "}
                    {sortOrder === "asc" ? "Crescente" : "Decrescente"}
                  </Chip>
                </div>
              )}

              {/* Active Filters */}
              {getActiveFiltersCount() > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-default-600">
                    Filtri:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {filters.status !== "" && (
                      <Chip
                        size="md"
                        color="primary"
                        variant="flat"
                        onClose={() => updateFilter("status", "")}
                        startContent={
                          <Icon icon="solar:tag-outline" className="text-sm" />
                        }
                        className="font-medium"
                      >
                        Status:{" "}
                        {
                          projectStatuses.find(
                            (s) =>
                              s.project_status_id === parseInt(filters.status)
                          )?.name
                        }
                      </Chip>
                    )}
                    {filters.startDate && (
                      <Chip
                        size="md"
                        color="primary"
                        variant="flat"
                        onClose={() => updateFilter("startDate", null)}
                        startContent={
                          <Icon
                            icon="solar:calendar-add-outline"
                            className="text-sm"
                          />
                        }
                        className="font-medium"
                      >
                        Da: {formatDate(filters.startDate)}
                      </Chip>
                    )}
                    {filters.endDate && (
                      <Chip
                        size="md"
                        color="primary"
                        variant="flat"
                        onClose={() => updateFilter("endDate", null)}
                        startContent={
                          <Icon
                            icon="solar:calendar-check-outline"
                            className="text-sm"
                          />
                        }
                        className="font-medium"
                      >
                        A: {formatDate(filters.endDate)}
                      </Chip>
                    )}
                    {filters.teamMember !== "" && (
                      <Chip
                        size="md"
                        color="primary"
                        variant="flat"
                        onClose={() => updateFilter("teamMember", "")}
                        startContent={
                          <Icon icon="solar:user-outline" className="text-sm" />
                        }
                        className="font-medium"
                      >
                        Team:{" "}
                        {
                          getUniqueTeamMembers().find(
                            (m) => m.user_id === parseInt(filters.teamMember)
                          )?.name
                        }
                      </Chip>
                    )}
                  </div>
                </div>
              )}

              {/* Clear All Button */}
              <Button
                size="sm"
                variant="light"
                color="danger"
                startContent={
                  <Icon icon="solar:trash-bin-minimalistic-outline" />
                }
                onPress={() => {
                  clearFilters();
                  setSortBy("created_at");
                  setSortOrder("desc");
                }}
                className="ml-auto"
              >
                Cancella tutti
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoadingProjects ? (
            // Mostra skeleton durante il caricamento
            Array.from({ length: 6 }).map((_, index) => (
              <ProjectCardSkeleton key={index} />
            ))
          ) : filteredProjects.length > 0 ? (
            // Mostra progetti filtrati quando caricati
            filteredProjects.map((project) => (
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

      {/* Filter Modal */}
      <Modal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[90vh]",
          body: "py-6",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon
                  icon="solar:filter-outline"
                  className="text-primary text-xl"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Filtra Progetti</h2>
                <p className="text-sm text-default-500">
                  Applica filtri per trovare i progetti che ti interessano
                </p>
              </div>
            </div>
          </ModalHeader>
          <ModalBody className="space-y-8">
            {/* Status Filter Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-default-200">
                <Icon
                  icon="solar:tag-outline"
                  className="text-primary text-lg"
                />
                <h3 className="text-lg font-medium text-foreground">
                  Status del Progetto
                </h3>
              </div>
              <div className="space-y-3">
                <Select
                  placeholder="Seleziona uno status del progetto"
                  selectedKeys={filters.status ? [filters.status] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    updateFilter("status", selectedKey || "");
                  }}
                  isLoading={isLoadingStatuses}
                  isDisabled={isLoadingStatuses}
                  startContent={
                    <Icon
                      icon="solar:tag-outline"
                      className="text-default-400"
                    />
                  }
                  classNames={{
                    trigger: "h-12",
                  }}
                >
                  {projectStatuses.map((status) => (
                    <SelectItem key={status.project_status_id.toString()}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: status.color || "#6b7280" }}
                        />
                        <span className="font-medium">{status.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
                {filters.status && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <Icon
                      icon="solar:check-circle-outline"
                      className="text-success"
                    />
                    <span>
                      Status selezionato:{" "}
                      {
                        projectStatuses.find(
                          (s) =>
                            s.project_status_id === parseInt(filters.status)
                        )?.name
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Date Range Filters Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-default-200">
                <Icon
                  icon="solar:calendar-outline"
                  className="text-primary text-lg"
                />
                <h3 className="text-lg font-medium text-foreground">
                  Periodo del Progetto
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Icon
                      icon="solar:calendar-add-outline"
                      className="text-default-500"
                    />
                    Data di Inizio
                  </label>
                  <DatePicker
                    value={
                      filters.startDate
                        ? parseDate(
                            filters.startDate.toISOString().split("T")[0]
                          )
                        : null
                    }
                    onChange={(date) =>
                      updateFilter(
                        "startDate",
                        date ? new Date(date.toString()) : null
                      )
                    }
                    className="w-full"
                    classNames={{
                      inputWrapper: "h-12",
                    }}
                  />
                  {filters.startDate && (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <Icon
                        icon="solar:check-circle-outline"
                        className="text-success"
                      />
                      <span>Da: {formatDate(filters.startDate)}</span>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Icon
                      icon="solar:calendar-check-outline"
                      className="text-default-500"
                    />
                    Data di Fine
                  </label>
                  <DatePicker
                    value={
                      filters.endDate
                        ? parseDate(filters.endDate.toISOString().split("T")[0])
                        : null
                    }
                    onChange={(date) =>
                      updateFilter(
                        "endDate",
                        date ? new Date(date.toString()) : null
                      )
                    }
                    className="w-full"
                    classNames={{
                      inputWrapper: "h-12",
                    }}
                  />
                  {filters.endDate && (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <Icon
                        icon="solar:check-circle-outline"
                        className="text-success"
                      />
                      <span>A: {formatDate(filters.endDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Team Member Filter Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-default-200">
                <Icon
                  icon="solar:user-outline"
                  className="text-primary text-lg"
                />
                <h3 className="text-lg font-medium text-foreground">
                  Membro del Team
                </h3>
              </div>
              <div className="space-y-3">
                <Select
                  placeholder="Seleziona un membro del team"
                  selectedKeys={filters.teamMember ? [filters.teamMember] : []}
                  onSelectionChange={(keys) => {
                    const selectedKey = Array.from(keys)[0] as string;
                    updateFilter("teamMember", selectedKey || "");
                  }}
                  startContent={
                    <Icon
                      icon="solar:user-outline"
                      className="text-default-400"
                    />
                  }
                  classNames={{
                    trigger: "h-12",
                  }}
                >
                  {getUniqueTeamMembers().map((member) => (
                    <SelectItem key={member.user_id.toString()}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Icon
                            icon="solar:user-outline"
                            className="text-primary text-sm"
                          />
                        </div>
                        <span className="font-medium">
                          {member.name} {member.surname}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </Select>
                {filters.teamMember !== "" && (
                  <div className="flex items-center gap-2 text-sm text-success">
                    <Icon
                      icon="solar:check-circle-outline"
                      className="text-success"
                    />
                    <span>
                      Team selezionato:{" "}
                      {
                        getUniqueTeamMembers().find(
                          (m) => m.user_id === parseInt(filters.teamMember)
                        )?.name
                      }
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Active Filters Summary */}
            {getActiveFiltersCount() > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-default-200">
                  <Icon
                    icon="solar:settings-outline"
                    className="text-primary text-lg"
                  />
                  <h3 className="text-lg font-medium text-foreground">
                    Filtri Attivi
                  </h3>
                </div>
                <div className="p-4 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-primary/20">
                  <div className="flex flex-wrap gap-3">
                    {filters.status !== "" && (
                      <Chip
                        size="md"
                        color="primary"
                        variant="flat"
                        startContent={
                          <Icon icon="solar:tag-outline" className="text-xs" />
                        }
                        className="font-medium"
                      >
                        Status:{" "}
                        {
                          projectStatuses.find(
                            (s) =>
                              s.project_status_id === parseInt(filters.status)
                          )?.name
                        }
                      </Chip>
                    )}
                    {filters.startDate && (
                      <Chip
                        size="md"
                        color="primary"
                        variant="flat"
                        startContent={
                          <Icon
                            icon="solar:calendar-add-outline"
                            className="text-xs"
                          />
                        }
                        className="font-medium"
                      >
                        Da: {formatDate(filters.startDate)}
                      </Chip>
                    )}
                    {filters.endDate && (
                      <Chip
                        size="md"
                        color="primary"
                        variant="flat"
                        startContent={
                          <Icon
                            icon="solar:calendar-check-outline"
                            className="text-xs"
                          />
                        }
                        className="font-medium"
                      >
                        A: {formatDate(filters.endDate)}
                      </Chip>
                    )}
                    {filters.teamMember !== "" && (
                      <Chip
                        size="md"
                        color="primary"
                        variant="flat"
                        startContent={
                          <Icon icon="solar:user-outline" className="text-xs" />
                        }
                        className="font-medium"
                      >
                        Team:{" "}
                        {
                          getUniqueTeamMembers().find(
                            (m) => m.user_id === parseInt(filters.teamMember)
                          )?.name
                        }
                      </Chip>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="pt-6 border-t border-default-200">
            <div className="flex justify-between w-full">
              <Button
                variant="light"
                color="danger"
                onPress={clearFilters}
                isDisabled={getActiveFiltersCount() === 0}
                startContent={
                  <Icon icon="solar:trash-bin-minimalistic-outline" />
                }
              >
                Cancella Tutti
              </Button>
              <div className="flex gap-3">
                <Button
                  variant="light"
                  onPress={() => setIsFilterModalOpen(false)}
                >
                  Chiudi
                </Button>
                <Button
                  color="primary"
                  onPress={() => setIsFilterModalOpen(false)}
                  startContent={<Icon icon="solar:check-circle-outline" />}
                >
                  Applica Filtri
                </Button>
              </div>
            </div>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
