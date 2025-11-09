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
  SelectItem,
  Select,
  addToast,
  Spinner,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { TaskStatus, Task, TaskPriority } from "../../../types";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import axios from "axios";

interface KanbanViewProps {
  projectId: number;
}

// Estendere TaskStatus per includere i task
interface TaskStatusWithTasks extends TaskStatus {
  tasks: Task[];
}

// Componente per singolo task drag & drop
function TaskCard({
  task,
  index,
  onTaskClick,
}: {
  task: Task;
  index: number;
  onTaskClick: (task: Task) => void;
}) {
  return (
    <Draggable draggableId={task.task_id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="mb-2 group"
        >
          <div
            className={`bg-default/10 border border-default-50 rounded-xl p-3 hover:border-default-300 hover:shadow-sm`}
          >
            <div className="flex items-start gap-2">
              {/* Drag Handle */}
              <div className="flex-shrink-0 cursor-grab active:cursor-grabbing pt-0.5 transition-opacity">
                <Icon
                  icon="solar:hamburger-menu-linear"
                  className="text-default-400 text-lg"
                />
              </div>

              {/* Task Content */}
              <div
                className="flex-1 min-w-0"
                onClick={(e) => {
                  if (!snapshot.isDragging) {
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
                      <Icon
                        icon="solar:menu-dots-linear"
                        className="text-base"
                      />
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
      )}
    </Draggable>
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
  return (
    <div className="flex-shrink-0 w-80">
      <Droppable droppableId={column.task_status_id.toString()}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`bg-default-50/50 border-2 rounded-xl p-4 h-full flex flex-col backdrop-blur-sm transition-all duration-200 ${
              snapshot.isDraggingOver
                ? "border-primary-500 bg-primary-50/30 shadow-lg"
                : "border-default-200"
            }`}
          >
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
                    <span className="font-semibold bg-default/10 px-2 py-0.5 rounded-full text-primary">
                      {column.tasks.length} task
                    </span>
                  </div>
                </div>
              </div>
              {column.name !== "completed" && (
                <Dropdown>
                  <DropdownTrigger>
                    <Button
                      isIconOnly
                      variant="flat"
                      size="sm"
                      className="min-w-7 w-7 h-7"
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
                      color="primary"
                    >
                      Aggiungi Task
                    </DropdownItem>
                    <DropdownItem
                      key="edit"
                      onPress={() => onEditColumn(column.task_status_id)}
                      startContent={<Icon icon="solar:pen-linear" />}
                      color="primary"
                    >
                      Modifica Colonna
                    </DropdownItem>
                    <DropdownItem
                      key="delete"
                      className="text-danger"
                      color="danger"
                      onPress={() => onDeleteColumn(column.task_status_id)}
                      startContent={
                        <Icon icon="solar:trash-bin-trash-linear" />
                      }
                    >
                      Elimina Colonna
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              )}
            </div>

            {/* Task list */}
            <div
              className="flex-1 overflow-y-auto -mx-1 px-1"
              style={{ maxHeight: "calc(100vh - 450px)" }}
            >
              {column.tasks.length === 0 ? (
                <div className="text-center py-16 text-default-400">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-default-50 rounded-full mb-3 shadow-sm">
                    <Icon
                      icon="solar:clipboard-linear"
                      className="text-3xl text-default-400"
                    />
                  </div>
                  <p className="text-xs font-medium">Trascina qui i task</p>
                </div>
              ) : (
                column.tasks.map((task, index) => (
                  <TaskCard
                    key={task.task_id}
                    task={task}
                    index={index}
                    onTaskClick={onTaskClick}
                  />
                ))
              )}
              {provided.placeholder}
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
        )}
      </Droppable>
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

  const [selectedColumnId, setSelectedColumnId] = useState<number | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);

  // Stati per i dati
  const [columns, setColumns] = useState<TaskStatusWithTasks[]>([]);
  const [TaskPriorities, setTaskPriorities] = useState<TaskPriority[]>([]);
  const [update, setUpdate] = useState(false);
  const [loading, setLoading] = useState(0);

  useEffect(() => {
    setLoading((prev) => prev - 3); // -3 per le tre chiamate API
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
          // Ordina le colonne: "completed" va per ultima
          const sortedStatuses = statusesWithTasks.sort((a, b) => {
            const aName = a.name.toLowerCase();
            const bName = b.name.toLowerCase();
            const isACompleted = aName === "completed";
            const isBCompleted = bName === "completed";

            if (isACompleted && !isBCompleted) return 1;
            if (!isACompleted && isBCompleted) return -1;
            return 0;
          });
          setColumns(sortedStatuses);
          setLoading((prev) => prev + 1);
        }
      });

    // Carica le priorità dei task
    axios.get(`/project/GET/get-task-priorities`).then((res) => {
      if (res.status === 200) {
        setTaskPriorities(res.data.task_priorities);
        setLoading((prev) => prev + 1);
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
          setColumns((prevColumns) => {
            const updatedColumns = prevColumns.map((column) => ({
              ...column,
              tasks: tasks.filter(
                (task) => task.task_status_id === column.task_status_id
              ),
            }));
            // Riordina: "completed" va per ultima
            return updatedColumns.sort((a, b) => {
              const aName = a.name.toLowerCase();
              const bName = b.name.toLowerCase();
              const isACompleted = aName === "completed";
              const isBCompleted = bName === "completed";

              if (isACompleted && !isBCompleted) return 1;
              if (!isACompleted && isBCompleted) return -1;
              return 0;
            });
          });
          setLoading((prev) => prev + 1);
        }
      });
  }, [projectId, update]);

  // Form state
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    task_priority_id: 1,
    task_status_id: 1,
    story_points: 0,
    sprint_id: null,
    project_id: projectId,
  });

  const [newColumn, setNewColumn] = useState({
    name: "",
    color: "#000000",
    project_id: projectId,
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se non c'è destinazione, non fare nulla
    if (!destination) {
      return;
    }
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceColumnId = parseInt(source.droppableId);
    const destColumnId = parseInt(destination.droppableId);
    const taskId = parseInt(draggableId);

    // Se è la stessa colonna, non fare nulla
    if (sourceColumnId === destColumnId) {
      return;
    }

    // Aggiornamento ottimistico
    setColumns((prevColumns) => {
      const newColumns = [...prevColumns];

      // Trova la colonna di origine
      const sourceColumnIndex = newColumns.findIndex(
        (col) => col.task_status_id === sourceColumnId
      );

      // Trova la colonna di destinazione
      const destColumnIndex = newColumns.findIndex(
        (col) => col.task_status_id === destColumnId
      );

      if (sourceColumnIndex === -1 || destColumnIndex === -1)
        return prevColumns;

      const sourceCol = newColumns[sourceColumnIndex];
      const destCol = newColumns[destColumnIndex];

      // Trova il task nella colonna di origine
      const activeTask = sourceCol.tasks.find((t) => t.task_id === taskId);
      if (!activeTask) return prevColumns;

      // Rimuovi dalla colonna di origine
      const newSourceTasks = Array.from(sourceCol.tasks);
      newSourceTasks.splice(source.index, 1);

      // Aggiungi alla colonna di destinazione
      const updatedTask = {
        ...activeTask,
        task_status_id: destColumnId,
      };
      const newDestTasks = Array.from(destCol.tasks);
      newDestTasks.splice(destination.index, 0, updatedTask);

      newColumns[sourceColumnIndex] = {
        ...sourceCol,
        tasks: newSourceTasks,
      };

      newColumns[destColumnIndex] = {
        ...destCol,
        tasks: newDestTasks,
      };

      return newColumns;
    });

    // Chiamata axios per aggiornare lo status del task nel backend
    axios
      .put(`/project/UPDATE/update-task-status`, {
        task_id: taskId,
        task_status_id: destColumnId,
      })
      .then((res) => {
        if (res.status === 200) {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Task aggiornato con successo!",
            description: "Il task è stato aggiornato con successo",
            color: "success",
          });
          setUpdate(!update);
        } else {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante l'aggiornamento del task",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
          setUpdate(!update);
        }
      })
      .catch((error) => {
        console.error(
          "Errore nell'aggiornamento dello status del task:",
          error
        );
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore durante l'aggiornamento del task",
          description: "Non è stato possibile aggiornare lo status del task",
          color: "danger",
        });
        setUpdate(!update);
      });
  };

  const handleAddTask = (columnId: number) => {
    setSelectedColumnId(columnId);
    setNewTask((prev) => ({
      ...prev,
      task_status_id: columnId,
    }));
    onTaskModalOpen();
  };

  const handleCreateTask = async () => {
    if (!selectedColumnId) return;

    await axios
      .post(`/project/POST/create-task`, { task_data: newTask })
      .then((res) => {
        if (res.status === 200) {
          setNewTask({
            title: "",
            description: "",
            task_status_id: 1,
            task_priority_id: 1,
            story_points: 0,
            sprint_id: null,
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
    setSelectedColumnId(null);
    onTaskModalClose();
  };

  const handleCreateColumn = async () => {
    await axios
      .post(`/project/POST/create-task-status`, { task_status_data: newColumn })
      .then((res) => {
        if (res.status === 200) {
          setNewColumn({
            name: "",
            color: "#000000",
            project_id: projectId,
          });
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Colonna creata con successo!",
            description: "La colonna è stata creata con successo",
            color: "success",
          });
          setUpdate(!update);
        } else {
          addToast({
            timeout: 3000,
            shouldShowTimeoutProgress: true,
            title: "Errore durante la creazione della colonna",
            description: "Controlla i dati inseriti e riprova",
            color: "danger",
          });
        }
      })
      .catch(() => {
        addToast({
          timeout: 3000,
          shouldShowTimeoutProgress: true,
          title: "Errore durante la creazione della colonna",
          description: "Controlla i dati inseriti e riprova",
          color: "danger",
        });
      });
    onColumnModalClose();
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

  if (loading !== 0) {
    return (
      <div className="flex justify-center items-center h-84">
        <Spinner variant="wave" />
      </div>
    );
  }

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
          onPress={() => onColumnModalOpen()}
          startContent={<Icon icon="solar:add-circle-linear" />}
        >
          Aggiungi Colonna
        </Button>
      </div>

      {/* Board Kanban */}
      <div className="overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
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
        </DragDropContext>
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
                    <SelectItem key={priority.task_priority_id} color="primary">
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

      {/* Modal Nuova Colonna */}
      <Modal isOpen={isColumnModalOpen} onClose={onColumnModalClose} size="2xl">
        <ModalContent>
          <ModalHeader>Nuova Colonna</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="Nome"
                placeholder="Es: Implementare feature X"
                value={newColumn.name}
                onChange={(e) =>
                  setNewColumn({ ...newColumn, name: e.target.value })
                }
              />
              <Select
                label="Colore"
                placeholder="Seleziona un colore"
                selectedKeys={[newColumn.color]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setNewColumn({ ...newColumn, color: selected });
                }}
              >
                <SelectItem color="primary">primary</SelectItem>
                <SelectItem color="secondary">secondary</SelectItem>
                <SelectItem color="success">success</SelectItem>
                <SelectItem color="warning">warning</SelectItem>
                <SelectItem color="danger">danger</SelectItem>
                <SelectItem color="default">default</SelectItem>
              </Select>
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
