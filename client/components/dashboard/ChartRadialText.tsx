"use client";

import { useState, useMemo } from "react";
import { TrendingUp, ListTodo } from "lucide-react";
import {
  Label,
  PolarGrid,
  PolarRadiusAxis,
  RadialBar,
  RadialBarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { DashboardStats } from "@/lib/types";

export const description = "A radial chart with text showing task status and priority distribution from database";

const chartConfig = {
  tasks: {
    label: "Tasks",
  },
  completed: {
    label: "Completed",
    color: "#10b981", // Emerald
  },
  inProgress: {
    label: "In Progress",
    color: "#38bdf8", // Sky
  },
  pending: {
    label: "Pending",
    color: "#f59e0b", // Amber
  },
  high: {
    label: "High Priority",
    color: "#f43f5e", // Rose
  },
  medium: {
    label: "Medium Priority",
    color: "#f59e0b", // Amber
  },
  low: {
    label: "Low Priority",
    color: "#10b981", // Emerald
  },
} satisfies ChartConfig;

interface ChartRadialTextProps {
  stats?: DashboardStats | null;
}

export function ChartRadialText({ stats }: ChartRadialTextProps) {
  const [viewMode, setViewMode] = useState<"status" | "priority">("status");

  // Strictly extract live database statistics
  const totalTasks = stats?.totalTasks ?? 0;
  const completedTasks = stats?.completedTasks ?? 0;
  const inProgressTasks = stats?.inProgressTasks ?? 0;
  const pendingTasks = stats?.pendingTasks ?? 0;

  const highPriorityTasks = stats?.highPriorityTasks ?? 0;
  const mediumPriorityTasks = stats?.mediumPriorityTasks ?? 0;
  const lowPriorityTasks = stats?.lowPriorityTasks ?? 0;

  // Real database status rings
  const statusChartData = useMemo(() => [
    { name: "completed", count: completedTasks, fill: "#10b981" },
    { name: "inProgress", count: inProgressTasks, fill: "#38bdf8" },
    { name: "pending", count: pendingTasks, fill: "#f59e0b" },
  ], [completedTasks, inProgressTasks, pendingTasks]);

  // Real database priority rings
  const priorityChartData = useMemo(() => [
    { name: "high", count: highPriorityTasks, fill: "#f43f5e" },
    { name: "medium", count: mediumPriorityTasks, fill: "#f59e0b" },
    { name: "low", count: lowPriorityTasks, fill: "#10b981" },
  ], [highPriorityTasks, mediumPriorityTasks, lowPriorityTasks]);

  const activeData = viewMode === "status" ? statusChartData : priorityChartData;

  const completionRate = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const maxDomain = Math.max(totalTasks, 1);

  return (
    <Card className="flex flex-col border-border/80 bg-card/60 backdrop-blur-xs shadow-sm transition-all hover:border-amber-500/30">
      <CardHeader className="items-center pb-0">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
              <ListTodo className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">Task Breakdown</CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Distribution by status & priority
              </CardDescription>
            </div>
          </div>

          {/* Toggle pill between Status & Priority */}
          <div className="flex rounded-lg border border-border/70 bg-muted/40 p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("status")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                viewMode === "status"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Status
            </button>
            <button
              type="button"
              onClick={() => setViewMode("priority")}
              className={`rounded-md px-2.5 py-1 font-medium transition ${
                viewMode === "priority"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Priority
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pb-0 flex-1 flex items-center justify-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-h-[300px]"
        >
          <RadialBarChart
            data={activeData}
            startAngle={90}
            endAngle={-270}
            innerRadius={60}
            outerRadius={105}
            barSize={10}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent nameKey="name" />}
            />
            <PolarGrid
              gridType="circle"
              radialLines={false}
              stroke="none"
              className="first:fill-muted/40 last:fill-background"
              polarRadius={[105, 60]}
            />
            <RadialBar
              dataKey="count"
              background={{ fill: "currentColor" }}
              className="text-muted/20"
              cornerRadius={8}
            />
            <PolarRadiusAxis
              domain={[0, maxDomain]}
              tick={false}
              tickLine={false}
              axisLine={false}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={viewBox.cy}
                          className="fill-foreground text-3xl font-bold tracking-tight"
                        >
                          {totalTasks.toLocaleString()}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 20}
                          className="fill-muted-foreground text-xs font-medium"
                        >
                          Total Tasks
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </PolarRadiusAxis>
          </RadialBarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-2.5 pt-2 text-sm border-t border-border/50">
        {/* Real database breakdown indicators */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
          {viewMode === "status" ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Completed:</span>
                <span className="font-semibold text-foreground">
                  {completedTasks}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                <span className="text-muted-foreground">In Progress:</span>
                <span className="font-semibold text-foreground">
                  {inProgressTasks}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Pending:</span>
                <span className="font-semibold text-foreground">
                  {pendingTasks}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span className="text-muted-foreground">High:</span>
                <span className="font-semibold text-foreground">
                  {highPriorityTasks}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span className="text-muted-foreground">Medium:</span>
                <span className="font-semibold text-foreground">
                  {mediumPriorityTasks}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-muted-foreground">Low:</span>
                <span className="font-semibold text-foreground">
                  {lowPriorityTasks}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            <span>{completionRate}% completion rate</span>
          </div>
          <span>Showing {viewMode === "status" ? "all task statuses" : "all priorities"}</span>
        </div>
      </CardFooter>
    </Card>
  );
}
