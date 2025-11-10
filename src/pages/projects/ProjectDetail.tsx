import { Button, Chip, Skeleton, Tab, Tabs } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ProjectDetailTask from "../../components/Project/ProjectDetail/ProjectDetailTask";
import VaultView from "../../components/Project/ProjectDetail/VaultView";
import type { Project } from "../../types";
import axios from "axios";

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Stato di loading
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);
  useEffect(() => {
    setIsLoading(true);
    axios
      .get(`/project/GET/get-project-by-unique-id`, {
        params: {
          unique_id: id,
        },
      })
      .then((res) => {
        if (res.status === 200) {
          setProject(res.data.project);
          setIsLoading(false);
        }
      });
  }, [id]);

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
                variant="solid"
                size="sm"
                startContent={<Icon icon="solar:arrow-left-linear" />}
                onClick={() => navigate("/projects")}
                color="primary"
              >
                Progetti
              </Button>

              <Button
                variant="solid"
                size="sm"
                color="primary"
                startContent={<Icon icon="solar:settings-linear" />}
              >
                Impostazioni
              </Button>
            </div>

            {/* Informazioni progetto */}
            <div className="space-y-4">
              <div>
                <h1 className="text-4xl font-light text-white mb-2 tracking-tight drop-shadow-lg">
                  {project!.name}
                </h1>
                <div className="flex items-center gap-4 text-sm text-white/90">
                  <div className="flex items-center gap-1">
                    <Icon
                      icon="solar:users-group-rounded-linear"
                      className="text-base"
                    />
                    <span>{project!.project_members.length} membri</span>
                  </div>
                  <div className="w-1 h-1 bg-white/60 rounded-full" />
                  <div className="flex items-center gap-1">
                    <Icon icon="solar:calendar-linear" className="text-base" />
                    <span>
                      {new Date(project!.created_at).toLocaleDateString(
                        "it-IT",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status badge */}
              <div className="flex items-center gap-3">
                <Chip variant="solid" color="primary">
                  {project!.project_status.name}
                </Chip>
                <Chip variant="solid" color="primary">
                  {
                    project!.tasks.filter(
                      (task) => task.task_status.name === "completed"
                    ).length
                  }
                  /{project!.tasks.length} task completate
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
          tabList:
            "bg-white border border-default-200 rounded-3xl p-2 overflow-hidden",
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
        >
          <h1>Panoramica</h1>
        </Tab>
        <Tab
          key="tasks"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:checklist-linear" className="text-lg" />
              <span>Task</span>
            </div>
          }
        >
          <ProjectDetailTask unique_id={id || ""} />
        </Tab>
        <Tab
          key="documents"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:document-linear" className="text-lg" />
              <span>Documenti</span>
            </div>
          }
        >
          <h1>Documenti</h1>
        </Tab>
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
        >
          <h1>Team</h1>
        </Tab>
        <Tab
          key="vault"
          title={
            <div className="flex items-center gap-2">
              <Icon icon="solar:lock-password-linear" className="text-lg" />
              <span>Vault</span>
            </div>
          }
        >
          {project && <VaultView projectId={project.project_id} />}
        </Tab>
      </Tabs>
    </div>
  );
}
