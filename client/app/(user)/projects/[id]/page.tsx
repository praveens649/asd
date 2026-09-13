"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Project, ProjectStatus, Task, TaskPriority, TaskStatus } from "@/lib/types";
import TaskModal from "@/components/TaskModal";
import ConfirmModal from "@/components/ConfirmModal";
import {
  ArrowLeft,
  Plus,
  Search,
  RotateCcw,
  Pencil,
  Trash2,
  GripVertical,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlayCircle,
} from "lucide-react";

interface ProjectDetailResponse {
  success: boolean;
  data: {
    project: Project & {
      tasks: Task[];
    };
  };
}

const COLUMNS: {
  id: TaskStatus;
  title: string;
  badgeClass: string;
  dotColor: string;
}[] = [
  {
    id: "PENDING",
    title: "Pending",
    badgeClass: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dotColor: "bg-amber-400",
  },
  {
    id: "IN_PROGRESS",
    title: "In Progress",
    badgeClass: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    dotColor: "bg-blue-400",
  },
  {
    id: "COMPLETED",
    title: "Completed",
    badgeClass: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    dotColor: "bg-emerald-400",
  },
];

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Task Filters
  const [taskSearch, setTaskSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [tasksLoading, setTasksLoading] = useState(false);
  const initialLoadDone = useRef(false);

  // Task Modal states (Create / Edit)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<TaskStatus>("PENDING");

  // Task Deletion states
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [isDeletingTask, setIsDeletingTask] = useState(false);
  const [deleteTaskError, setDeleteTaskError] = useState("");

  // Drag & Drop states
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);

  const fetchFilteredTasks = useCallback(async () => {
    if (!projectId) return;

    setTasksLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const params = new URLSearchParams();
      params.append("projectId", projectId);
      if (taskSearch.trim()) params.append("search", taskSearch.trim());
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (priorityFilter !== "ALL") params.append("priority", priorityFilter);

      const response = await api<{ success: boolean; data: { tasks: Task[] } }>(
        `/tasks?${params.toString()}`,
        {
          method: "GET",
          token,
        }
      );

      setTasks(response.data.tasks || []);
    } catch (err) {
      console.error("Failed to filter tasks:", err);
    } finally {
      setTasksLoading(false);
    }
  }, [projectId, taskSearch, statusFilter, priorityFilter]);

  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true;
      return;
    }

    const timer = setTimeout(() => {
      fetchFilteredTasks();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchFilteredTasks]);

  const handleClearTaskFilters = () => {
    setTaskSearch("");
    setStatusFilter("ALL");
    setPriorityFilter("ALL");
  };

  const hasActiveTaskFilters =
    taskSearch.trim() !== "" || statusFilter !== "ALL" || priorityFilter !== "ALL";

  const fetchProjectDetails = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError("");

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const response = await api<ProjectDetailResponse>(`/projects/${projectId}`, {
        method: "GET",
        token,
      });

      const { tasks: fetchedTasks, ...projectInfo } = response.data.project;
      setProject(projectInfo);
      setTasks(fetchedTasks || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load project details"
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectDetails();
  }, [fetchProjectDetails]);

  // Handle Drag & Drop
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    e.dataTransfer.effectAllowed = "move";
    setDraggedTaskId(taskId);
  };

  const handleDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const handleDragOver = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverColumn !== status) {
      setDragOverColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent, status: TaskStatus) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverColumn === status) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);

    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    if (!taskId) return;

    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask || targetTask.status === targetStatus) return;

    // Optimistic state update
    const previousTasks = [...tasks];
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t))
    );

    try {
      const token = getToken();
      if (!token) throw new Error("Authentication required");

      await api(`/tasks/${taskId}`, {
        method: "PUT",
        token,
        body: JSON.stringify({ status: targetStatus }),
      });
    } catch (err) {
      // Revert if API call fails
      setTasks(previousTasks);
      alert(
        err instanceof Error
          ? err.message
          : "Failed to update task status. Changes were reverted."
      );
    }
  };

  // Delete Task Handler
  const handleDeleteTask = async () => {
    if (!deletingTask) return;

    setIsDeletingTask(true);
    setDeleteTaskError("");

    try {
      const token = getToken();
      if (!token) throw new Error("Authentication required");

      await api(`/tasks/${deletingTask.id}`, {
        method: "DELETE",
        token,
      });

      setTasks((prev) => prev.filter((t) => t.id !== deletingTask.id));
      setDeletingTask(null);
    } catch (err) {
      setDeleteTaskError(
        err instanceof Error ? err.message : "Failed to delete task"
      );
    } finally {
      setIsDeletingTask(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getProjectStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            Completed
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
            In Progress
          </span>
        );
      case "NOT_STARTED":
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground border border-border">
            Not Started
          </span>
        );
    }
  };

  const getTaskPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "HIGH":
        return (
          <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400 border border-rose-500/20">
            High
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
            Medium
          </span>
        );
      case "LOW":
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground border border-border">
            Low
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        <div className="animate-pulse rounded-2xl border border-border bg-card p-8 space-y-4">
          <div className="h-8 w-1/3 rounded bg-muted" />
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>

        <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20 text-destructive">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-destructive">Project Not Found</h3>
          <p className="mt-2 text-sm text-destructive/80">
            {error || "The requested project could not be found or you don't have permission to view it."}
          </p>
          <button
            onClick={() => router.push("/projects")}
            className="mt-6 inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-sm transition"
          >
            Return to Projects
          </button>
        </div>
      </div>
    );
  }

  const completedTasksCount = tasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div className="space-y-8">
      {/* Navigation Back */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
      </div>

      {/* Project Overview Card */}
      <div className="rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                {project.name}
              </h1>
              {getProjectStatusBadge(project.status)}
            </div>
            <p className="text-sm text-muted-foreground max-w-3xl whitespace-pre-line">
              {project.description || "No description provided for this project."}
            </p>
          </div>

          <button
            onClick={() => {
              setDefaultStatus("PENDING");
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>

        {/* Project Metadata & Progress */}
        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">Timeline</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(project.startDate)} &rarr; {formatDate(project.endDate)}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">Created On</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatDate(project.createdAt)}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">Tasks Progress</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {completedTasksCount} of {tasks.length} completed
            </p>
          </div>
        </div>
      </div>

      {/* Kanban Drag & Drop Workspace */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Task Workspace
            </h2>
            <p className="text-xs text-muted-foreground">
              Drag and drop cards across columns to update their status instantly.
            </p>
          </div>
        </div>

        {/* Task Search & Filter Toolbar (Responsive Mobile/Desktop) */}
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search tasks by name..."
                className="w-full rounded-lg border border-input bg-background/50 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Status Filter */}
              <div className="w-full sm:w-40">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div className="w-full sm:w-40">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="HIGH">High Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="LOW">Low Priority</option>
                </select>
              </div>

              {/* Clear Filters Button */}
              {hasActiveTaskFilters && (
                <button
                  onClick={handleClearTaskFilters}
                  className="inline-flex items-center justify-center rounded-lg border border-border bg-secondary/80 px-3 py-2 text-xs font-medium text-secondary-foreground transition hover:bg-secondary shrink-0"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {tasksLoading && (
            <p className="text-xs text-primary animate-pulse">Filtering tasks...</p>
          )}
        </div>

        {/* No Filter Results Banner */}
        {tasks.length === 0 && hasActiveTaskFilters && !tasksLoading && (
          <div className="rounded-xl border border-border bg-card/60 p-8 text-center">
            <p className="text-sm font-medium text-foreground">
              No tasks match your current search and filter criteria.
            </p>
            <button
              onClick={handleClearTaskFilters}
              className="mt-3 rounded-lg bg-secondary px-4 py-1.5 text-xs font-medium text-secondary-foreground hover:bg-secondary/80 transition"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* Kanban Columns */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 items-start">
          {COLUMNS.map((column) => {
            const columnTasks = tasks.filter((task) => task.status === column.id);
            const isColumnOver = dragOverColumn === column.id;

            return (
              <div
                key={column.id}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDragLeave={(e) => handleDragLeave(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
                className={`flex flex-col rounded-2xl border bg-card/70 p-4 transition-all duration-150 min-h-[420px] ${
                  isColumnOver
                    ? "border-primary ring-2 ring-primary/30 shadow-lg bg-card"
                    : "border-border"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.dotColor}`} />
                    <h3 className="font-semibold text-foreground text-sm">
                      {column.title}
                    </h3>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setDefaultStatus(column.id);
                      setEditingTask(null);
                      setIsTaskModalOpen(true);
                    }}
                    className="rounded-lg p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition"
                    title={`Add task to ${column.title}`}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Task Cards List */}
                <div className="flex-1 space-y-3">
                  {columnTasks.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-border p-4 text-center">
                      <p className="text-xs text-muted-foreground">No {column.title.toLowerCase()} tasks</p>
                      <button
                        onClick={() => {
                          setDefaultStatus(column.id);
                          setEditingTask(null);
                          setIsTaskModalOpen(true);
                        }}
                        className="mt-2 text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Create one
                      </button>
                    </div>
                  ) : (
                    columnTasks.map((task) => {
                      const isBeingDragged = draggedTaskId === task.id;

                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task.id)}
                          onDragEnd={handleDragEnd}
                          className={`group rounded-xl border border-border bg-background/80 p-4 shadow-xs transition-all hover:border-border/80 hover:bg-background cursor-grab active:cursor-grabbing ${
                            isBeingDragged ? "opacity-40 scale-[0.98] border-primary/50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground/60 group-hover:text-muted-foreground transition cursor-grab" title="Drag to reorder">
                                <GripVertical className="h-4 w-4" />
                              </span>
                              <h4 className="text-sm font-semibold text-foreground line-clamp-1">
                                {task.name}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setIsTaskModalOpen(true);
                                }}
                                className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition"
                                title="Edit Task"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>

                              <button
                                onClick={() => setDeletingTask(task)}
                                className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                                title="Delete Task"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {task.description && (
                            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between border-t border-border/80 pt-2.5 text-xs">
                            {getTaskPriorityBadge(task.priority)}
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground/70" />
                              Due: <span className="text-foreground font-medium">{formatDate(task.dueDate)}</span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Create / Edit Modal */}
      <TaskModal
        isOpen={isTaskModalOpen}
        projectId={projectId}
        initialData={editingTask}
        defaultStatus={defaultStatus}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
        }}
        onSuccess={(savedTask) => {
          if (editingTask) {
            setTasks((prev) =>
              prev.map((t) => (t.id === savedTask.id ? savedTask : t))
            );
          } else {
            setTasks((prev) => [savedTask, ...prev]);
          }
        }}
      />

      {/* Delete Task Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingTask)}
        onClose={() => {
          if (!isDeletingTask) {
            setDeletingTask(null);
            setDeleteTaskError("");
          }
        }}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${deletingTask?.name}"? This action cannot be undone.`}
        confirmText="Delete Task"
        loading={isDeletingTask}
        error={deleteTaskError}
      />
    </div>
  );
}
