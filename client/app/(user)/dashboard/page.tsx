"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { DashboardStats } from "@/lib/types";
import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  Plus,
} from "lucide-react";

interface DashboardResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
  };
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getToken();

        if (!token) {
          throw new Error("Authentication required");
        }

        const response = await api<DashboardResponse>("/dashboard", {
          method: "GET",
          token,
        });

        setStats(response.data.stats);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded-lg bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-32 animate-pulse rounded-2xl border border-border bg-card p-5"
            />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6">
        <h2 className="font-semibold text-destructive">Failed to load dashboard</h2>
        <p className="mt-2 text-sm text-destructive/80">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      title: "Total Projects",
      value: stats.totalProjects,
      icon: FolderKanban,
      color: "text-primary",
      bgColor: "bg-primary/10 border-primary/20",
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks,
      icon: ListTodo,
      color: "text-sky-400",
      bgColor: "bg-sky-500/10 border-sky-500/20",
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      icon: Clock,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Projects In Progress",
      value: stats.projectsInProgress,
      icon: TrendingUp,
      color: "text-violet-400",
      bgColor: "bg-violet-500/10 border-violet-500/20",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real-time overview of your projects and task pipeline.
          </p>
        </div>

        <Link
          href="/projects"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-amber-400 hover:text-amber-950 hover:shadow-lg hover:shadow-amber-500/20 active:scale-[0.99] self-start sm:self-auto"
        >
          <span>View All Projects</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">{card.title}</p>
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${card.bgColor} ${card.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
                {card.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}