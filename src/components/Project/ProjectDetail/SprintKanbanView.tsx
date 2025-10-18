import { useState } from "react";
import {
  Button,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Task } from "../../../types";
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
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SprintKanbanViewProps {
  tasks: Task[];
  onTasksChange: (tasks: Task[]) => void;
  onTaskClick?: (task: Task) => void;
}

interface Column {
  id: string;
  name: string;
  color: string;
}

const COLUMNS: Column[] = [
  { id: "todo", name: "Da Fare", color: "#94a3b8" },
  { id: "in_progress", name: "In Corso", color: "#3b82f6" },
  { id: "review", name: "Review", color: "#f59e0b" },
  { id: "done", name: "Completato", color: "#10b981" },
];

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

  const priorityConfig = {
    low: { color: "#10b981", bg: "#f0fdf4", label: "Bassa" },
    medium: { color: "#f59e0b", bg: "#fffbeb", label: "Media" },
    high: { color: "#ef4444", bg: "#fef2f2", label: "Alta" },
  } as const;

  const priority = priorityConfig[task.priority];

  return (
    <div ref={setNodeRef} style={style} className="group">
      <div
        className="mb-2 bg-white border border-default-200 rounded-lg hover:border-primary-200 hover:shadow-sm transition-all duration-200 overflow-hidden"
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
              {task.assigned_to && (
                <Avatar
                  size="sm"
                  name={`${task.assigned_to.name} ${task.assigned_to.surname}`}
                  className="w-5 h-5 text-[9px] flex-shrink-0"
                />
              )}
            </div>

            {task.description && (
              <p className="text-[10px] text-default-500 line-clamp-2 mb-2 leading-relaxed">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-1.5">
              <span
                className="text-[9px] font-semibold px-2 py-0.5 rounded"
                style={{
                  color: priority.color,
                  backgroundColor: priority.bg,
                }}
              >
                {priority.label}
              </span>
              {task.story_points && (
                <span className="text-[9px] font-semibold text-primary-600 px-2 py-0.5 bg-primary-50 rounded">
                  {task.story_points} SP
                </span>
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
  onTasksChange,
  onTaskClick,
}: SprintKanbanViewProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);

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

    // Se droppato su una colonna (ID stringa)
    if (typeof overId === "string") {
      const updatedTasks = tasks.map((task) =>
        task.task_id === activeId ? { ...task, status: overId } : task
      );
      onTasksChange(updatedTasks);
      return;
    }

    // Se droppato su un altro task (ID numero)
    const activeTask = tasks.find((t) => t.task_id === activeId);
    const overTask = tasks.find((t) => t.task_id === overId);

    if (!activeTask || !overTask) return;

    // Se sono nella stessa colonna, riordina
    if (activeTask.status === overTask.status) {
      const oldIndex = tasks.findIndex((t) => t.task_id === activeId);
      const newIndex = tasks.findIndex((t) => t.task_id === overId);
      onTasksChange(arrayMove(tasks, oldIndex, newIndex));
    } else {
      // Se sono in colonne diverse, sposta nella nuova colonna
      const updatedTasks = tasks.map((task) =>
        task.task_id === activeId ? { ...task, status: overTask.status } : task
      );
      onTasksChange(updatedTasks);
    }
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter((task) => task.status === status);
  };

  const getTaskIds = (status: string) => {
    return getTasksByStatus(status).map((t) => t.task_id);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-4 gap-3">
        {COLUMNS.map((column) => {
          const columnTasks = getTasksByStatus(column.id);

          return (
            <div key={column.id} className="flex flex-col">
              <div
                className="bg-default-50/50 border border-default-200 rounded-xl p-3 flex-1 backdrop-blur-sm"
                data-column-id={column.id}
              >
                {/* Header colonna */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-default-200">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="font-bold text-xs text-default-900 flex-1 uppercase tracking-wide">
                    {column.name}
                  </h3>
                  <span className="text-xs font-semibold text-default-600 bg-white px-2 py-0.5 rounded-full">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Task list */}
                <SortableContext
                  items={getTaskIds(column.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div
                    className="min-h-[200px]"
                    onDrop={(e) => {
                      e.preventDefault();
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    data-droppable="true"
                  >
                    {columnTasks.length === 0 ? (
                      <div className="text-center py-10 text-default-400">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-white rounded-full mb-2 shadow-sm">
                          <Icon
                            icon="solar:clipboard-linear"
                            className="text-2xl text-default-400"
                          />
                        </div>
                        <p className="text-[10px] font-medium">
                          Trascina qui i task
                        </p>
                      </div>
                    ) : (
                      columnTasks.map((task) => (
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
            className="w-64 bg-white border-2 border-primary rounded-lg p-2.5 shadow-2xl"
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
  );
}
