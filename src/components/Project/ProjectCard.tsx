import {
  Card,
  CardBody,
  Chip,
  AvatarGroup,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Button,
} from "@heroui/react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { useNavigate } from "react-router-dom";
import type { Project } from "../../types";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const navigate = useNavigate();

  const handleProjectClick = (projectId: number) => {
    // Prova prima con navigate
    try {
      navigate(`/projects/${projectId}`);
    } catch (error) {
      console.error("Navigation error:", error);
      // Fallback con window.location
      window.location.href = `/projects/${projectId}`;
    }
  };

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

  return (
    <Card
      isPressable
      key={project.project_id}
      className="shadow-none border border-primary/20 hover:shadow-lg hover:border-primary/30  transition-all duration-300 cursor-pointer group"
      onClick={() => handleProjectClick(parseInt(project.project_id))}
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

          <div className="flex items-center gap-2 ml-3">
            <Chip
              size="sm"
              color={getStatusColor(project.project_status.name) as any}
              variant="flat"
              className="text-xs"
            >
              {project.project_status.name}
            </Chip>

            {/* Dropdown per modifiche rapide */}
            <Dropdown showArrow>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Icon icon="solar:settings-outline" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Modifica rapida progetto"
                variant="flat"
              >
                <DropdownItem
                  key="edit"
                  startContent={<Icon icon="solar:pen-outline" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.project_id}/edit`);
                  }}
                >
                  Modifica Progetto
                </DropdownItem>
                <DropdownItem
                  key="status"
                  startContent={<Icon icon="solar:chart-outline" />}
                >
                  Cambia Status
                </DropdownItem>

                <DropdownItem
                  key="priority"
                  startContent={<Icon icon="solar:flag-outline" />}
                >
                  Cambia Priorità
                </DropdownItem>
                <DropdownItem
                  color="danger"
                  key="edit"
                  startContent={<Icon icon="fluent:delete-12-regular" />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/projects/${project.project_id}/edit`);
                  }}
                >
                  Elimina Progetto
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>

        {/* Informazioni essenziali */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            {/* Tasks - placeholder per ora */}
            <div className="flex items-center gap-1">
              <Icon
                icon="solar:check-circle-outline"
                className="text-success text-sm"
              />
              <span className="text-default-600 font-medium">0/0</span>
            </div>

            {/* Team */}
            <div className="flex items-center gap-1">
              <Icon
                icon="solar:users-group-rounded-outline"
                className="text-default-400 text-sm"
              />
              <span className="text-default-600">
                {project.project_members.length}
              </span>
            </div>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-1 text-default-500">
            <Icon icon="solar:calendar-outline" className="text-sm" />
            <span className="text-xs">
              {project.end_date
                ? new Date(project.end_date).toLocaleDateString("it-IT", {
                    day: "2-digit",
                    month: "short",
                  })
                : "N/A"}
            </span>
          </div>
        </div>

        {/* Team avatars minimali */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-default-100">
          <AvatarGroup size="sm" max={3} className="gap-1">
            {project.project_members.map((member, index) => (
              <Avatar
                key={member.project_member_id || index}
                src={undefined}
                name={`${member.user?.name || "Unknown"} ${
                  member.user?.surname || ""
                }`}
                size="sm"
                className="ring-2 ring-background"
              />
            ))}
          </AvatarGroup>

          {/* Priority indicator - placeholder per ora */}
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success" />
            <span className="text-xs text-default-500 capitalize">normal</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
