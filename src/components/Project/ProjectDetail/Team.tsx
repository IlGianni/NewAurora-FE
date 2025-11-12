import {
  Card,
  CardBody,
  Chip,
  Avatar,
  AvatarGroup,
  Button,
  Input,
  Badge,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useState, useMemo } from "react";

// Interfaccia per i membri del team (placeholder)
interface TeamMember {
  id: number;
  name: string;
  surname: string;
  email: string;
  role: string;
  avatar?: string;
  tasksCompleted: number;
  tasksInProgress: number;
  tasksTotal: number;
  joinedAt: string;
  status: "online" | "offline" | "away";
}

// Dati placeholder per i membri del team
const placeholderMembers: TeamMember[] = [
  {
    id: 1,
    name: "Marco",
    surname: "Rossi",
    email: "marco.rossi@example.com",
    role: "Project Manager",
    tasksCompleted: 12,
    tasksInProgress: 3,
    tasksTotal: 15,
    joinedAt: "2024-01-15",
    status: "online",
  },
  {
    id: 2,
    name: "Laura",
    surname: "Bianchi",
    email: "laura.bianchi@example.com",
    role: "Frontend Developer",
    tasksCompleted: 8,
    tasksInProgress: 5,
    tasksTotal: 13,
    joinedAt: "2024-02-01",
    status: "online",
  },
  {
    id: 3,
    name: "Giuseppe",
    surname: "Verdi",
    email: "giuseppe.verdi@example.com",
    role: "Backend Developer",
    tasksCompleted: 15,
    tasksInProgress: 2,
    tasksTotal: 17,
    joinedAt: "2024-01-20",
    status: "away",
  },
  {
    id: 4,
    name: "Anna",
    surname: "Neri",
    email: "anna.neri@example.com",
    role: "UI/UX Designer",
    tasksCompleted: 6,
    tasksInProgress: 4,
    tasksTotal: 10,
    joinedAt: "2024-02-10",
    status: "online",
  },
  {
    id: 5,
    name: "Luca",
    surname: "Ferrari",
    email: "luca.ferrari@example.com",
    role: "Full Stack Developer",
    tasksCompleted: 10,
    tasksInProgress: 6,
    tasksTotal: 16,
    joinedAt: "2024-01-25",
    status: "offline",
  },
];

// Funzione helper per ottenere il colore del ruolo
const getRoleColor = (
  role: string
): "primary" | "secondary" | "success" | "warning" | "danger" | "default" => {
  const roleLower = role.toLowerCase();
  if (roleLower.includes("manager")) return "primary";
  if (roleLower.includes("developer")) return "success";
  if (roleLower.includes("designer")) return "secondary";
  return "default";
};

// Funzione helper per ottenere l'icona del ruolo
const getRoleIcon = (role: string): string => {
  const roleLower = role.toLowerCase();
  if (roleLower.includes("manager")) return "solar:user-id-bold";
  if (roleLower.includes("developer")) return "solar:code-bold";
  if (roleLower.includes("designer")) return "solar:palette-bold";
  return "solar:user-bold";
};

// Funzione helper per ottenere il colore dello status
const getStatusColor = (status: string): "success" | "warning" | "default" => {
  switch (status) {
    case "online":
      return "success";
    case "away":
      return "warning";
    default:
      return "default";
  }
};

