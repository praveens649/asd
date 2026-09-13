"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Project, ProjectStatus, Task, TaskPriority, TaskStatus } from "@/lib/types";
import TaskModal from "@/components/TaskModal";
import ConfirmModal from "@/components/ConfirmModal";

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
          <span className="inline-flex items-center rounded-full bg-slate-700/50 px-3 py-1 text-xs font-medium text-slate-300 border border-slate-600/40">
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
          <span className="inline-flex items-center rounded-md bg-slate-700/50 px-2 py-0.5 text-xs font-medium text-slate-300 border border-slate-600/30">
            Low
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 animate-pulse rounded bg-slate-800" />
        <div className="animate-pulse rounded-2xl border border-slate-800 bg-slate-900 p-8 space-y-4">
          <div className="h-8 w-1/3 rounded bg-slate-800" />
          <div className="h-4 w-2/3 rounded bg-slate-800" />
          <div className="h-4 w-1/2 rounded bg-slate-800" />
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="space-y-6">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Projects
        </Link>

        <div className="rounded-2xl border border-red-900 bg-red-950/40 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-900/30 text-red-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h3 className="mt-4 text-lg font-semibold text-white">Project Not Found</h3>
          <p className="mt-2 text-sm text-slate-400">
            {error || "The requested project could not be found or you don't have permission to view it."}
          </p>
          <button
            onClick={() => router.push("/projects")}
            className="mt-6 inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition"
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
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Projects
        </Link>
      </div>

      {/* Project Overview Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                {project.name}
              </h1>
              {getProjectStatusBadge(project.status)}
            </div>
            <p className="text-sm text-slate-400 max-w-3xl whitespace-pre-line">
              {project.description || "No description provided for this project."}
            </p>
          </div>

          <button
            onClick={() => {
              setDefaultStatus("PENDING");
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition hover:bg-indigo-500 shrink-0"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Task
          </button>
        </div>

        {/* Project Metadata & Progress */}
        <div className="mt-8 grid grid-cols-1 gap-4 border-t border-slate-800 pt-6 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <p className="text-xs font-medium text-slate-400">Timeline</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">
              {formatDate(project.startDate)} &rarr; {formatDate(project.endDate)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <p className="text-xs font-medium text-slate-400">Created On</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">
              {formatDate(project.createdAt)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-4">
            <p className="text-xs font-medium text-slate-400">Tasks Progress</p>
            <p className="mt-1 text-sm font-semibold text-slate-200">
              {completedTasksCount} of {tasks.length} completed
            </p>
          </div>
        </div>
      </div>

      {/* Kanban Drag & Drop Workspace */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Task Workspace
            </h2>
            <p className="text-xs text-slate-400">
              Drag and drop cards across columns to update their status instantly.
            </p>
          </div>
        </div>

        {/* Task Search & Filter Toolbar (Responsive Mobile/Desktop) */}
        <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                placeholder="Search tasks by name..."
                className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Status Filter */}
              <div className="w-full sm:w-40">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500"
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-indigo-500"
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
                  className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white shrink-0"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {tasksLoading && (
            <p className="text-xs text-indigo-400 animate-pulse">Filtering tasks...</p>
          )}
        </div>

        {/* No Filter Results Banner */}
        {tasks.length === 0 && hasActiveTaskFilters && !tasksLoading && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-8 text-center">
            <p className="text-sm font-medium text-slate-300">
              No tasks match your current search and filter criteria.
            </p>
            <button
              onClick={handleClearTaskFilters}
              className="mt-3 rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
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
                className={`flex flex-col rounded-2xl border bg-slate-900/90 p-4 transition-all duration-150 min-h-[420px] ${
                  isColumnOver
                    ? "border-indigo-500/80 bg-slate-900 ring-2 ring-indigo-500/30 shadow-lg shadow-indigo-950/50"
                    : "border-slate-800/80"
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2.5 w-2.5 rounded-full ${column.dotColor}`} />
                    <h3 className="font-semibold text-white text-sm">
                      {column.title}
                    </h3>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400">
                      {columnTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      setDefaultStatus(column.id);
                      setEditingTask(null);
                      setIsTaskModalOpen(true);
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                    title={`Add task to ${column.title}`}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </button>
                </div>

                {/* Task Cards List */}
                <div className="flex-1 space-y-3">
                  {columnTasks.length === 0 ? (
                    <div className="flex h-32 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 p-4 text-center">
                      <p className="text-xs text-slate-500">No {column.title.toLowerCase()} tasks</p>
                      <button
                        onClick={() => {
                          setDefaultStatus(column.id);
                          setEditingTask(null);
                          setIsTaskModalOpen(true);
                        }}
                        className="mt-2 text-xs font-medium text-indigo-400 hover:text-indigo-300"
                      >
                        + Create one
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
                          className={`group rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-sm transition-all hover:border-slate-700 hover:bg-slate-950 cursor-grab active:cursor-grabbing ${
                            isBeingDragged ? "opacity-40 scale-[0.98] border-indigo-500/50" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-600 group-hover:text-slate-400 transition" title="Drag to reorder">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                </svg>
                              </span>
                              <h4 className="text-sm font-semibold text-white line-clamp-1">
                                {task.name}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                              <button
                                onClick={() => {
                                  setEditingTask(task);
                                  setIsTaskModalOpen(true);
                                }}
                                className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                                title="Edit Task"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                </svg>
                              </button>

                              <button
                                onClick={() => setDeletingTask(task)}
                                className="rounded p-1 text-slate-400 hover:bg-red-950/50 hover:text-red-300 transition"
                                title="Delete Task"
                              >
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {task.description && (
                            <p className="mt-1.5 text-xs text-slate-400 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5 text-xs">
                            {getTaskPriorityBadge(task.priority)}
                            <span className="text-slate-400">
                              Due: <span className="text-slate-300 font-medium">{formatDate(task.dueDate)}</span>
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
