"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Project, ProjectStatus } from "@/lib/types";

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (project: Project) => void;
  initialData?: Project | null;
}

interface ProjectResponse {
  success: boolean;
  message?: string;
  data: {
    project: Project;
  };
}

export default function ProjectModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: ProjectModalProps) {
  const isEditing = Boolean(initialData);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectStatus>("NOT_STARTED");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Populate form when modal opens or initialData changes
  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setStatus(initialData.status || "NOT_STARTED");
      setStartDate(
        initialData.startDate
          ? new Date(initialData.startDate).toISOString().split("T")[0]
          : ""
      );
      setEndDate(
        initialData.endDate
          ? new Date(initialData.endDate).toISOString().split("T")[0]
          : ""
      );
    } else {
      setName("");
      setDescription("");
      setStatus("NOT_STARTED");
      const today = new Date().toISOString().split("T")[0];
      setStartDate(today);
      setEndDate(today);
    }
    setError("");
  }, [initialData, isOpen]);

  // Handle ESC key press
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
      setError("Project name is required.");
      return;
    }

    if (!startDate) {
      setError("Start date is required.");
      return;
    }

    if (!endDate) {
      setError("End date is required.");
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError("End date must be on or after start date.");
      return;
    }

    const token = getToken();
    if (!token) {
      setError("Authentication required. Please sign in again.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: trimmedName,
        description: description.trim() || undefined,
        status,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
      };

      const endpoint = isEditing && initialData ? `/projects/${initialData.id}` : "/projects";
      const method = isEditing ? "PUT" : "POST";

      const response = await api<ProjectResponse>(endpoint, {
        method,
        token,
        body: JSON.stringify(payload),
      });

      onSuccess(response.data.project);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save project. Please try again."
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
      aria-labelledby="modal-title"
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 id="modal-title" className="text-lg font-semibold text-white">
            {isEditing ? "Edit Project" : "Create New Project"}
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
            <label htmlFor="projectName" className="mb-1.5 block text-xs font-medium text-slate-300">
              Project Name <span className="text-red-400">*</span>
            </label>
            <input
              id="projectName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mobile App Redesign"
              required
              disabled={loading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="projectDesc" className="mb-1.5 block text-xs font-medium text-slate-300">
              Description
            </label>
            <textarea
              id="projectDesc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about the project goals..."
              disabled={loading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-500 disabled:opacity-60 resize-none"
            />
          </div>

          <div>
            <label htmlFor="projectStatus" className="mb-1.5 block text-xs font-medium text-slate-300">
              Status
            </label>
            <select
              id="projectStatus"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
              disabled={loading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 disabled:opacity-60"
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="startDate" className="mb-1.5 block text-xs font-medium text-slate-300">
                Start Date <span className="text-red-400">*</span>
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="mb-1.5 block text-xs font-medium text-slate-300">
                End Date <span className="text-red-400">*</span>
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={loading}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-indigo-500 disabled:opacity-60"
              />
            </div>
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
                  : "Creating project..."
                : isEditing
                ? "Save Changes"
                : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
