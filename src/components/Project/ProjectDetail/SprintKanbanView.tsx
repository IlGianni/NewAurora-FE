import { useState } from "react";
import {
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Task, TaskStatus } from "../../../types";
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
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SprintKanbanViewProps {
  tasks: Task[];
  taskStatuses: TaskStatus[];
  onTasksChange: (tasks: Task[]) => void;
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
  const { setNodeRef } = useDroppable({
    id: status.task_status_id,
  });

  const taskIds = tasks.map((t: Task) => t.task_id);

  return (
    <div className="flex flex-col">
      <div
        className="bg-default-50/50 border border-default-200 rounded-xl p-3 flex-1 backdrop-blur-sm"
        data-column-id={status.task_status_id}
      >
        {/* Header colonna */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-default-200">
          <div
            className={`w-2 h-2 rounded-full flex-shrink-0 bg-${status.color}`}
          />
          <h3 className="font-bold text-xs text-default-900 flex-1 uppercase tracking-wide">
            {status.name}
          </h3>
          <span className="text-xs font-semibold text-default-600 bg-white px-2 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>

        {/* Task list */}
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          <div
            ref={setNodeRef}
            className="min-h-[200px]"
            onDrop={(e) => {
              e.preventDefault();
            }}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            data-droppable="true"
          >
            {tasks.length === 0 ? (
              <div className="text-center py-10 text-default-400">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full mb-2 shadow-sm">
                  <Icon
                    icon="solar:clipboard-linear"
                    className="text-2xl text-default-400"
                  />
                </div>
                <p className="text-[10px] font-medium">Trascina qui i task</p>
              </div>
            ) : (
              tasks.map((task) => (
                <SortableTaskCard
                  key={task.task_id}
                  task={task}
                  onTaskClick={onTaskClick}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

// Componente per singolo task
function SortableTaskCard({
  task,
  onTaskClick,
}: {
  task: Task;
  onTaskClick?: (task: Task) => void;
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
        className="mb-2 bg-default/10 border border-default-50 rounded-lg hover:border-primary-200 hover:shadow-sm transition-all duration-200 overflow-hidden"
        style={{
          cursor: isDragging ? "grabbing" : "default",
        }}
      >
        <div className="flex items-start gap-2 p-2.5">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing -ml-0.5 px-0.5 py-1.5 rounded hover:bg-default-100 transition-colors"
            title="Trascina per spostare"
          >
            <Icon
              icon="solar:hamburger-menu-linear"
              className="text-default-400 group-hover:text-default-600 text-sm transition-colors"
            />
          </div>

          {/* Task Content */}
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={(e) => {
              if (!isDragging && onTaskClick) {
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
  );
}

export default function SprintKanbanView({
  tasks,
  taskStatuses,
  onTasksChange,
}: SprintKanbanViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskDetailOpen, setTaskDetailOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.task_id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as number;
    const overId = over.id;

    // Se droppato su una colonna (ID del task_status_id)
    if (typeof overId === "number") {
      const targetStatus = taskStatuses.find(
        (status) => status.task_status_id === overId
      );
      if (targetStatus) {
        const updatedTasks = tasks.map((task) =>
          task.task_id === activeId
            ? {
                ...task,
                task_status_id: targetStatus.task_status_id,
                task_status: targetStatus,
              }
            : task
        );
        onTasksChange(updatedTasks);
      }
      return;
    }

    // Se droppato su un altro task (ID numero)
    const activeTask = tasks.find((t) => t.task_id === activeId);
    const overTask =
      typeof overId === "number"
        ? tasks.find((t) => t.task_id === overId)
        : null;

    if (!activeTask || !overTask) return;

    // Se sono nella stessa colonna, riordina
    if (activeTask.task_status_id === overTask.task_status_id) {
      const oldIndex = tasks.findIndex((t) => t.task_id === activeId);
      const newIndex =
        typeof overId === "number"
          ? tasks.findIndex((t) => t.task_id === overId)
          : -1;
      onTasksChange(arrayMove(tasks, oldIndex, newIndex));
    } else {
      // Se sono in colonne diverse, sposta nella nuova colonna
      const updatedTasks = tasks.map((task) =>
        task.task_id === activeId
          ? {
              ...task,
              task_status_id: overTask.task_status_id,
              task_status: overTask.task_status,
            }
          : task
      );
      onTasksChange(updatedTasks);
    }
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
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
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

        {/* Overlay per il drag */}
        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
          }}
        >
          {activeTask ? (
            <div
              className="w-64 bg-default/10 border border-default-50 rounded-lg p-2.5 shadow-2xl"
              style={{
                transform: "scale(1.05)",
                boxShadow:
                  "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon
                  icon="solar:move-linear"
                  className="text-primary text-base animate-pulse"
                />
                <h4 className="font-medium text-xs text-default-900">
                  {activeTask.title}
                </h4>
              </div>
              <p className="text-[10px] text-default-500 line-clamp-2">
                {activeTask.description}
              </p>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

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