export default function Team() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("Tutti");
  const [members] = useState<TeamMember[]>(placeholderMembers);

  // Filtra i membri in base alla ricerca e al ruolo
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const matchesSearch =
        !searchQuery.trim() ||
        `${member.name} ${member.surname}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        selectedRole === "Tutti" || member.role === selectedRole;

      return matchesSearch && matchesRole;
    });
  }, [members, searchQuery, selectedRole]);

  // Calcola le statistiche
  const statistics = useMemo(() => {
    const total = members.length;
    const online = members.filter((m) => m.status === "online").length;
    const totalTasks = members.reduce((sum, m) => sum + m.tasksTotal, 0);
    const completedTasks = members.reduce(
      (sum, m) => sum + m.tasksCompleted,
      0
    );
    const roles = [...new Set(members.map((m) => m.role))];

    return {
      total,
      online,
      totalTasks,
      completedTasks,
      roles,
    };
  }, [members]);

  // Ruoli disponibili per il filtro
  const availableRoles = useMemo(() => {
    return ["Tutti", ...statistics.roles];
  }, [statistics.roles]);

  return (
    <div className="space-y-6">
      {/* Statistiche del Team */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-none border border-default-200 hover:border-primary/30 transition-colors">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-default-500 mb-1">Membri Totali</p>
                <p className="text-2xl font-semibold text-foreground">
                  {statistics.total}
                </p>
              </div>
              <div className="bg-primary/10 text-primary p-3 rounded-xl">
                <Icon
                  icon="solar:users-group-rounded-bold"
                  className="text-2xl"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-none border border-default-200 hover:border-success/30 transition-colors">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-default-500 mb-1">Online</p>
                <p className="text-2xl font-semibold text-foreground">
                  {statistics.online}
                </p>
              </div>
              <div className="bg-success/10 text-success p-3 rounded-xl">
                <Icon
                  icon="solar:user-check-rounded-bold"
                  className="text-2xl"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-none border border-default-200 hover:border-warning/30 transition-colors">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-default-500 mb-1">Task Totali</p>
                <p className="text-2xl font-semibold text-foreground">
                  {statistics.totalTasks}
                </p>
              </div>
              <div className="bg-warning/10 text-warning p-3 rounded-xl">
                <Icon
                  icon="solar:checklist-minimalistic-bold"
                  className="text-2xl"
                />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="shadow-none border border-default-200 hover:border-danger/30 transition-colors">
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs text-default-500 mb-1">Task Completate</p>
                <p className="text-2xl font-semibold text-foreground">
                  {statistics.completedTasks}
                </p>
              </div>
              <div className="bg-danger/10 text-danger p-3 rounded-xl">
                <Icon icon="solar:check-circle-bold" className="text-2xl" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filtri e Ricerca */}
      <Card className="shadow-none border border-default-200">
        <CardBody className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full sm:w-auto">
              <Input
                placeholder="Cerca per nome, email o ruolo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="md"
                startContent={
                  <Icon
                    icon="solar:magnifer-linear"
                    className="text-default-400"
                  />
                }
                isClearable
                onClear={() => setSearchQuery("")}
                className="flex-1"
              />

              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="bordered"
                    size="md"
                    startContent={<Icon icon="solar:filter-bold" />}
                    endContent={<Icon icon="solar:alt-arrow-down-linear" />}
                  >
                    {selectedRole}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Filtro ruoli"
                  selectedKeys={[selectedRole]}
                  onAction={(key) => setSelectedRole(key as string)}
                >
                  {availableRoles.map((role) => (
                    <DropdownItem key={role}>{role}</DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>

            <Button
              color="primary"
              variant="flat"
              startContent={<Icon icon="solar:user-plus-bold" />}
            >
              Aggiungi Membro
            </Button>
          </div>

          {/* Contatore risultati */}
          <div className="mt-4 pt-4 border-t border-default-200">
            <p className="text-sm text-default-500">
              Mostrando{" "}
              <span className="font-semibold text-foreground">
                {filteredMembers.length}
              </span>{" "}
              di{" "}
              <span className="font-semibold text-foreground">
                {members.length}
              </span>{" "}
              membri
            </p>
          </div>
        </CardBody>
      </Card>

      {/* Lista Membri del Team */}
      {filteredMembers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const completionRate =
              member.tasksTotal > 0
                ? (member.tasksCompleted / member.tasksTotal) * 100
                : 0;

            return (
              <Card
                key={member.id}
                className="shadow-none border border-default-200 hover:border-primary/30 hover:shadow-md transition-all duration-300"
              >
                <CardBody className="p-6">
                  {/* Header con Avatar e Status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge
                        content=""
                        color={getStatusColor(member.status)}
                        size="sm"
                        placement="bottom-right"
                        shape="circle"
                      >
                        <Avatar
                          src={member.avatar}
                          name={`${member.name} ${member.surname}`}
                          size="lg"
                          className="ring-2 ring-background"
                        />
                      </Badge>
                      <div>
                        <h3 className="font-semibold text-base text-foreground">
                          {member.name} {member.surname}
                        </h3>
                        <p className="text-xs text-default-500">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ruolo */}
                  <div className="mb-4">
                    <Chip
                      color={getRoleColor(member.role)}
                      variant="flat"
                      size="sm"
                      startContent={
                        <Icon
                          icon={getRoleIcon(member.role)}
                          className="text-sm"
                        />
                      }
                    >
                      {member.role}
                    </Chip>
                  </div>

                  {/* Statistiche Task */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-default-500">Task Completate</span>
                      <span className="font-semibold text-foreground">
                        {member.tasksCompleted} / {member.tasksTotal}
                      </span>
                    </div>
                    <div className="w-full bg-default-100 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Icon
                            icon="solar:check-circle-bold"
                            className="text-success text-sm"
                          />
                          <span className="text-default-600">
                            {member.tasksCompleted}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Icon
                            icon="solar:clock-circle-bold"
                            className="text-warning text-sm"
                          />
                          <span className="text-default-600">
                            {member.tasksInProgress}
                          </span>
                        </div>
                      </div>
                      <span className="text-default-500 font-medium">
                        {completionRate.toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Data di ingresso */}
                  <div className="pt-4 border-t border-default-200">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-default-500">
                        <Icon
                          icon="solar:calendar-linear"
                          className="text-sm"
                        />
                        <span>Entrato il</span>
                      </div>
                      <span className="text-foreground font-medium">
                        {new Date(member.joinedAt).toLocaleDateString("it-IT", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  {/* Azioni */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-default-200">
                    <Button
                      size="sm"
                      variant="light"
                      color="default"
                      startContent={<Icon icon="solar:eye-bold" />}
                      className="flex-1"
                    >
                      Visualizza
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      color="primary"
                      startContent={<Icon icon="solar:chat-round-linear" />}
                      className="flex-1"
                    >
                      Contatta
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      color="default"
                      isIconOnly
                    >
                      <Icon icon="solar:settings-linear" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="shadow-none border border-default-200">
          <CardBody className="py-16">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-default-100 flex items-center justify-center mb-6">
                <Icon
                  icon="solar:user-cross-rounded-bold"
                  className="text-default-400"
                  width={40}
                />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Nessun membro trovato
              </h3>
              <p className="text-default-500 mb-6 max-w-md">
                Non ci sono membri del team che corrispondono ai criteri di
                ricerca. Prova a modificare i filtri o la ricerca.
              </p>
              <Button
                color="primary"
                variant="flat"
                onPress={() => {
                  setSearchQuery("");
                  setSelectedRole("Tutti");
                }}
                startContent={<Icon icon="solar:refresh-bold" />}
              >
                Resetta Filtri
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Vista Compatta (opzionale) */}
      <Card className="shadow-none border border-default-200">
        <CardBody className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Icon
                icon="solar:users-group-rounded-bold-duotone"
                className="text-lg"
              />
              Tutti i Membri
            </h3>
            <Chip size="sm" variant="flat" color="primary">
              {members.length} membri
            </Chip>
          </div>
          <AvatarGroup size="md" max={10} className="justify-start">
            {members.map((member) => (
              <Avatar
                key={member.id}
                src={member.avatar}
                name={`${member.name} ${member.surname}`}
                className="ring-2 ring-background"
              />
            ))}
          </AvatarGroup>
        </CardBody>
      </Card>
    </div>
  );
}
