"use client";

import { FormEvent, useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Task, TaskPriority, TaskStatus } from "@/lib/types";

interface TaskModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: (task: Task) => void;
  initialData?: Task | null;
  defaultStatus?: TaskStatus;
}

interface TaskResponse {
  success: boolean;
  message?: string;
  data: {
    task: Task;
  };
}

export default function TaskModal({
  isOpen,
  projectId,
  onClose,
  onSuccess,
  initialData,
  defaultStatus = "PENDING",
}: TaskModalProps) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [status, setStatus] = useState<TaskStatus>(defaultStatus);
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setPriority(initialData.priority || "MEDIUM");
      setStatus(initialData.status || "PENDING");
      setDueDate(
        initialData.dueDate
          ? new Date(initialData.dueDate).toISOString().split("T")[0]
          : ""
      );
    } else {
      setName("");
      setDescription("");
      setPriority("MEDIUM");
      setStatus(defaultStatus || "PENDING");
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      setDueDate(nextWeek.toISOString().split("T")[0]);
    }
    setError("");
  }, [initialData, defaultStatus, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, loading, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Task name is required.");
      return;
    }

    if (!dueDate) {
      setError("Due date is required.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Authentication required. Please sign in again.");
      return;
    }

    setLoading(true);

    try {
      const payload: Record<string, unknown> = {
        name: trimmedName,
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: new Date(dueDate).toISOString(),
      };

      let endpoint = "/tasks";
      let method = "POST";

      if (isEditing && initialData) {
        endpoint = `/tasks/${initialData.id}`;
        method = "PUT";
      } else {
        payload.projectId = projectId;
      }

      const response = await api<TaskResponse>(endpoint, {
        method,
        token,
        body: JSON.stringify(payload),
      });

      onSuccess(response.data.task);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save task. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-modal-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all text-card-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <h3 id="task-modal-title" className="text-lg font-semibold text-foreground">
            {isEditing ? "Edit Task" : "Create New Task"}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-muted-foreground hover:bg-amber-500/10 hover:text-amber-300 transition disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="taskName" className="mb-1.5 block text-xs font-medium text-foreground">
              Task Name <span className="text-destructive">*</span>
            </label>
            <input
              id="taskName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Implement authentication middleware"
              required
              disabled={loading}
              className="w-full rounded-lg border border-input bg-background/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition hover:border-amber-500/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="taskDesc" className="mb-1.5 block text-xs font-medium text-foreground">
              Description
            </label>
            <textarea
              id="taskDesc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed acceptance criteria or notes..."
              disabled={loading}
              className="w-full rounded-lg border border-input bg-background/50 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition hover:border-amber-500/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 disabled:opacity-60 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="taskPriority" className="mb-1.5 block text-xs font-medium text-foreground">
                Priority
              </label>
              <select
                id="taskPriority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={loading}
                className="w-full rounded-lg border border-input bg-background/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition hover:border-amber-500/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 disabled:opacity-60"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="taskStatus" className="mb-1.5 block text-xs font-medium text-foreground">
                Status
              </label>
              <select
                id="taskStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={loading}
                className="w-full rounded-lg border border-input bg-background/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition hover:border-amber-500/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 disabled:opacity-60"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="taskDueDate" className="mb-1.5 block text-xs font-medium text-foreground">
              Due Date <span className="text-destructive">*</span>
            </label>
            <input
              id="taskDueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-input bg-background/50 px-3.5 py-2.5 text-sm text-foreground outline-none transition hover:border-amber-500/50 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 disabled:opacity-60"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-border bg-secondary/80 px-4 py-2 text-sm font-medium text-secondary-foreground hover:border-amber-500/40 hover:bg-amber-500/10 hover:text-amber-300 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-amber-400 hover:text-amber-950 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {isEditing ? "Saving changes..." : "Creating task..."}
                  </span>
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
