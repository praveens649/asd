"use client";

import { FormEvent, useEffect, useState } from "react";
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
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 id="task-modal-title" className="text-lg font-semibold text-white">
            {isEditing ? "Edit Task" : "Create New Task"}
          </h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-lg border border-red-900 bg-red-950/50 px-4 py-3 text-sm text-red-300"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="taskName" className="mb-1.5 block text-xs font-medium text-slate-300">
              Task Name <span className="text-red-400">*</span>
            </label>
            <input
              id="taskName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Implement authentication middleware"
              required
              disabled={loading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="taskDesc" className="mb-1.5 block text-xs font-medium text-slate-300">
              Description
            </label>
            <textarea
              id="taskDesc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed acceptance criteria or notes..."
              disabled={loading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 disabled:opacity-60 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="taskPriority" className="mb-1.5 block text-xs font-medium text-slate-300">
                Priority
              </label>
              <select
                id="taskPriority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 disabled:opacity-60"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div>
              <label htmlFor="taskStatus" className="mb-1.5 block text-xs font-medium text-slate-300">
                Status
              </label>
              <select
                id="taskStatus"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                disabled={loading}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 disabled:opacity-60"
              >
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="taskDueDate" className="mb-1.5 block text-xs font-medium text-slate-300">
              Due Date <span className="text-red-400">*</span>
            </label>
            <input
              id="taskDueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              disabled={loading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? isEditing
                  ? "Saving changes..."
                  : "Creating task..."
                : isEditing
                ? "Save Changes"
                : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
