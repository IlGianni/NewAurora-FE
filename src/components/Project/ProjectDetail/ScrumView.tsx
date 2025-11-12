import {
  closestCorners,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Tab,
  Tabs,
  Textarea,
  useDisclosure,
  addToast,
  DatePicker,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";
import type { Sprint, Task, TaskPriority, TaskStatus } from "../../../types";
import SprintKanbanView from "./SprintKanbanView";
import { parseDate } from "@internationalized/date";
import { I18nProvider } from "@react-aria/i18n";

interface ScrumViewProps {
  projectId: number;
}

// Componente per singolo task drag & drop
function SortableTask({
  task,
  onTaskClick,
  onMoveTask,
  availableSprints,
  handleDeleteTask,
}: {
  task: Task;
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: number, targetSprintId: number | null) => void;
  availableSprints: Sprint[];
  handleDeleteTask: (taskId: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.task_id,
    transition: {
      duration: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        className="mb-3 bg-default/10 border border-default-50 rounded-lg hover:border-primary-200 hover:shadow-md transition-all duration-200 overflow-hidden"
        style={{
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        <div className="flex items-start gap-3 p-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing pt-0.5 -ml-1 px-1 py-2 rounded hover:bg-default-100 transition-colors"
            title="Trascina per spostare"
          >
            <Icon
              icon="solar:hamburger-menu-linear"
              className="text-default-400 group-hover:text-default-600 text-base transition-colors"
            />
          </div>

          {/* Task Content */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={(e) => {
              if (!isDragging) {
                e.stopPropagation();
                onTaskClick(task);
              }
            }}
          >
            <div className="flex items-start justify-start gap-2 mb-2">
              <h4 className="font-semibold text-sm text-default-900 leading-snug">
                {task.title}
              </h4>
              {task.task_status.name.toLowerCase() === "completed" && (
                <span className="text-[10px] font-medium px-2 py-0.5 bg-success-100 text-primary rounded-full">
                  Completato
                </span>
              )}
            </div>

            {task.description && (
              <p className="text-xs text-default-500 line-clamp-2 mb-3 leading-relaxed">
                {task.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Chip
                  color={task.task_priority?.color as any}
                  variant="flat"
                  size="sm"
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                >
                  {task.task_priority?.name
                    .split(" ")
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(" ")}
                </Chip>
                {task.story_points && (
                  <Chip
                    variant="flat"
                    size="sm"
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  >
                    {task.story_points} SP
                  </Chip>
                )}
              </div>

              <Dropdown>
                <DropdownTrigger>
                  <Button
                    isIconOnly
                    variant="flat"
                    size="sm"
                    className="min-w-7 w-7 h-7 opacity-0 group-hover:opacity-100 transition-all hover:bg-default-200"
                    title="Altre azioni"
                  >
                    <Icon icon="solar:menu-dots-bold" className="text-base" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu aria-label="Azioni Task">
                  <DropdownItem
                    color="primary"
                    key="view"
                    onPress={() => onTaskClick(task)}
                    startContent={<Icon icon="solar:eye-linear" />}
                  >
                    Visualizza dettagli
                  </DropdownItem>
                  <>
                    {availableSprints.map((sprint: Sprint) => (
                      <DropdownItem
                        color="primary"
                        key={sprint.sprint_id}
                        onPress={() =>
                          onMoveTask(task.task_id, sprint.sprint_id)
                        }
                        startContent={<Icon icon="solar:rocket-2-linear" />}
                      >
                        Sposta in {sprint.name}
                      </DropdownItem>
                    ))}
                    {task.sprint_id !== null && (
                      <DropdownItem
                        color="primary"
                        key="backlog"
                        onPress={() => onMoveTask(task.task_id, null)}
                        startContent={
                          <Icon icon="solar:clipboard-list-linear" />
                        }
                      >
                        Sposta nel Backlog
                      </DropdownItem>
                    )}
                  </>
                  <DropdownItem
                    key="delete-task"
                    className="text-danger"
                    color="danger"
                    startContent={<Icon icon="solar:trash-bin-trash-linear" />}
                    onPress={() => handleDeleteTask(task.task_id)}
                  >
                    Elimina Task
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ScrumView({ projectId }: ScrumViewProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [sprintModalOpen, setSprintModalOpen] = useState(false);
  const [editSprintId, setEditSprintId] = useState<number | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [TaskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [TaskPriorities, setTaskPriorities] = useState<TaskPriority[]>([]);
  const [update, setUpdate] = useState(false);
  const [loading, setLoading] = useState(0);

  useEffect(() => {
    setLoading((prev) => prev - 2); // -2 per le due chiamate API
    axios
      .get(`/project/GET/get-task-statuses`, {
        params: { project_id: projectId },
      })
      .then((res) => {
        if (res.status === 200) {
          // Ordina le colonne: "completed" va per ultima
          const sortedStatuses = res.data.task_statuses.sort(
            (a: TaskStatus, b: TaskStatus) => {
              const aName = a.name.toLowerCase();
              const bName = b.name.toLowerCase();
              const isACompleted = aName === "completed";
              const isBCompleted = bName === "completed";

              if (isACompleted && !isBCompleted) return 1;
              if (!isACompleted && isBCompleted) return -1;
              return 0;
            }
          );
          setTaskStatuses(sortedStatuses);
          setTaskStatuses(res.data.task_statuses);
          setLoading((prev) => prev + 1);
        }
      });
    axios.get(`/project/GET/get-task-priorities`).then((res) => {
      if (res.status === 200) {
        setTaskPriorities(res.data.task_priorities);
        setLoading((prev) => prev + 1);
      }
    });
  }, [projectId]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Dati mock - da sostituire con chiamate API
  const [backlog, setBacklog] = useState<Task[]>([]);

  const [sprints, setSprints] = useState<Sprint[]>([]);

  useEffect(() => {
    setLoading((prev) => prev - 2);
    axios
      .get(`/project/GET/get-sprints-by-project-id`, {
        params: { project_id: projectId },
      })
      .then((res) => {
        if (res.status === 200) {
          setSprints(res.data.sprints);
          setLoading((prev) => prev + 1);
        }
      });

    axios
      .get(`/project/GET/get-backlog-by-project-id`, {
        params: { project_id: projectId },
      })
      .then((res) => {
        if (res.status === 200) {
          setBacklog(res.data.backlog);
          setLoading((prev) => prev + 1);
        }
      });
  }, [projectId, update]);

  // Form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    task_status_id: TaskStatuses[0]?.task_status_id || 1,
    task_priority_id: 1,
    story_points: 0,
    sprint_id: null as number | null,
    project_id: projectId,
  });

  const [newSprint, setNewSprint] = useState({
    name: "",
    description: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    project_id: projectId,
  });

  const [editSprint, setEditSprint] = useState({
    name: "",
    description: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: new Date().toISOString().split("T")[0],
    project_id: projectId,
  });

  async function getSprintById(sprintId: number) {
    axios
      .get(`/project/GET/get-sprint-by-id`, {
        params: { sprint_id: sprintId },
      })
      .then((res) => {
        if (res.status === 200) {
          setEditSprint({
            name: res.data.sprint.name,
            description: res.data.sprint.description,
            start_date: res.data.sprint.start_date.split("T")[0],
            end_date: res.data.sprint.end_date.split("T")[0],
            project_id: res.data.sprint.project_id,
          });
          setEditSprintId(sprintId);
        }
      });
  }

  const handleEditSprint = async () => {
    await axios
      .put(`/project/UPDATE/update-sprint`, {
        sprint_id: editSprintId,
        sprint_data: editSprint,
      })
      .then((res) => {
        if (res.status === 200) {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Sprint modificato con successo!",
            description: "Il sprint è stato modificato con successo",
            color: "success",
          });
          setUpdate(!update);
        } else {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante la modifica del sprint",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        }
      })
      .catch(() => {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore durante la modifica del sprint",
          description: "Controlla i dati inseriti e riprova",
          color: "danger",
        });
      });
    setEditSprintId(null);
    onClose();
  };

  const handleCreateTask = () => {
    if (TaskStatuses.length > 0) {
      setNewTask({
        ...newTask,
        task_status_id: TaskStatuses[0].task_status_id,
      });
    }
    axios
      .post(`/project/POST/create-task`, { task_data: newTask })
      .then((res) => {
        if (res.status === 200) {
          setNewTask({
            title: "",
            description: "",
            task_status_id: TaskStatuses[0].task_status_id,
            task_priority_id: 1,
            story_points: 0,
            sprint_id: null as number | null,
            project_id: projectId,
          });
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Task creato con successo!",
            description: "Il task è stato creato con successo",
            color: "success",
          });
          setUpdate(!update);
        } else {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante la creazione del task",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        }
      })
      .catch(() => {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore durante la creazione del task",
          description: "Controlla i dati inseriti e riprova",
          color: "danger",
        });
      });
    onClose();
  };

  const handleCreateSprint = () => {
    axios
      .post(`/project/POST/create-sprint`, { sprint_data: newSprint })
      .then((res) => {
        if (res.status === 200) {
          setNewSprint({
            name: "",
            description: "",
            start_date: new Date("2025-11-05").toISOString().split("T")[0],
            end_date: new Date("2025-11-05").toISOString().split("T")[0],
            project_id: projectId,
          });
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Sprint creato con successo!",
            description: "Il sprint è stato creato con successo",
            color: "success",
          });
          setUpdate(!update);
        } else {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante la creazione del sprint",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        }
      })
      .catch(() => {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore durante la creazione del sprint",
          description: "Controlla i dati inseriti e riprova",
          color: "danger",
        });
      });
    onClose();
  };

  const handleDeleteSprint = (sprintId: number) => {
    axios
      .delete(`/project/DELETE/delete-sprint`, {
        params: { sprint_id: sprintId },
      })
      .then((res) => {
        if (res.status === 200) {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Sprint eliminato con successo!",
            description: "Il sprint è stato eliminato con successo",
            color: "success",
          });
          setUpdate(!update);
        } else {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante l'eliminazione del sprint",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        }
      })
      .catch(() => {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore durante l'eliminazione del sprint",
          description: "Controlla i dati inseriti e riprova",
          color: "danger",
        });
      });
  };

  const handleDeleteTask = (taskId: number) => {
    axios
      .delete(`/project/DELETE/delete-task`, {
        params: { task_id: taskId },
      })
      .then((res) => {
        if (res.status === 200) {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Task eliminato con successo!",
            description: "Il task è stato eliminato con successo",
            color: "success",
          });
          setUpdate(!update);
        } else {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante l'eliminazione del task",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        }
      })
      .catch(() => {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore durante l'eliminazione del task",
          description: "Controlla i dati inseriti e riprova",
          color: "danger",
        });
      });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Trova il task attivo
    let task = backlog.find((t) => t.task_id === active.id);
    if (!task) {
      // Cerca negli sprint
      for (const sprint of sprints) {
        task = sprint.tasks.find((t) => t.task_id === active.id);
        if (task) break;
      }
    }
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const activeId = active.id as number;
    const overId = over.id as number;

    // Trova da dove viene il task
    const isFromBacklog = backlog.some((t) => t.task_id === activeId);
    const fromSprint = sprints.find((s) =>
      s.tasks.some((t) => t.task_id === activeId)
    );

    // Trova dove va il task
    const isToBacklog = backlog.some((t) => t.task_id === overId);
    const toSprint = sprints.find((s) =>
      s.tasks.some((t) => t.task_id === overId)
    );

    // Caso 1: Riordino nel backlog
    if (isFromBacklog && isToBacklog) {
      const oldIndex = backlog.findIndex((t) => t.task_id === activeId);
      const newIndex = backlog.findIndex((t) => t.task_id === overId);
      setBacklog(arrayMove(backlog, oldIndex, newIndex));
      return;
    }

    // Caso 2: Riordino nello stesso sprint
    if (fromSprint && toSprint && fromSprint.sprint_id === toSprint.sprint_id) {
      const oldIndex = fromSprint.tasks.findIndex(
        (t) => t.task_id === activeId
      );
      const newIndex = fromSprint.tasks.findIndex((t) => t.task_id === overId);

      setSprints((prev) =>
        prev.map((s) =>
          s.sprint_id === fromSprint.sprint_id
            ? { ...s, tasks: arrayMove(s.tasks, oldIndex, newIndex) }
            : s
        )
      );
      return;
    }

    // Caso 3: Dal backlog allo sprint
    if (isFromBacklog && toSprint) {
      const task = backlog.find((t) => t.task_id === activeId);
      if (task) {
        setBacklog((prev) => prev.filter((t) => t.task_id !== activeId));
        setSprints((prev) =>
          prev.map((s) =>
            s.sprint_id === toSprint.sprint_id
              ? {
                  ...s,
                  tasks: [
                    ...s.tasks,
                    { ...task, sprint_id: toSprint.sprint_id },
                  ],
                }
              : s
          )
        );
      }
      return;
    }

    // Caso 4: Dallo sprint al backlog
    if (fromSprint && isToBacklog) {
      const task = fromSprint.tasks.find((t) => t.task_id === activeId);
      if (task) {
        setSprints((prev) =>
          prev.map((s) =>
            s.sprint_id === fromSprint.sprint_id
              ? { ...s, tasks: s.tasks.filter((t) => t.task_id !== activeId) }
              : s
          )
        );
        setBacklog((prev) => [...prev, { ...task, sprint_id: null }]);
      }
      return;
    }

    // Caso 5: Da uno sprint a un altro sprint
    if (fromSprint && toSprint && fromSprint.sprint_id !== toSprint.sprint_id) {
      const task = fromSprint.tasks.find((t) => t.task_id === activeId);
      if (task) {
        setSprints((prev) =>
          prev.map((s) => {
            if (s.sprint_id === fromSprint.sprint_id) {
              return {
                ...s,
                tasks: s.tasks.filter((t) => t.task_id !== activeId),
              };
            }
            if (s.sprint_id === toSprint.sprint_id) {
              return {
                ...s,
                tasks: [...s.tasks, { ...task, sprint_id: toSprint.sprint_id }],
              };
            }
            return s;
          })
        );
      }
    }
  };

  const getTotalStoryPoints = (tasks: Task[]) => {
    return tasks.reduce((sum, task) => sum + (task.story_points || 0), 0);
  };

  const activeSprint = sprints.find((s) => s.is_active);

  const handleStartSprint = async (sprintId: number) => {
    await axios
      .put(`/project/UPDATE/start-sprint`, {
        sprint_id: sprintId,
        project_id: projectId,
      })
      .then((res) => {
        if (res.status === 200) {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Sprint avviato con successo!",
            description: "Il sprint è stato avviato con successo",
            color: "success",
          });
          setUpdate(!update);
        } else {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante l'avvio del sprint",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        }
      })
      .catch(() => {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore durante l'avvio del sprint",
          description: "Controlla i dati inseriti e riprova",
          color: "danger",
        });
      });
  };

  const handleCompleteSprint = async () => {
    if (activeSprint) {
      await axios
        .put(`/project/UPDATE/complete-sprint`, {
          sprint_id: activeSprint.sprint_id,
        })
        .then((res) => {
          if (res.status === 200) {
            addToast({
              timeout: 3000,
              shouldShowTimeoutProgress: true,
              title: "Sprint completato con successo!",
              description: "Il sprint è stato completato con successo",
              color: "success",
            });
            setUpdate(!update);
          } else {
            addToast({
              timeout: 3000,
              shouldShowTimeoutProgress: true,
              title: "Errore durante la completa del sprint",
              description: "Controlla i dati inseriti e riprova",
              color: "danger",
            });
          }
        })
        .catch(() => {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante la completa del sprint",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        });
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const handleMoveTask = async (
    taskId: number,
    targetSprintId: number | null
  ) => {
    // Trova il task da spostare
    let taskToMove: Task | undefined;
    let sourceSprintId: number | null = null;

    // Cerca nel backlog
    taskToMove = backlog.find((t) => t.task_id === taskId);

    // Se non è nel backlog, cerca negli sprint
    if (!taskToMove) {
      for (const sprint of sprints) {
        taskToMove = sprint.tasks.find((t) => t.task_id === taskId);
        if (taskToMove) {
          sourceSprintId = sprint.sprint_id;
          break;
        }
      }
    }

    if (!taskToMove) return;

    // Se la destinazione è la stessa della sorgente, non fare nulla
    if (sourceSprintId === targetSprintId) return;

    await axios
      .put(`/project/UPDATE/move-task`, {
        task_id: taskId,
        target_sprint_id: targetSprintId,
      })
      .then((res) => {
        if (res.status === 200) {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Task spostato con successo!",
            description: "Il task è stato spostato con successo",
            color: "success",
          });
          setUpdate(!update);
        } else {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante lo spostamento del task",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        }
      })
      .catch(() => {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore durante lo spostamento del task",
          description: "Controlla i dati inseriti e riprova",
          color: "danger",
        });
      });
  };

  if (loading != 0) {
    return (
      <div className="flex justify-center items-center h-84">
        <Spinner variant="wave" />
      </div>
    );
  } else {
    return (
      <div className="space-y-6">
        {/* Header con azioni */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-default-900">Scrum Board</h2>
            <p className="text-sm text-default-500 mt-0.5">
              Gestisci sprint e backlog del progetto
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              color="default"
              variant="bordered"
              onPress={onOpen}
              startContent={
                <Icon icon="solar:add-circle-linear" className="text-lg" />
              }
              className="font-medium"
            >
              Nuovo Task
            </Button>
            <Button
              color="primary"
              onPress={() => setSprintModalOpen(true)}
              startContent={
                <Icon icon="solar:rocket-linear" className="text-lg" />
              }
              className="font-medium shadow-sm"
            >
              Nuovo Sprint
            </Button>
          </div>
        </div>

        {/* Tabs per visualizzazioni */}
        <Tabs
          aria-label="Scrum Views"
          color="primary"
          variant="underlined"
          classNames={{
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-primary",
            tab: "max-w-fit px-0 h-12",
          }}
        >
          <Tab
            key="overview"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="solar:list-check-linear" className="text-lg" />
                <span>Panoramica Sprint</span>
              </div>
            }
          >
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="space-y-6 mt-6">
                {/* Sprint */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold flex items-center gap-2 text-default-700">
                    <Icon
                      icon="solar:rocket-2-linear"
                      className="text-xl text-primary"
                    />
                    Sprint
                  </h3>

                  {/* Sprint Attivo */}
                  {sprints.filter((s) => s.is_active).length === 0 ? (
                    <div className="border-2 border-dashed border-primary-300 rounded-xl p-8 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-default/10 rounded-full mb-4 shadow-sm">
                        <Icon
                          icon="solar:rocket-linear"
                          className="text-3xl text-primary-400"
                        />
                      </div>
                      <h4 className="font-semibold text-default-700 mb-1">
                        Nessuno Sprint Attivo
                      </h4>
                      <p className="text-sm text-default-500">
                        Avvia uno sprint per iniziare a lavorare sui task
                      </p>
                    </div>
                  ) : (
                    sprints
                      .filter((s) => s.is_active)
                      .map((sprint) => (
                        <div
                          key={sprint.sprint_id}
                          className="bg-default/10 border border-default-50 rounded-2xl p-5 transition-all duration-200"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-base font-semibold text-default-900">
                                  {sprint.name}
                                </h4>
                                <span className="text-[10px] font-medium px-2 py-0.5 bg-danger-100 text-primary rounded-full">
                                  Attivo
                                </span>
                              </div>
                              <p className="text-xs text-default-600 mb-3">
                                {sprint.description}
                              </p>
                              <div className="flex items-center gap-3 text-[11px] text-default-500">
                                <span className="flex items-center gap-1">
                                  <Icon
                                    icon="solar:calendar-linear"
                                    className="text-sm"
                                  />
                                  {new Date(
                                    sprint.start_date
                                  ).toLocaleDateString("it-IT", {
                                    day: "numeric",
                                    month: "short",
                                  })}{" "}
                                  -{" "}
                                  {new Date(sprint.end_date).toLocaleDateString(
                                    "it-IT",
                                    {
                                      day: "numeric",
                                      month: "short",
                                    }
                                  )}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Icon
                                    icon="solar:chart-linear"
                                    className="text-sm"
                                  />
                                  {getTotalStoryPoints(sprint.tasks)} SP
                                </span>
                                <span className="flex items-center gap-1">
                                  <Icon
                                    icon="solar:checklist-minimalistic-linear"
                                    className="text-sm"
                                  />
                                  {
                                    sprint.tasks.filter(
                                      (t) => t.task_status.name === "completed"
                                    ).length
                                  }
                                  /{sprint.tasks.length}
                                </span>
                              </div>
                            </div>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button
                                  isIconOnly
                                  variant="light"
                                  size="sm"
                                  className="min-w-8 w-8 h-8"
                                >
                                  <Icon
                                    icon="solar:menu-dots-linear"
                                    className="text-lg"
                                  />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                <DropdownItem
                                  key="edit"
                                  color="primary"
                                  startContent={
                                    <Icon icon="solar:pen-linear" />
                                  }
                                  onPress={() =>
                                    getSprintById(sprint.sprint_id)
                                  }
                                >
                                  Modifica Sprint
                                </DropdownItem>
                                <DropdownItem
                                  key="complete"
                                  color="primary"
                                  startContent={
                                    <Icon icon="solar:check-read-linear" />
                                  }
                                  onPress={() => handleCompleteSprint()}
                                >
                                  Completa Sprint
                                </DropdownItem>
                                <DropdownItem
                                  key="delete"
                                  className="text-danger"
                                  color="danger"
                                  startContent={
                                    <Icon icon="solar:trash-bin-trash-linear" />
                                  }
                                  onPress={() =>
                                    handleDeleteSprint(sprint.sprint_id)
                                  }
                                >
                                  Elimina Sprint
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                          <div className="pt-2">
                            <SortableContext
                              items={sprint.tasks.map((t) => t.task_id)}
                              strategy={verticalListSortingStrategy}
                            >
                              {sprint.tasks.length === 0 ? (
                                <div className="text-center py-8 text-xs text-default-400">
                                  Nessun task nello sprint
                                </div>
                              ) : (
                                sprint.tasks.map((task) => (
                                  <SortableTask
                                    key={task.task_id}
                                    task={task}
                                    onTaskClick={handleTaskClick}
                                    onMoveTask={handleMoveTask}
                                    availableSprints={sprints.filter(
                                      (s) => s.sprint_id !== sprint.sprint_id
                                    )}
                                    handleDeleteTask={handleDeleteTask}
                                  />
                                ))
                              )}
                            </SortableContext>
                          </div>
                        </div>
                      ))
                  )}

                  {/* Sprint Pianificati */}
                  {sprints
                    .filter((s) => !s.is_active && !s.is_completed)
                    .map((sprint) => (
                      <div
                        key={sprint.sprint_id}
                        className="bg-default-300/10 border border-default-100/50 rounded-2xl p-5"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-base font-semibold text-default-900">
                                {sprint.name}
                              </h4>
                              <span className="text-[10px] font-medium px-2 py-0.5 bg-default-200 text-default-700 rounded-full">
                                Pianificato
                              </span>
                            </div>
                            <p className="text-xs text-default-600 mb-3">
                              {sprint.description}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-default-500">
                              <span className="flex items-center gap-1">
                                <Icon
                                  icon="solar:calendar-linear"
                                  className="text-sm"
                                />
                                {new Date(sprint.start_date).toLocaleDateString(
                                  "it-IT",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  }
                                )}{" "}
                                -{" "}
                                {new Date(sprint.end_date).toLocaleDateString(
                                  "it-IT",
                                  {
                                    day: "numeric",
                                    month: "short",
                                  }
                                )}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon
                                  icon="solar:chart-linear"
                                  className="text-sm"
                                />
                                {getTotalStoryPoints(sprint.tasks)} SP
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon
                                  icon="solar:checklist-minimalistic-linear"
                                  className="text-sm"
                                />
                                {sprint.tasks.length} tasks
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              color="primary"
                              size="sm"
                              onPress={() =>
                                handleStartSprint(sprint.sprint_id)
                              }
                              startContent={<Icon icon="solar:play-linear" />}
                            >
                              Avvia Sprint
                            </Button>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button
                                  isIconOnly
                                  variant="light"
                                  size="sm"
                                  className="min-w-8 w-8 h-8"
                                >
                                  <Icon
                                    icon="solar:menu-dots-linear"
                                    className="text-lg"
                                  />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                <DropdownItem
                                  key="edit"
                                  color="primary"
                                  startContent={
                                    <Icon icon="solar:pen-linear" />
                                  }
                                  onPress={() =>
                                    getSprintById(sprint.sprint_id)
                                  }
                                >
                                  Modifica Sprint
                                </DropdownItem>
                                <DropdownItem
                                  key="delete"
                                  className="text-danger"
                                  color="danger"
                                  startContent={
                                    <Icon icon="solar:trash-bin-trash-linear" />
                                  }
                                  onPress={() =>
                                    handleDeleteSprint(sprint.sprint_id)
                                  }
                                >
                                  Elimina Sprint
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </div>
                        <div className="pt-2">
                          <SortableContext
                            items={sprint.tasks.map((t) => t.task_id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {sprint.tasks.length === 0 ? (
                              <div className="text-center py-8 text-xs text-default-400">
                                Nessun task nello sprint
                              </div>
                            ) : (
                              sprint.tasks.map((task) => (
                                <SortableTask
                                  key={task.task_id}
                                  task={task}
                                  onTaskClick={handleTaskClick}
                                  onMoveTask={handleMoveTask}
                                  availableSprints={sprints.filter(
                                    (s) => s.sprint_id !== sprint.sprint_id
                                  )}
                                  handleDeleteTask={handleDeleteTask}
                                />
                              ))
                            )}
                          </SortableContext>
                        </div>
                      </div>
                    ))}

                  {/* Sprint Completati */}
                  {sprints
                    .filter((s) => s.is_completed)
                    .map((sprint) => (
                      <div
                        key={sprint.sprint_id}
                        className="bg-default-300/10 border border-default-100/50 rounded-2xl p-5 opacity-50"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-base font-semibold text-default-900">
                                {sprint.name}
                              </h4>
                              <span className="text-[10px] font-medium px-2 py-0.5 bg-success-100 text-primary rounded-full">
                                Completato
                              </span>
                            </div>
                            <p className="text-xs text-default-600 mb-3">
                              {sprint.description}
                            </p>
                            <div className="flex items-center gap-3 text-[11px] text-default-500">
                              <span className="flex items-center gap-1">
                                <Icon
                                  icon="solar:calendar-linear"
                                  className="text-sm"
                                />
                                {new Date(
                                  sprint.completed_at as string
                                ).toLocaleDateString("it-IT", {
                                  day: "numeric",
                                  month: "short",
                                })}{" "}
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon
                                  icon="solar:chart-linear"
                                  className="text-sm"
                                />
                                {getTotalStoryPoints(sprint.tasks)} SP
                              </span>
                              <span className="flex items-center gap-1">
                                <Icon
                                  icon="solar:checklist-minimalistic-linear"
                                  className="text-sm"
                                />
                                {sprint.tasks.length} tasks
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Dropdown>
                              <DropdownTrigger>
                                <Button
                                  isIconOnly
                                  variant="light"
                                  size="sm"
                                  className="min-w-8 w-8 h-8"
                                >
                                  <Icon
                                    icon="solar:menu-dots-linear"
                                    className="text-lg"
                                  />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                <DropdownItem
                                  key="delete"
                                  className="text-danger"
                                  color="danger"
                                  startContent={
                                    <Icon icon="solar:trash-bin-trash-linear" />
                                  }
                                  onPress={() =>
                                    handleDeleteSprint(sprint.sprint_id)
                                  }
                                >
                                  Elimina Sprint
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                        </div>
                        <div className="pt-2">
                          <SortableContext
                            items={sprint.tasks.map((t) => t.task_id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {sprint.tasks.length === 0 ? (
                              <div className="text-center py-8 text-xs text-default-400">
                                Nessun task nello sprint
                              </div>
                            ) : (
                              sprint.tasks.map((task) => (
                                <SortableTask
                                  key={task.task_id}
                                  task={task}
                                  onTaskClick={handleTaskClick}
                                  onMoveTask={handleMoveTask}
                                  availableSprints={sprints.filter(
                                    (s) => s.sprint_id !== sprint.sprint_id
                                  )}
                                  handleDeleteTask={handleDeleteTask}
                                />
                              ))
                            )}
                          </SortableContext>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Backlog */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center gap-2 text-default-700">
                      <Icon
                        icon="solar:clipboard-list-linear"
                        className="text-xl text-default-600"
                      />
                      Backlog
                      <span className="text-xs font-normal text-default-400">
                        {backlog.length} tasks · {getTotalStoryPoints(backlog)}{" "}
                        SP
                      </span>
                    </h3>
                  </div>

                  <div className="bg-default-50 border border-default/10 rounded-xl p-4">
                    <SortableContext
                      items={backlog.map((t) => t.task_id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {backlog.length === 0 ? (
                        <div className="text-center py-12">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-sm">
                            <Icon
                              icon="solar:clipboard-list-linear"
                              className="text-3xl text-default-400"
                            />
                          </div>
                          <h4 className="font-semibold text-default-700 mb-1">
                            Backlog Vuoto
                          </h4>
                          <p className="text-sm text-default-500">
                            Aggiungi un nuovo task per iniziare
                          </p>
                        </div>
                      ) : (
                        backlog.map((task) => (
                          <SortableTask
                            key={task.task_id}
                            task={task}
                            onTaskClick={handleTaskClick}
                            onMoveTask={handleMoveTask}
                            availableSprints={sprints}
                            handleDeleteTask={handleDeleteTask}
                          />
                        ))
                      )}
                    </SortableContext>
                  </div>
                </div>

                {/* Modal Dettaglio Task */}
                <Modal
                  isOpen={taskDetailOpen}
                  onClose={() => setTaskDetailOpen(false)}
                  size="2xl"
                >
                  <ModalContent>
                    {selectedTask && (
                      <>
                        <ModalHeader className="flex flex-col gap-1">
                          <h3 className="text-lg font-semibold">
                            {selectedTask.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-2">
                            <Chip
                              color={selectedTask.task_priority?.color as any}
                              variant="flat"
                              size="sm"
                              className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                            >
                              {selectedTask.task_priority?.name
                                .split(" ")
                                .map(
                                  (word) =>
                                    word.charAt(0).toUpperCase() + word.slice(1)
                                )
                                .join(" ")}
                            </Chip>
                            {selectedTask.story_points && (
                              <Chip
                                variant="flat"
                                size="sm"
                                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                              >
                                {selectedTask.story_points} Story Points
                              </Chip>
                            )}
                          </div>
                        </ModalHeader>
                        <ModalBody>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-semibold text-default-700 mb-2 block">
                                Descrizione
                              </label>
                              <p className="text-sm text-default-600">
                                {selectedTask.description
                                  .split(" ")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-sm font-semibold text-default-700 mb-2 block">
                                  Status
                                </label>
                                <Chip
                                  color={selectedTask.task_status?.color as any}
                                  variant="flat"
                                  size="sm"
                                >
                                  {selectedTask.task_status.name
                                    .split(" ")
                                    .map(
                                      (word) =>
                                        word.charAt(0).toUpperCase() +
                                        word.slice(1)
                                    )
                                    .join(" ")}
                                </Chip>
                              </div>
                            </div>

                            <div>
                              <label className="text-sm font-semibold text-default-700 mb-2 block">
                                Creato il
                              </label>
                              <p className="text-sm text-default-600">
                                {new Date(
                                  selectedTask.created_at
                                ).toLocaleDateString("it-IT", {
                                  day: "numeric",
                                  month: "long",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </div>
                        </ModalBody>
                        <ModalFooter>
                          <Button
                            variant="light"
                            onPress={() => setTaskDetailOpen(false)}
                          >
                            Chiudi
                          </Button>
                          <Button color="primary">Modifica</Button>
                        </ModalFooter>
                      </>
                    )}
                  </ModalContent>
                </Modal>

                {/* Modal Nuovo Task */}
                <Modal isOpen={isOpen} onClose={onClose} size="2xl">
                  <ModalContent>
                    <ModalHeader>Nuovo Task</ModalHeader>
                    <ModalBody>
                      <div className="space-y-4">
                        <Input
                          label="Titolo"
                          placeholder="Es: Implementare autenticazione"
                          value={newTask.title}
                          onChange={(e) =>
                            setNewTask({ ...newTask, title: e.target.value })
                          }
                        />
                        <Textarea
                          label="Descrizione"
                          placeholder="Descrivi il task..."
                          value={newTask.description}
                          onChange={(e) =>
                            setNewTask({
                              ...newTask,
                              description: e.target.value,
                            })
                          }
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <Select
                            className="max-w-xs"
                            label="Priorità"
                            placeholder="Seleziona una priorità"
                            selectedKeys={[newTask.task_priority_id.toString()]}
                            onSelectionChange={(keys) => {
                              const selected = Array.from(keys)[0] as string;
                              setNewTask({
                                ...newTask,
                                task_priority_id: parseInt(selected),
                              });
                            }}
                          >
                            {TaskPriorities.map((priority) => (
                              <SelectItem
                                color={priority.color as any}
                                key={priority.task_priority_id}
                              >
                                {priority.name.charAt(0).toUpperCase() +
                                  priority.name.slice(1)}
                              </SelectItem>
                            ))}
                          </Select>
                          <Input
                            type="number"
                            label="Story Points"
                            placeholder="0"
                            value={newTask.story_points.toString()}
                            onChange={(e) =>
                              setNewTask({
                                ...newTask,
                                story_points: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <Select
                          label="Sprint/Backlog"
                          placeholder="Seleziona uno sprint o backlog"
                          selectedKeys={[
                            newTask.sprint_id?.toString() || "Backlog",
                          ]}
                          onSelectionChange={(keys) => {
                            const selected = Array.from(keys)[0] as string;
                            setNewTask({
                              ...newTask,
                              sprint_id:
                                selected === "null" ? null : parseInt(selected),
                            });
                          }}
                        >
                          <>
                            {sprints.map((sprint) => (
                              <SelectItem
                                key={sprint.sprint_id}
                                color="primary"
                              >
                                {sprint.name.charAt(0).toUpperCase() +
                                  sprint.name.slice(1)}
                              </SelectItem>
                            ))}
                            <SelectItem key="backlog">Backlog</SelectItem>
                          </>
                        </Select>
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button variant="light" onPress={onClose}>
                        Annulla
                      </Button>
                      <Button color="primary" onPress={handleCreateTask}>
                        Crea Task
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>

                {/* Modal Nuovo Sprint */}
                <Modal
                  isOpen={sprintModalOpen}
                  onClose={() => setSprintModalOpen(false)}
                  size="2xl"
                >
                  <ModalContent>
                    <ModalHeader>Nuovo Sprint</ModalHeader>
                    <ModalBody>
                      <div className="space-y-4">
                        <Input
                          label="Nome Sprint"
                          placeholder="Es: Sprint 1 - Foundation"
                          value={newSprint.name}
                          onChange={(e) =>
                            setNewSprint({ ...newSprint, name: e.target.value })
                          }
                        />
                        <Textarea
                          label="Obiettivo Sprint"
                          placeholder="Descrivi l'obiettivo principale..."
                          value={newSprint.description}
                          onChange={(e) =>
                            setNewSprint({
                              ...newSprint,
                              description: e.target.value,
                            })
                          }
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <I18nProvider locale="it-IT">
                            <DatePicker
                              className="cursor-pointer"
                              label="Data Inizio"
                              value={parseDate(newSprint.start_date) as any}
                              onChange={(e) => {
                                if (e) {
                                  const year = e.year.toString();
                                  const month = e.month
                                    .toString()
                                    .padStart(2, "0");
                                  const day = e.day.toString().padStart(2, "0");
                                  setNewSprint({
                                    ...newSprint,
                                    start_date: `${year}-${month}-${day}`,
                                  });
                                }
                              }}
                            />
                          </I18nProvider>
                          <I18nProvider locale="it-IT">
                            <DatePicker
                              label="Data Fine"
                              value={parseDate(newSprint.end_date) as any}
                              onChange={(e) => {
                                if (e) {
                                  const year = e.year.toString();
                                  const month = e.month
                                    .toString()
                                    .padStart(2, "0");
                                  const day = e.day.toString().padStart(2, "0");
                                  setNewSprint({
                                    ...newSprint,
                                    end_date: `${year}-${month}-${day}`,
                                  });
                                }
                              }}
                            />
                          </I18nProvider>
                        </div>
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        variant="light"
                        onPress={() => setSprintModalOpen(false)}
                      >
                        Annulla
                      </Button>
                      <Button color="primary" onPress={handleCreateSprint}>
                        Crea Sprint
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>

                {/* Modal Modifica Sprint */}
                <Modal
                  isOpen={editSprintId ? true : false}
                  onClose={() => setEditSprintId(null)}
                  size="2xl"
                >
                  <ModalContent>
                    <ModalHeader>Modifica Sprint</ModalHeader>
                    <ModalBody>
                      <div className="space-y-4">
                        <Input
                          label="Nome Sprint"
                          placeholder="Es: Sprint 1 - Foundation"
                          value={editSprint?.name || ""}
                          onChange={(e) =>
                            setEditSprint({
                              ...editSprint,
                              name: e.target.value,
                            })
                          }
                        />
                        <Textarea
                          label="Obiettivo Sprint"
                          placeholder="Descrivi l'obiettivo principale..."
                          value={editSprint?.description || ""}
                          onChange={(e) =>
                            setEditSprint({
                              ...editSprint,
                              description: e.target.value,
                            })
                          }
                        />
                        <div className="grid grid-cols-2 gap-4">
                          <I18nProvider locale="it-IT">
                            <DatePicker
                              className="cursor-pointer"
                              label="Data Inizio"
                              value={
                                parseDate(editSprint?.start_date || "") as any
                              }
                              onChange={(e) => {
                                if (e) {
                                  const year = e.year.toString();
                                  const month = e.month
                                    .toString()
                                    .padStart(2, "0");
                                  const day = e.day.toString().padStart(2, "0");
                                  setEditSprint({
                                    ...editSprint,
                                    start_date: `${year}-${month}-${day}`,
                                  });
                                }
                              }}
                            />
                          </I18nProvider>
                          <I18nProvider locale="it-IT">
                            <DatePicker
                              label="Data Fine"
                              value={
                                parseDate(editSprint?.end_date || "") as any
                              }
                              onChange={(e) => {
                                if (e) {
                                  const year = e.year.toString();
                                  const month = e.month
                                    .toString()
                                    .padStart(2, "0");
                                  const day = e.day.toString().padStart(2, "0");
                                  setEditSprint({
                                    ...editSprint,
                                    end_date: `${year}-${month}-${day}`,
                                  });
                                }
                              }}
                            />
                          </I18nProvider>
                        </div>
                      </div>
                    </ModalBody>
                    <ModalFooter>
                      <Button
                        variant="light"
                        onPress={() => setEditSprintId(null)}
                      >
                        Annulla
                      </Button>
                      <Button color="primary" onPress={handleEditSprint}>
                        Modifica Sprint
                      </Button>
                    </ModalFooter>
                  </ModalContent>
                </Modal>

                {/* Overlay per il drag */}
                <DragOverlay
                  dropAnimation={{
                    duration: 200,
                    easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                  }}
                >
                  {activeTask ? (
                    <div
                      className="bg-default/10 border border-default-50 rounded-xl p-3 shadow-2xl"
                      style={{
                        transform: "scale(1.05)",
                        boxShadow:
                          "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon
                          icon="solar:move-linear"
                          className="text-primary text-lg animate-pulse"
                        />
                        <h4 className="font-medium text-sm text-default-900">
                          {activeTask.title}
                        </h4>
                      </div>
                      <p className="text-xs text-default-500 line-clamp-2">
                        {activeTask.description}
                      </p>
                    </div>
                  ) : null}
                </DragOverlay>
              </div>
            </DndContext>
          </Tab>

          <Tab
            key="active-sprint"
            title={
              <div className="flex items-center gap-2">
                <Icon icon="solar:widget-5-linear" className="text-lg" />
                <span>Sprint Attivo</span>
                {activeSprint && (
                  <Chip size="sm" color="primary" variant="flat">
                    {activeSprint.tasks.length}
                  </Chip>
                )}
              </div>
            }
          >
            <div className="mt-6">
              {!activeSprint ? (
                <div className="bg-default-50 border border-dashed border-default-300 rounded-2xl p-16 text-center">
                  <Icon
                    icon="solar:rocket-linear"
                    className="text-6xl text-default-300 mx-auto mb-4"
                  />
                  <h3 className="text-lg font-semibold text-default-700 mb-2">
                    Nessuno Sprint Attivo
                  </h3>
                  <p className="text-sm text-default-500 mb-4">
                    Crea un nuovo sprint e attivalo per vedere la board Kanban
                  </p>
                  <Button
                    color="primary"
                    onPress={() => setSprintModalOpen(true)}
                    startContent={<Icon icon="solar:rocket-linear" />}
                  >
                    Crea Nuovo Sprint
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Header Sprint Attivo */}
                  <div className="bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200 rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-default-900">
                            {activeSprint.name}
                          </h3>
                        </div>
                        <p className="text-xs text-default-600 mb-3">
                          {activeSprint.description}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] text-default-500">
                          <span className="flex items-center gap-1">
                            <Icon
                              icon="solar:calendar-linear"
                              className="text-sm"
                            />
                            {new Date(
                              activeSprint.start_date
                            ).toLocaleDateString("it-IT", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            -{" "}
                            {new Date(activeSprint.end_date).toLocaleDateString(
                              "it-IT",
                              {
                                day: "numeric",
                                month: "short",
                              }
                            )}
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon
                              icon="solar:chart-linear"
                              className="text-sm"
                            />
                            {getTotalStoryPoints(activeSprint.tasks)} SP
                          </span>
                          <span className="flex items-center gap-1">
                            <Icon
                              icon="solar:checklist-minimalistic-linear"
                              className="text-sm"
                            />
                            {
                              activeSprint.tasks.filter(
                                (t) => t.task_status.name === "Completed"
                              ).length
                            }
                            /{activeSprint.tasks.length}
                          </span>
                        </div>
                      </div>
                      <Button
                        color="success"
                        size="sm"
                        onPress={handleCompleteSprint}
                        startContent={<Icon icon="solar:check-circle-linear" />}
                      >
                        Completa Sprint
                      </Button>
                    </div>
                  </div>

                  {/* Kanban Board */}
                  <SprintKanbanView
                    setUpdate={setUpdate}
                    update={update}
                    tasks={activeSprint.tasks}
                    taskStatuses={TaskStatuses}
                    onTasksChange={(updatedTasks) => {
                      setSprints((prev) =>
                        prev.map((s) =>
                          s.sprint_id === activeSprint.sprint_id
                            ? { ...s, tasks: updatedTasks }
                            : s
                        )
                      );
                    }}
                  />
                </div>
              )}
            </div>
          </Tab>
        </Tabs>
      </div>
    );
  }
}
