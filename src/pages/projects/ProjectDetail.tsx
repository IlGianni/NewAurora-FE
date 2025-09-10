import { Button, Chip, Skeleton, Tab, Tabs } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Stato di loading
  const [isLoading, setIsLoading] = useState(true);

  // Simula il caricamento dei dati
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Dati mock per il progetto specifico
  const project = {
    id: parseInt(id || "1"),
    name: "Aurora Design System",
    description:
      "Sistema di design completo per l'applicazione Aurora con componenti riutilizzabili, palette di colori e linee guida per la coerenza visiva.",
    status: "In Progress",
    priority: "High",
    team: [
      {
        name: "Andrea",
        avatar: "https://i.pravatar.cc/150?img=1",
        role: "Lead Designer",
      },
      {
        name: "Marco",
        avatar: "https://i.pravatar.cc/150?img=2",
        role: "Frontend Developer",
      },
      {
        name: "Sofia",
        avatar: "https://i.pravatar.cc/150?img=3",
        role: "UX Designer",
      },
    ],
    deadline: "2024-02-15",
    tasks: { completed: 12, total: 16 },
    progress: 75,
    createdAt: "2024-01-01",
    updatedAt: "2024-01-15",
  };

  return (
    <div className="space-y-8 flex flex-col gap-2">
      {/* Banner Progetto Minimal */}
      {isLoading ? (
        <Skeleton className="h-80 w-full rounded-3xl" />
      ) : (
        <div
          className="relative h-80 bg-gradient-to-br from-default-50 to-default-100 rounded-3xl border border-default-200 overflow-hidden"
          style={{
            backgroundImage: `url('https://images.hdqwalls.com/wallpapers/minimal-abstract-background-4k-f2.jpg'), linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%)`,
            backgroundSize: "cover, cover",
            backgroundPosition: "center, center",
            backgroundRepeat: "no-repeat, no-repeat",
          }}
        >
          {/* Overlay per migliorare la leggibilità */}
          <div className="absolute inset-0 bg-black/10" />

          {/* Pattern geometrico sottile */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `radial-gradient(circle at 25% 25%, #000 2px, transparent 2px),
                               radial-gradient(circle at 75% 75%, #000 2px, transparent 2px)`,
                backgroundSize: "40px 40px",
              }}
            />
          </div>

          {/* Contenuto principale */}
          <div className="relative z-10 h-full flex flex-col justify-between p-8">
            {/* Header con navigazione */}
            <div className="flex items-start justify-between">
              <Button
                variant="flat"
                size="sm"
                startContent={<Icon icon="solar:arrow-left-linear" />}
                onClick={() => navigate("/projects")}
                className="bg-white/90 text-gray-800 hover:bg-white transition-colors backdrop-blur-sm border border-white/30 shadow-lg"
              >
                Progetti
              </Button>

              <Button
                variant="light"
                size="sm"
                startContent={<Icon icon="solar:settings-linear" />}
                className="bg-white/90 text-gray-800 hover:bg-white transition-colors backdrop-blur-sm border border-white/30 shadow-lg"
              >
                Impostazioni
              </Button>
            </div>

            {/* Informazioni progetto */}
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-light text-white mb-2 tracking-tight drop-shadow-lg">
                  {project.name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-white/90">
                  <div className="flex items-center gap-1">
                    <Icon
                      icon="solar:users-group-rounded-linear"
                      className="text-base"
                    />
                    <span>{project.team.length} membri</span>
                  </div>
                  <div className="w-1 h-1 bg-white/60 rounded-full" />
                  <div className="flex items-center gap-1">
                    <Icon icon="solar:calendar-linear" className="text-base" />
                    <span>
                      {new Date(project.createdAt).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-3">
                <Chip variant="solid" color="primary">
                  {project.status}
                </Chip>
                <Chip variant="solid" color="primary">
                  {project.tasks.completed}/{project.tasks.total} task
                  completate
                </Chip>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs
        aria-label="Project Details"
        variant="bordered"
        color="primary"
        classNames={{
          tabList: "bg-white border border-default-200 rounded-3xl p-2",
          cursor: "w-full rounded-3xl",
        }}
      >
        <Tab
          key="overview"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:chart-linear" className="text-lg" />
              <span>Panoramica</span>
            </div>
          }
        />
        <Tab
          key="tasks"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:checklist-linear" className="text-lg" />
              <span>Task</span>
            </div>
          }
        />
        <Tab
          key="documents"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:document-linear" className="text-lg" />
              <span>Documenti</span>
            </div>
          }
        />
        <Tab
          key="team"
          title={
            <div className="flex items-center gap-2">
              <Icon
                icon="solar:users-group-rounded-linear"
                className="text-lg"
              />
              <span>Team</span>
            </div>
          }
        />
      </Tabs>
    </div>
  );
}
