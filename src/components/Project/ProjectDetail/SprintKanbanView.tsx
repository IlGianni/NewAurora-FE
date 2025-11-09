import { useState } from "react";
import {
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  addToast,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Task, TaskStatus } from "../../../types";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import type { DropResult } from "@hello-pangea/dnd";
import axios from "axios";

interface SprintKanbanViewProps {
  setUpdate: (update: boolean) => void;
  update: boolean;
  tasks: Task[];
  taskStatuses: TaskStatus[];
  onTasksChange: (tasks: Task[]) => void;
}

// Componente per singolo task
function TaskCard({
  task,
  index,
  onTaskClick,
}: {
  task: Task;
  index: number;
  onTaskClick?: (task: Task) => void;
}) {
  return (
    <Draggable draggableId={task.task_id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className="group mb-2"
          style={provided.draggableProps.style}
        >
          <div
            className={`mb-2 bg-default/10 border border-default-50 rounded-lg hover:border-primary-200 hover:shadow-sm transition-all duration-200 overflow-hidden ${
              snapshot.isDragging ? "opacity-50" : ""
            }`}
          >
            <div className="flex items-start gap-2 p-2.5">
              {/* Drag Handle */}
              <div className="flex-shrink-0 cursor-grab active:cursor-grabbing -ml-0.5 px-0.5 py-1.5 rounded hover:bg-default-100 transition-colors">
                <Icon
                  icon="solar:hamburger-menu-linear"
                  className="text-default-400 group-hover:text-default-600 text-sm transition-colors"
                />
              </div>

              {/* Task Content */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={(e) => {
                  if (!snapshot.isDragging && onTaskClick) {
                    e.stopPropagation();
                    onTaskClick(task);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h4 className="font-semibold text-xs text-default-900 leading-snug">
                    {task.title}
                  </h4>
                </div>

                {task.description && (
                  <p className="text-[10px] text-default-500 line-clamp-2 mb-2 leading-relaxed">
                    {task.description}
                  </p>
                )}

                <div className="flex items-center gap-1.5">
                  <Chip
                    color={task.task_priority?.color as any}
                    variant="flat"
                    size="sm"
                    className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                  >
                    {task.task_priority?.name}
                  </Chip>
                  {task.story_points && (
                    <Chip
                      variant="flat"
                      size="sm"
                      className="text-[9px] font-semibold px-2 py-0.5 rounded-full"
                    >
                      {task.story_points} SP
                    </Chip>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}

// Componente per colonna Kanban
function KanbanColumn({
  status,
  tasks,
  onTaskClick,
}: {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}) {
  return (
    <div className="flex flex-col">
      <Droppable droppableId={status.task_status_id.toString()}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`bg-default-50/50 border-2 rounded-xl p-3 flex-1 backdrop-blur-sm transition-all duration-200 ${
              snapshot.isDraggingOver
                ? "border-primary-500 bg-primary-50/30 shadow-lg"
                : "border-default-200"
            }`}
          >
            {/* Header colonna */}
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-default-200">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 bg-${status.color}`}
              />
              <h3 className="font-bold text-xs text-default-900 flex-1 uppercase tracking-wide">
                {status.name}
              </h3>
              <span className="text-xs font-semibold text-default-600 bg-default/10 px-2 py-0.5 rounded-full">
                {tasks.length}
              </span>
            </div>

            {/* Task list */}
            <div className="min-h-[200px]">
              {tasks.length === 0 ? (
                <div className="text-center py-10 text-default-400">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-default/10 rounded-full mb-2 shadow-sm">
                    <Icon
                      icon="solar:clipboard-linear"
                      className="text-2xl text-default-400"
                    />
                  </div>
                  <p className="text-[10px] font-medium">Trascina qui i task</p>
                </div>
              ) : (
                tasks.map((task, index) => (
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
          </div>
        )}
      </Droppable>
    </div>
  );
}

export default function SprintKanbanView({
  setUpdate,
  update,
  tasks,
  taskStatuses,
}: SprintKanbanViewProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Se non c'è destinazione o è la stessa posizione, non fare nulla
    if (!destination) return;
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    const sourceStatusId = parseInt(source.droppableId);
    const destStatusId = parseInt(destination.droppableId);
    const taskId = parseInt(draggableId);

    // Trova il task da spostare
    const activeTask = tasks.find((t) => t.task_id == taskId);
    if (!activeTask) return;

    // Trova lo status di destinazione
    const targetStatus = taskStatuses.find(
      (status) => status.task_status_id == destStatusId
    );
    if (!targetStatus) return;

    // Se è la stessa colonna, riordina solo
    if (sourceStatusId === destStatusId) {
      /*const newTasks = Array.from(tasks);
      const sourceIndex = newTasks.findIndex((t) => t.task_id === taskId);
      const [removed] = newTasks.splice(sourceIndex, 1);
      newTasks.splice(destination.index, 0, removed);
      onTasksChange(newTasks);*/
      return;
    }
    /*console.log(sourceStatusId, destStatusId);

    // Sposta il task nella nuova colonna
    const updatedTasks = tasks.map((task) =>
      task.task_id === taskId
        ? {
            ...task,
            task_status_id: targetStatus.task_status_id,
            task_status: targetStatus,
          }
        : task
    );

    // Riordina i task nella nuova colonna
    const sourceTasks = updatedTasks.filter(
      (t) => t.task_status_id === sourceStatusId
    );
    const destTasks = updatedTasks.filter(
      (t) => t.task_status_id === destStatusId
    );

    const sourceIndex = sourceTasks.findIndex((t) => t.task_id === taskId);
    const movedTask = sourceTasks[sourceIndex];
    sourceTasks.splice(sourceIndex, 1);
    destTasks.splice(destination.index, 0, movedTask);

    const otherTasks = updatedTasks.filter(
      (t) =>
        t.task_status_id !== sourceStatusId && t.task_status_id !== destStatusId
    );

    onTasksChange([...otherTasks, ...sourceTasks, ...destTasks]);*/

    // Chiamata axios per aggiornare lo status del task nel backend
    axios
      .put(`/project/UPDATE/update-task-status`, {
        task_id: taskId,
        task_status_id: destStatusId,
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
      });
  };

  const getTasksByStatus = (statusId: number) => {
    return tasks.filter((task) => task.task_status_id === statusId);
  };

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setTaskDetailOpen(true);
  };

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-4 gap-3">
          {taskStatuses.map((status) => {
            const columnTasks = getTasksByStatus(status.task_status_id);

            return (
              <KanbanColumn
                key={status.task_status_id}
                status={status}
                tasks={columnTasks}
                onTaskClick={handleTaskClick}
              />
            );
          })}
        </div>
      </DragDropContext>

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
