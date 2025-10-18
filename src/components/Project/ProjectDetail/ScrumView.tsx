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
  Tab,
  Tabs,
  Textarea,
  useDisclosure,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import axios from "axios";
import { useEffect, useState } from "react";
import type { Sprint, Task, TaskPriority, TaskStatus } from "../../../types";
import SprintKanbanView from "./SprintKanbanView";

interface ScrumViewProps {
  projectId: number;
}

// Componente per singolo task drag & drop
function SortableTask({
  task,
  onTaskClick,
  onMoveTask,
  availableSprints,
}: {
  task: Task;
  onTaskClick: (task: Task) => void;
  onMoveTask: (taskId: number, targetSprintId: number | null) => void;
  availableSprints: Sprint[];
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
        className="mb-3 bg-white border border-default-200 rounded-lg hover:border-primary-200 hover:shadow-md transition-all duration-200 overflow-hidden"
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
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="font-semibold text-sm text-default-900 leading-snug">
                {task.title}
              </h4>
            </div>

            {task.description && (
              <p className="text-xs text-default-500 line-clamp-2 mb-3 leading-relaxed">
                {task.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 rounded-md"
                  style={{
                    backgroundColor: task.task_priority.color,
                  }}
                >
                  {task.task_priority?.name}
                </span>
                {task.story_points && (
                  <span className="text-[10px] font-semibold text-primary-600 px-2.5 py-1 bg-primary-50 rounded-md">
                    {task.story_points} SP
                  </span>
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
                    key="view"
                    onPress={() => onTaskClick(task)}
                    startContent={<Icon icon="solar:eye-linear" />}
                  >
                    Visualizza dettagli
                  </DropdownItem>
                  <DropdownItem
                    key="backlog"
                    onPress={() => onMoveTask(task.task_id, null)}
                    startContent={<Icon icon="solar:clipboard-list-linear" />}
                  >
                    Sposta nel Backlog
                  </DropdownItem>
                  <>
                    {availableSprints.map((sprint: Sprint) => (
                      <DropdownItem
                        key={sprint.sprint_id}
                        onPress={() =>
                          onMoveTask(task.task_id, sprint.sprint_id)
                        }
                        startContent={<Icon icon="solar:rocket-2-linear" />}
                      >
                        Sposta in {sprint.name}
                      </DropdownItem>
                    ))}
                  </>
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
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);
  const [TaskStatuses, setTaskStatuses] = useState<TaskStatus[]>([]);
  const [TaskPriorities, setTaskPriorities] = useState<TaskPriority[]>([]);

  useEffect(() => {
    axios
      .get(`/project/GET/get-task-statuses`, {
        params: { project_id: projectId },
      })
      .then((res) => {
        if (res.status === 200) {
          console.log(res.data);
          setTaskStatuses(res.data.task_statuses);
        }
      });
    axios.get(`/project/GET/get-task-priorities`).then((res) => {
      if (res.status === 200) {
        console.log(res.data);
        setTaskPriorities(res.data.task_priorities);
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

  // Form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    task_status_id: 1,
    task_priority_id: 1,
    story_points: 0,
  });

  const [newSprint, setNewSprint] = useState({
    name: "",
    goal: "",
    start_date: "",
    end_date: "",
  });

  const handleCreateTask = () => {
    onClose();
  };

  const handleCreateSprint = () => {
    setSprintModalOpen(false);
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

  const handleStartSprint = (sprintId: number) => {
    setSprints((prev) =>
      prev.map((s) => {
        if (s.sprint_id === sprintId) {
          return { ...s, is_active: true as const };
        }
        // Deattiva altri sprint attivi
        if (s.is_active) {
          return { ...s, is_active: false as const };
        }
        return s;
      })
    );
  };

  const handleCompleteSprint = () => {
    if (activeSprint) {
      setSprints((prev) =>
        prev.map((s) =>
          s.sprint_id === activeSprint.sprint_id
            ? { ...s, is_active: false as const }
            : s
        )
      );
    }
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const handleMoveTask = (taskId: number, targetSprintId: number | null) => {
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

    // Rimuovi il task dalla sorgente e aggiungilo alla destinazione
    if (sourceSprintId === null) {
      // Rimuovi dal backlog
      setBacklog((prev) => prev.filter((t) => t.task_id !== taskId));
    } else {
      // Rimuovi dallo sprint
      setSprints((prev) =>
        prev.map((s) =>
          s.sprint_id === sourceSprintId
            ? { ...s, tasks: s.tasks.filter((t) => t.task_id !== taskId) }
            : s
        )
      );
    }

    // Aggiungi alla destinazione
    if (targetSprintId === null) {
      // Aggiungi al backlog
      setBacklog((prev) => [...prev, { ...taskToMove!, sprint_id: null }]);
    } else {
      // Aggiungi allo sprint
      setSprints((prev) =>
        prev.map((s) =>
          s.sprint_id === targetSprintId
            ? {
                ...s,
                tasks: [
                  ...s.tasks,
                  { ...taskToMove!, sprint_id: targetSprintId },
                ],
              }
            : s
        )
      );
    }
  };

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

                {/* Sprint Pianificati */}
                {sprints
                  .filter((s) => s.is_active)
                  .map((sprint) => (
                    <div
                      key={sprint.sprint_id}
                      className="bg-white border border-default-200 rounded-2xl p-5"
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
                            onPress={() => handleStartSprint(sprint.sprint_id)}
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
                              <DropdownItem key="edit">
                                Modifica Sprint
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
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
                              />
                            ))
                          )}
                        </SortableContext>
                      </div>
                    </div>
                  ))}

                {/* Sprint Attivo */}
                {sprints.filter((s) => s.is_active).length === 0 ? (
                  <div className="bg-gradient-to-br from-default-50 to-default-100 border-2 border-dashed border-default-300 rounded-xl p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-sm">
                      <Icon
                        icon="solar:rocket-linear"
                        className="text-3xl text-default-400"
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
                        className="bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200 rounded-2xl p-5 transition-all duration-200"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="text-base font-semibold text-default-900">
                                {sprint.name}
                              </h4>
                              <span className="text-[10px] font-medium px-2 py-0.5 bg-primary text-white rounded-full">
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
                              <DropdownItem key="edit">
                                Modifica Sprint
                              </DropdownItem>
                              <DropdownItem key="complete">
                                Completa Sprint
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
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
                                />
                              ))
                            )}
                          </SortableContext>
                        </div>
                      </div>
                    ))
                )}
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
                      {backlog.length} tasks · {getTotalStoryPoints(backlog)} SP
                    </span>
                  </h3>
                </div>

                <div className="bg-default-50 border border-default-200 rounded-xl p-4">
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
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: selectedTask.task_priority.color,
                            }}
                          >
                            {selectedTask.task_priority.name}
                          </span>
                          {selectedTask.story_points && (
                            <span className="text-[10px] font-medium text-default-400 px-2 py-0.5 bg-default-100 rounded-full">
                              {selectedTask.story_points} Story Points
                            </span>
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
                              {selectedTask.description}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-semibold text-default-700 mb-2 block">
                                Status
                              </label>
                              <Chip size="sm" variant="flat">
                                {selectedTask.task_status.name}
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
                        <Dropdown>
                          <DropdownTrigger>
                            <Button
                              variant="bordered"
                              className="justify-start"
                            >
                              Priorità :{" "}
                              {
                                TaskPriorities.find(
                                  (p) =>
                                    p.task_priority_id ===
                                    newTask.task_priority_id
                                )?.name
                              }
                            </Button>
                          </DropdownTrigger>
                          <DropdownMenu
                            selectedKeys={[newTask.task_priority_id]}
                            onSelectionChange={(keys) => {
                              const selected =
                                Array.from(keys)[0 as Task["task_priority_id"]];
                              setNewTask({
                                ...newTask,
                                task_priority_id:
                                  selected as Task["task_priority_id"],
                              });
                            }}
                          >
                            {TaskPriorities.map((p) => (
                              <DropdownItem key={p.task_priority_id}>
                                {p.name}
                              </DropdownItem>
                            ))}
                          </DropdownMenu>
                        </Dropdown>
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
                        value={newSprint.goal}
                        onChange={(e) =>
                          setNewSprint({ ...newSprint, goal: e.target.value })
                        }
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <Input
                          type="date"
                          label="Data Inizio"
                          value={newSprint.start_date}
                          onChange={(e) =>
                            setNewSprint({
                              ...newSprint,
                              start_date: e.target.value,
                            })
                          }
                        />
                        <Input
                          type="date"
                          label="Data Fine"
                          value={newSprint.end_date}
                          onChange={(e) =>
                            setNewSprint({
                              ...newSprint,
                              end_date: e.target.value,
                            })
                          }
                        />
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

              {/* Overlay per il drag */}
              <DragOverlay
                dropAnimation={{
                  duration: 200,
                  easing: "cubic-bezier(0.25, 1, 0.5, 1)",
                }}
              >
                {activeTask ? (
                  <div
                    className="bg-white border-2 border-primary rounded-xl p-3 shadow-2xl"
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
                        <span className="text-[10px] font-medium px-2 py-0.5 bg-primary text-white rounded-full">
                          Attivo
                        </span>
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
                          {new Date(activeSprint.start_date).toLocaleDateString(
                            "it-IT",
                            {
                              day: "numeric",
                              month: "short",
                            }
                          )}{" "}
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
                          <Icon icon="solar:chart-linear" className="text-sm" />
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
                  tasks={activeSprint.tasks}
                  onTasksChange={(updatedTasks) => {
                    setSprints((prev) =>
                      prev.map((s) =>
                        s.sprint_id === activeSprint.sprint_id
                          ? { ...s, tasks: updatedTasks }
                          : s
                      )
                    );
                  }}
                  onTaskClick={handleTaskClick}
                />
              </div>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}
