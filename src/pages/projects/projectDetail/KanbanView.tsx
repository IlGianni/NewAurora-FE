import { useState } from "react";
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
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { KanbanColumn, Task } from "../../../types";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KanbanViewProps {
  projectId: number;
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

  const priorityConfig = {
    low: { color: "#10b981", bg: "#f0fdf4", label: "Bassa" },
    medium: { color: "#f59e0b", bg: "#fffbeb", label: "Media" },
    high: { color: "#ef4444", bg: "#fef2f2", label: "Alta" },
  } as const;

  const priority = priorityConfig[task.priority];

  return (
    <div ref={setNodeRef} style={style} className="group mb-2">
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
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                style={{
                  color: priority.color,
                  backgroundColor: priority.bg,
                }}
              >
                {priority.label}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {task.assigned_to && (
              <Avatar
                size="sm"
                name={`${task.assigned_to.name} ${task.assigned_to.surname}`}
                className="w-6 h-6 text-xs"
              />
            )}
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
  column: KanbanColumn;
  onAddTask: (columnId: number) => void;
  onDeleteColumn: (columnId: number) => void;
  onEditColumn: (columnId: number) => void;
  onTaskClick: (task: Task) => void;
}) {
  const taskIds = column.tasks.map((t) => t.task_id);
  const isOverLimit =
    column.wip_limit && column.tasks.length >= column.wip_limit;

  return (
    <div className="flex-shrink-0 w-80">
      <div className="bg-default-50/50 border border-default-200 rounded-xl p-4 h-full flex flex-col backdrop-blur-sm">
        {/* Header colonna */}
        <div className="flex items-start justify-between mb-3 pb-3 border-b border-default-200">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
              style={{ backgroundColor: column.color }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-default-900 truncate uppercase tracking-wide">
                {column.name}
              </h3>
              <div className="flex items-center gap-2 text-xs text-default-500 mt-1">
                <span className="font-semibold bg-white px-2 py-0.5 rounded-full">
                  {column.tasks.length} task
                </span>
                {column.wip_limit && (
                  <span
                    className={`font-semibold px-2 py-0.5 rounded-full ${
                      isOverLimit
                        ? "text-danger-600 bg-danger-50"
                        : "text-default-600 bg-white"
                    }`}
                  >
                    WIP: {column.tasks.length}/{column.wip_limit}
                  </span>
                )}
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
                onPress={() => onAddTask(column.column_id)}
                startContent={<Icon icon="solar:add-circle-linear" />}
              >
                Aggiungi Task
              </DropdownItem>
              <DropdownItem
                key="edit"
                onPress={() => onEditColumn(column.column_id)}
                startContent={<Icon icon="solar:pen-linear" />}
              >
                Modifica Colonna
              </DropdownItem>
              <DropdownItem
                key="delete"
                className="text-danger"
                color="danger"
                onPress={() => onDeleteColumn(column.column_id)}
                startContent={<Icon icon="solar:trash-bin-linear" />}
              >
                Elimina Colonna
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </div>

        {/* Task list */}
        <div
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
          onPress={() => onAddTask(column.column_id)}
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
  const {
    isOpen: isColumnModalOpen,
    onOpen: onColumnModalOpen,
    onClose: onColumnModalClose,
  } = useDisclosure();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);

  // Dati mock - da sostituire con chiamate API
  const [columns, setColumns] = useState<KanbanColumn[]>([
    {
      column_id: 1,
      name: "Da Fare",
      color: "#94A3B8",
      order: 0,
      wip_limit: undefined,
      project_id: projectId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks: [
        {
          task_id: 1,
          title: "Implementare autenticazione",
          description: "Sistema di login con JWT",
          status: "todo",
          priority: "high",
          column_id: 1,
          order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          task_id: 2,
          title: "Design homepage",
          description: "Creare mockup della homepage",
          status: "todo",
          priority: "medium",
          column_id: 1,
          order: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    },
    {
      column_id: 2,
      name: "In Corso",
      color: "#3B82F6",
      order: 1,
      wip_limit: 3,
      project_id: projectId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks: [
        {
          task_id: 3,
          title: "Setup CI/CD",
          description: "Configurare pipeline di deployment",
          status: "in_progress",
          priority: "high",
          column_id: 2,
          order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    },
    {
      column_id: 3,
      name: "In Review",
      color: "#F59E0B",
      order: 2,
      wip_limit: 2,
      project_id: projectId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks: [],
    },
    {
      column_id: 4,
      name: "Completato",
      color: "#10B981",
      order: 3,
      wip_limit: undefined,
      project_id: projectId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks: [
        {
          task_id: 4,
          title: "Setup progetto",
          description: "Inizializzazione repository",
          status: "completed",
          priority: "medium",
          column_id: 4,
          order: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ],
    },
  ]);

  // Form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
  });

  const [newColumn, setNewColumn] = useState({
    name: "",
    color: "#94A3B8",
    wip_limit: undefined as number | undefined,
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
    const task = columns
      .flatMap((col) => col.tasks)
      .find((t) => t.task_id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id as number;

    if (activeId === overId) return;

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
          (col) => col.column_id === overId
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
        column_id: newColumns[overColumnIndex].column_id,
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
      status: "todo",
      priority: newTask.priority,
      column_id: selectedColumnId,
      order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setColumns((prevColumns) =>
      prevColumns.map((col) =>
        col.column_id === selectedColumnId
          ? { ...col, tasks: [...col.tasks, task] }
          : col
      )
    );

    setNewTask({ title: "", description: "", priority: "medium" });
    setSelectedColumnId(null);
    onTaskModalClose();
  };

  const handleCreateColumn = () => {
    const column: KanbanColumn = {
      column_id: Date.now(),
      name: newColumn.name,
      color: newColumn.color,
      order: columns.length,
      wip_limit: newColumn.wip_limit,
      project_id: projectId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks: [],
    };

    setColumns([...columns, column]);
    setNewColumn({ name: "", color: "#94A3B8", wip_limit: undefined });
    onColumnModalClose();
  };

  const handleDeleteColumn = (columnId: number) => {
    setColumns(columns.filter((col) => col.column_id !== columnId));
  };

  const getTotalTasks = () => {
    return columns.reduce((sum, col) => sum + col.tasks.length, 0);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  const priorityConfig = {
    low: { color: "#10b981", bg: "#f0fdf4", label: "Bassa" },
    medium: { color: "#f59e0b", bg: "#fffbeb", label: "Media" },
    high: { color: "#ef4444", bg: "#fef2f2", label: "Alta" },
  } as const;

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
        <Button
          color="primary"
          onPress={onColumnModalOpen}
          startContent={
            <Icon icon="solar:add-square-linear" className="text-lg" />
          }
          className="font-medium shadow-sm"
        >
          Nuova Colonna
        </Button>
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
            {columns
              .sort((a, b) => a.order - b.order)
              .map((column) => (
                <KanbanColumnCard
                  key={column.column_id}
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
                    Priorità: {newTask.priority}
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  selectedKeys={[newTask.priority]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as Task["priority"];
                    setNewTask({ ...newTask, priority: selected });
                  }}
                >
                  <DropdownItem key="low">Low</DropdownItem>
                  <DropdownItem key="medium">Medium</DropdownItem>
                  <DropdownItem key="high">High</DropdownItem>
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
                  <span
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                    style={{
                      color: priorityConfig[selectedTask.priority].color,
                      backgroundColor: priorityConfig[selectedTask.priority].bg,
                    }}
                  >
                    {priorityConfig[selectedTask.priority].label}
                  </span>
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
                        {selectedTask.status}
                      </Chip>
                    </div>

                    {selectedTask.assigned_to && (
                      <div>
                        <label className="text-sm font-semibold text-default-700 mb-2 block">
                          Assegnato a
                        </label>
                        <div className="flex items-center gap-2">
                          <Avatar
                            size="sm"
                            name={`${selectedTask.assigned_to.name} ${selectedTask.assigned_to.surname}`}
                            className="w-8 h-8"
                          />
                          <span className="text-sm">
                            {selectedTask.assigned_to.name}{" "}
                            {selectedTask.assigned_to.surname}
                          </span>
                        </div>
                      </div>
                    )}
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

      {/* Modal Nuova Colonna */}
      <Modal isOpen={isColumnModalOpen} onClose={onColumnModalClose} size="md">
        <ModalContent>
          <ModalHeader>Nuova Colonna</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Nome Colonna"
                placeholder="Es: In Testing"
                value={newColumn.name}
                onChange={(e) =>
                  setNewColumn({ ...newColumn, name: e.target.value })
                }
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Colore</label>
                <div className="flex gap-2 flex-wrap">
                  {[
                    "#94A3B8",
                    "#3B82F6",
                    "#F59E0B",
                    "#10B981",
                    "#EF4444",
                    "#8B5CF6",
                    "#EC4899",
                  ].map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-lg border-2 transition-all ${
                        newColumn.color === color
                          ? "border-black scale-110"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewColumn({ ...newColumn, color })}
                    />
                  ))}
                </div>
              </div>
              <Input
                type="number"
                label="WIP Limit (opzionale)"
                placeholder="Es: 3"
                value={newColumn.wip_limit?.toString() || ""}
                onChange={(e) =>
                  setNewColumn({
                    ...newColumn,
                    wip_limit: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  })
                }
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onColumnModalClose}>
              Annulla
            </Button>
            <Button color="primary" onPress={handleCreateColumn}>
              Crea Colonna
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
