import { useEffect, useState } from "react";
import {
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  useDisclosure,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { TaskStatus, Task, TaskPriority } from "../../../types";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import axios from "axios";

interface KanbanViewProps {
  projectId: number;
}

// Estendere TaskStatus per includere i task
interface TaskStatusWithTasks extends TaskStatus {
  tasks: Task[];
}

// Componente per singolo task drag & drop
function SortableTaskCard({
  task,
  onTaskClick,
}: {
  task: Task;
  onTaskClick: (task: Task) => void;
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
    <div
      ref={setNodeRef}
      style={style}
      className="group mb-2 hover:cursor-pointer"
    >
      <div className="bg-white border border-default-200 rounded-xl p-3 hover:border-default-300 hover:shadow-sm transition-all duration-200">
        <div className="flex items-start gap-2">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Icon
              icon="solar:hamburger-menu-linear"
              className="text-default-400 text-lg"
            />
          </div>

          {/* Task Content */}
          <div
            className="flex-1 min-w-0"
            onClick={(e) => {
              if (!isDragging) {
                e.stopPropagation();
                onTaskClick(task);
              }
            }}
          >
            <h4 className="font-medium text-sm text-default-900 mb-2 line-clamp-2">
              {task.title}
            </h4>
            <p className="text-xs text-default-500 mb-3 line-clamp-2">
              {task.description}
            </p>
            <div className="flex items-center gap-2">
              <Chip
                color={task.task_priority.color as any}
                variant="flat"
                size="sm"
                className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
              >
                {task.task_priority.name}
              </Chip>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  className="min-w-6 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Icon icon="solar:menu-dots-linear" className="text-base" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                <DropdownItem key="edit">Modifica</DropdownItem>
                <DropdownItem
                  key="delete"
                  className="text-danger"
                  color="danger"
                >
                  Elimina
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente per colonna Kanban
function KanbanColumnCard({
  column,
  onAddTask,
  onDeleteColumn,
  onEditColumn,
  onTaskClick,
}: {
  column: TaskStatusWithTasks;
  onAddTask: (columnId: number) => void;
  onDeleteColumn: (columnId: number) => void;
  onEditColumn: (columnId: number) => void;
  onTaskClick: (task: Task) => void;
}) {
  const taskIds = column.tasks.map((t: Task) => t.task_id);
  const { setNodeRef } = useDroppable({
    id: column.task_status_id,
  });

  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-default-50/50 border border-default-200 rounded-xl p-4 h-full flex flex-col backdrop-blur-sm">
        {/* Header colonna */}
        <div className="flex items-start justify-between mb-3 pb-3 border-b border-default-200">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm bg-${column.color}`}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-default-900 truncate uppercase tracking-wide">
                {column.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-default-500 mt-1">
                <span className="font-semibold bg-white px-2 py-0.5 rounded-full">
                  {column.tasks.length} task
                </span>
              </div>
            </div>
          </div>
          <Dropdown>
            <DropdownTrigger>
              <Button
                isIconOnly
                variant="flat"
                size="sm"
                className="min-w-7 w-7 h-7 hover:bg-default-200"
                title="Opzioni colonna"
              >
                <Icon icon="solar:menu-dots-bold" className="text-base" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem
                key="add-task"
                onPress={() => onAddTask(column.task_status_id)}
                startContent={<Icon icon="solar:add-circle-linear" />}
              >
                Aggiungi Task
              </DropdownItem>
              <DropdownItem
                key="edit"
                onPress={() => onEditColumn(column.task_status_id)}
                startContent={<Icon icon="solar:pen-linear" />}
              >
                Modifica Colonna
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                onPress={() => onDeleteColumn(column.task_status_id)}
                startContent={<Icon icon="solar:trash-bin-linear" />}
              >
                Elimina Colonna
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Task list */}
        <div
          ref={setNodeRef}
          className="flex-1 overflow-y-auto -mx-1 px-1"
          style={{ maxHeight: "calc(100vh - 450px)" }}
        >
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
          >
            {column.tasks.length === 0 ? (
              <div className="text-center py-16 text-default-400">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-3 shadow-sm">
                  <Icon
                    icon="solar:clipboard-linear"
                    className="text-3xl text-default-400"
                  />
                </div>
                <p className="text-xs font-medium">Trascina qui i task</p>
              </div>
            ) : (
              column.tasks.map((task) => (
                <SortableTaskCard
                  key={task.task_id}
                  task={task}
                  onTaskClick={onTaskClick}
                />
              ))
            )}
          </SortableContext>
        </div>

        {/* Pulsante aggiungi */}
        <Button
          variant="bordered"
          size="sm"
          className="w-full mt-3 font-medium border-dashed hover:border-primary hover:bg-primary-50"
          startContent={
            <Icon icon="solar:add-circle-linear" className="text-lg" />
          }
          onPress={() => onAddTask(column.task_status_id)}
        >
          Aggiungi Task
        </Button>
      </div>
    </div>
  );
}

export default function KanbanView({ projectId }: KanbanViewProps) {
  const {
    isOpen: isTaskModalOpen,
    onOpen: onTaskModalOpen,
    onClose: onTaskModalClose,
  } = useDisclosure();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);

  // Stati per i dati
  const [columns, setColumns] = useState<TaskStatusWithTasks[]>([]);
  const [TaskPriorities, setTaskPriorities] = useState<TaskPriority[]>([]);

  useEffect(() => {
    // Carica i task status con i task associati
    axios
      .get(`/project/GET/get-task-statuses`, {
        params: { project_id: projectId },
      })
      .then((res) => {
        if (res.status === 200) {
          // Trasforma i task status per includere i task
          const statusesWithTasks: TaskStatusWithTasks[] =
            res.data.task_statuses.map((status: TaskStatus) => ({
              ...status,
              tasks: [],
            }));
          setColumns(statusesWithTasks);
        }
      });

    // Carica le priorità dei task
    axios.get(`/project/GET/get-task-priorities`).then((res) => {
      if (res.status === 200) {
        setTaskPriorities(res.data.task_priorities);
      }
    });

    // Carica i task del progetto
    axios
      .get(`/project/GET/get-tasks-by-project-id`, {
        params: { project_id: projectId },
      })
      .then((res) => {
        if (res.status === 200) {
          const tasks: Task[] = res.data.tasks;
          // Distribuisci i task nelle colonne appropriate
          setColumns((prevColumns) =>
            prevColumns.map((column) => ({
              ...column,
              tasks: tasks.filter(
                (task) => task.task_status_id === column.task_status_id
              ),
            }))
          );
        }
      });
  }, [projectId]);

  // Form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    task_priority_id: 1,
    task_status_id: 1,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    // Trova il task attivo in tutte le colonne
    let activeTask: Task | null = null;
    for (const column of columns) {
      activeTask = column.tasks.find((t) => t.task_id === active.id) || null;
      if (activeTask) break;
    }
    setActiveTask(activeTask);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over || active.id === over.id) return;

    const activeId = active.id as number;
    const overId = over.id as number;

    setColumns((prevColumns) => {
      // Trova la colonna di origine
      const activeColumnIndex = prevColumns.findIndex((col) =>
        col.tasks.some((t) => t.task_id === activeId)
      );

      if (activeColumnIndex === -1) return prevColumns;

      const activeColumn = prevColumns[activeColumnIndex];
      const activeTask = activeColumn.tasks.find((t) => t.task_id === activeId);

      if (!activeTask) return prevColumns;

      // Trova la colonna di destinazione (può essere droppato su task o colonna)
      let overColumnIndex = prevColumns.findIndex((col) =>
        col.tasks.some((t) => t.task_id === overId)
      );

      // Se non trovato nei task, potrebbe essere l'ID della colonna stessa
      if (overColumnIndex === -1) {
        overColumnIndex = prevColumns.findIndex(
          (col) => col.task_status_id === overId
        );
      }

      if (overColumnIndex === -1) return prevColumns;

      const newColumns = [...prevColumns];

      // Rimuovi dalla colonna di origine
      newColumns[activeColumnIndex] = {
        ...newColumns[activeColumnIndex],
        tasks: newColumns[activeColumnIndex].tasks.filter(
          (t) => t.task_id !== activeId
        ),
      };

      // Aggiungi alla colonna di destinazione
      const updatedTask = {
        ...activeTask,
        task_status_id: newColumns[overColumnIndex].task_status_id,
      };

      // Trova la posizione di inserimento
      const overTask = newColumns[overColumnIndex].tasks.find(
        (t) => t.task_id === overId
      );

      if (overTask) {
        const overIndex = newColumns[overColumnIndex].tasks.indexOf(overTask);
        const newTasks = [...newColumns[overColumnIndex].tasks];
        newTasks.splice(overIndex, 0, updatedTask);
        newColumns[overColumnIndex] = {
          ...newColumns[overColumnIndex],
          tasks: newTasks,
        };
      } else {
        // Aggiungi alla fine se droppato sulla colonna
        newColumns[overColumnIndex] = {
          ...newColumns[overColumnIndex],
          tasks: [...newColumns[overColumnIndex].tasks, updatedTask],
        };
      }

      return newColumns;
    });
  };

  const handleAddTask = (columnId: number) => {
    setSelectedColumnId(columnId);
    onTaskModalOpen();
  };

  const handleCreateTask = () => {
    if (!selectedColumnId) return;

    const task: Task = {
      task_id: Date.now(),
      title: newTask.title,
      description: newTask.description,
      task_status_id: selectedColumnId,
      task_priority_id: newTask.task_priority_id,
      story_points: 0,
      sprint_id: null,
      project_id: projectId,
      created_by_id: 1, // TODO: ottenere dall'utente loggato
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      task_status: columns.find((c) => c.task_status_id === selectedColumnId)!,
      task_priority: TaskPriorities.find(
        (p) => p.task_priority_id === newTask.task_priority_id
      )!,
      project: {} as any, // TODO: popolare con i dati del progetto
      created_by: {} as any, // TODO: popolare con i dati dell'utente
    };

    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col.task_status_id === selectedColumnId
          ? { ...col, tasks: [...col.tasks, task] }
          : col
      )
    );

    setNewTask({
      title: "",
      description: "",
      task_priority_id: 1,
      task_status_id: 1,
    });
    setSelectedColumnId(null);
    onTaskModalClose();
  };

  const handleDeleteColumn = (columnId: number) => {
    setColumns(columns.filter((col) => col.task_status_id !== columnId));
  };

  const getTotalTasks = () => {
    return columns.reduce((sum, col) => sum + col.tasks.length, 0);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header con azioni */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-default-900">Kanban Board</h2>
          <p className="text-sm text-default-500 mt-0.5">
            {getTotalTasks()} task · {columns.length} colonne
          </p>
        </div>
      </div>

      {/* Board Kanban */}
      <div className="overflow-x-auto pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-4 min-w-max">
            {columns.map((column) => (
              <KanbanColumnCard
                key={column.task_status_id}
                column={column}
                onAddTask={handleAddTask}
                onDeleteColumn={handleDeleteColumn}
                onEditColumn={(id) => console.log("Edit column", id)}
                onTaskClick={handleTaskClick}
              />
            ))}
          </div>

          <DragOverlay
            dropAnimation={{
              duration: 200,
              easing: "cubic-bezier(0.25, 1, 0.5, 1)",
            }}
          >
            {activeTask ? (
              <div
                className="w-80 bg-white border-2 border-primary rounded-xl p-3 shadow-2xl"
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
        </DndContext>
      </div>

      {/* Modal Nuovo Task */}
      <Modal isOpen={isTaskModalOpen} onClose={onTaskModalClose} size="2xl">
        <ModalContent>
          <ModalHeader>Nuovo Task</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Titolo"
                placeholder="Es: Implementare feature X"
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
                  setNewTask({ ...newTask, description: e.target.value })
                }
              />
              <Dropdown>
                <DropdownTrigger>
                  <Button variant="bordered" className="justify-start">
                    Priorità:{" "}
                    {
                      TaskPriorities.find(
                        (p) => p.task_priority_id === newTask.task_priority_id
                      )?.name
                    }
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  selectedKeys={[newTask.task_priority_id.toString()]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string;
                    setNewTask({
                      ...newTask,
                      task_priority_id: parseInt(selected),
                    });
                  }}
                >
                  {TaskPriorities.map((p) => (
                    <DropdownItem key={p.task_priority_id.toString()}>
                      {p.name}
                    </DropdownItem>
                  ))}
                </DropdownMenu>
              </Dropdown>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onTaskModalClose}>
              Annulla
            </Button>
            <Button color="primary" onPress={handleCreateTask}>
              Crea Task
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

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
                <h3 className="text-lg font-semibold">{selectedTask.title}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <Chip
                    color={selectedTask.task_priority?.color as any}
                    variant="flat"
                    size="sm"
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                  >
                    {selectedTask.task_priority?.name}
                  </Chip>
                  {selectedTask.story_points && (
                    <Chip
                      variant="flat"
                      size="sm"
                      className="text-[10px] font-semibold px-2.5 py-1 rounded-full"
                    >
                      {selectedTask.story_points} SP
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
                      {selectedTask.description}
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
                        {selectedTask.task_status?.name}
                      </Chip>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-semibold text-default-700 mb-2 block">
                      Creato il
                    </label>
                    <p className="text-sm text-default-600">
                      {new Date(selectedTask.created_at).toLocaleDateString(
                        "it-IT",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
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
    </div>
  );
}
