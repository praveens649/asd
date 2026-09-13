"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Project, ProjectStatus } from "@/lib/types";
import ProjectModal from "@/components/ProjectModal";
import ConfirmModal from "@/components/ConfirmModal";
import {
  Plus,
  Search,
  Calendar,
  Pencil,
  Trash2,
  FolderPlus,
  Folder,
  RotateCcw,
  CheckCircle2,
  Clock,
  PlayCircle,
} from "lucide-react";

interface ProjectsResponse {
  success: boolean;
  data: {
    projects: Project[];
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const token = getToken();
      if (!token) {
        throw new Error("Authentication required");
      }

      const params = new URLSearchParams();
      if (search.trim()) {
        params.append("search", search.trim());
      }
      if (statusFilter && statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";
      const response = await api<ProjectsResponse>(`/projects${queryString}`, {
        method: "GET",
        token,
      });

      setProjects(response.data.projects);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load projects"
      );
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    // Debounce search/filter query slightly to prevent spamming backend
    const timeoutId = setTimeout(() => {
      fetchProjects();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [fetchProjects]);

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;

    setIsDeleting(true);
    setDeleteError("");

    try {
      const token = getToken();
      if (!token) throw new Error("Authentication required");

      await api(`/projects/${deletingProject.id}`, {
        method: "DELETE",
        token,
      });

      setProjects((prev) => prev.filter((p) => p.id !== deletingProject.id));
      setDeletingProject(null);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete project"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
            <PlayCircle className="h-3 w-3 mr-1" />
            In Progress
          </span>
        );
      case "NOT_STARTED":
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
            <Clock className="h-3 w-3 mr-1" />
            Not Started
          </span>
        );
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

  const hasActiveFilters = search.trim() !== "" || statusFilter !== "ALL";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Projects
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage, track, and monitor all your active projects.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          New Project
        </button>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by name..."
              className="w-full rounded-lg border border-input bg-background/50 py-2 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm text-foreground outline-none transition focus:border-ring focus:ring-1 focus:ring-ring"
            >
              <option value="ALL">All Statuses</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="inline-flex items-center justify-center rounded-lg border border-border bg-secondary/80 px-3 py-2 text-xs font-medium text-secondary-foreground transition hover:bg-secondary"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-destructive">
                Failed to load projects
              </h3>
              <p className="mt-1 text-xs text-destructive/80">{error}</p>
            </div>
            <button
              onClick={fetchProjects}
              className="rounded-lg border border-destructive/40 bg-destructive/20 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/30 transition"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-xl border border-border bg-card p-6 space-y-4"
            >
              <div className="h-5 w-3/4 rounded bg-muted"></div>
              <div className="h-4 w-full rounded bg-muted"></div>
              <div className="h-4 w-1/2 rounded bg-muted"></div>
              <div className="pt-4 border-t border-border flex justify-between">
                <div className="h-4 w-20 rounded bg-muted"></div>
                <div className="h-4 w-20 rounded bg-muted"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && projects.length === 0 && (
        <div className="rounded-2xl border border-border bg-card/60 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted border border-border text-muted-foreground">
            <FolderPlus className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-foreground">
            No projects found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveFilters
              ? "No projects match your current search or filter criteria."
              : "You haven't created any projects yet."}
          </p>
          {hasActiveFilters ? (
            <button
              onClick={handleClearFilters}
              className="mt-4 rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shadow-sm transition"
            >
              <Plus className="h-4 w-4" />
              Create your first project
            </button>
          )}
        </div>
      )}

      {/* Projects Grid */}
      {!loading && !error && projects.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition hover:border-border/80 hover:bg-card/80 shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <Link
                    href={`/projects/${project.id}`}
                    className="font-semibold text-foreground hover:text-primary transition text-lg line-clamp-1"
                  >
                    {project.name}
                  </Link>
                  {getStatusBadge(project.status)}
                </div>

                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {project.description || "No description provided."}
                </p>
              </div>

              <div className="mt-6 border-t border-border pt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-muted-foreground/80">
                    <Calendar className="h-3.5 w-3.5" />
                    Timeline:
                  </span>
                  <span className="font-medium text-foreground">
                    {formatDate(project.startDate)} &rarr; {formatDate(project.endDate)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground/80">Created:</span>
                  <span className="font-medium text-foreground">
                    {formatDate(project.createdAt)}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-4 flex items-center justify-end gap-2 border-t border-border pt-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingProject(project);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/60 px-2.5 py-1 text-xs font-medium text-secondary-foreground transition hover:border-border hover:bg-secondary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingProject(project);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive transition hover:border-destructive/50 hover:bg-destructive/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Project Create/Edit Modal */}
      <ProjectModal
        isOpen={isCreateModalOpen || Boolean(editingProject)}
        initialData={editingProject}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingProject(null);
        }}
        onSuccess={(savedProject) => {
          if (editingProject) {
            setProjects((prev) =>
              prev.map((p) => (p.id === savedProject.id ? savedProject : p))
            );
          } else {
            setProjects((prev) => [savedProject, ...prev]);
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletingProject)}
        onClose={() => {
          if (!isDeleting) {
            setDeletingProject(null);
            setDeleteError("");
          }
        }}
        onConfirm={handleDeleteProject}
        title="Delete Project"
        message={`Are you sure you want to delete "${deletingProject?.name}"? This action cannot be undone and will permanently remove all tasks associated with this project.`}
        confirmText="Delete Project"
        loading={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
