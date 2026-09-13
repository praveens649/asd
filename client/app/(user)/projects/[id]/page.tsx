"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { Project, ProjectStatus, Task, TaskPriority, TaskStatus } from "@/lib/types";

interface ProjectDetailResponse {
  success: boolean;
  data: {
    project: Project & {
      tasks: Task[];
    };
  };
}

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [project, setProject] = useState<(Project & { tasks: Task[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

      setProject(response.data.project);
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

  const getTaskStatusBadge = (status: TaskStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
            Completed
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400 border border-blue-500/20">
            In Progress
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
            Pending
          </span>
        );
    }
  };

  const getTaskPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case "HIGH":
        return (
          <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-medium text-rose-400 border border-rose-500/20">
            High Priority
          </span>
        );
      case "MEDIUM":
        return (
          <span className="inline-flex items-center rounded-md bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400 border border-amber-500/20">
            Medium Priority
          </span>
        );
      case "LOW":
      default:
        return (
          <span className="inline-flex items-center rounded-md bg-slate-700/50 px-2 py-0.5 text-xs font-medium text-slate-300 border border-slate-600/30">
            Low Priority
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

  const tasks = project.tasks || [];
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
        </div>

        {/* Project Metadata & Timeline */}
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

      {/* Project Tasks Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Tasks
            </h2>
            <p className="text-xs text-slate-400">
              Tasks assigned to this project.
            </p>
          </div>
        </div>

        {tasks.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-slate-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">No tasks yet</h3>
            <p className="mt-1 text-sm text-slate-400">
              There are no tasks created for this project yet.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-xl border border-slate-800 bg-slate-900 p-5 space-y-3 transition hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-white line-clamp-1">{task.name}</h4>
                  {getTaskStatusBadge(task.status)}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {task.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs">
                  {getTaskPriorityBadge(task.priority)}
                  <span className="text-slate-400">
                    Due: <span className="text-slate-300 font-medium">{formatDate(task.dueDate)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
