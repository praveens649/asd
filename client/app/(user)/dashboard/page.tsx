"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { DashboardStats } from "@/lib/types";

interface DashboardResponse {
  success: boolean;
  data: {
    stats: DashboardStats;
  };
}

export default function DashboardPage() {
  const [stats, setStats] =
    useState<DashboardStats | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = getToken();

        if (!token) {
          throw new Error("Authentication required");
        }

        const response =
          await api<DashboardResponse>(
            "/dashboard",
            {
              method: "GET",
              token,
            }
          );

        setStats(response.data.stats);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Failed to load dashboard"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <p className="text-slate-400">
          Loading dashboard...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-900 bg-red-950/40 p-6">
        <h2 className="font-semibold text-red-300">
          Failed to load dashboard
        </h2>

        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
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
    },
    {
      title: "Total Tasks",
      value: stats.totalTasks,
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
    },
    {
      title: "Projects In Progress",
      value: stats.projectsInProgress,
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold sm:text-3xl">
          Dashboard
        </h2>

        <p className="mt-2 text-slate-400">
          Here's an overview of your projects and tasks.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((card) => (
          <div
            key={card.title}
            className="rounded-xl border border-slate-800 bg-slate-900 p-5"
          >
            <p className="text-sm text-slate-400">
              {card.title}
            </p>

            <p className="mt-3 text-3xl font-bold">
              {card.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}