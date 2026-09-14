"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown, Minus, FolderKanban } from "lucide-react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";

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

export const description = "A radar chart showing project listing by months from the database";

const ALL_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const chartConfig = {
  projects: {
    label: "Projects",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

interface ChartRadarDefaultProps {
  stats?: DashboardStats | null;
}

export function ChartRadarDefault({ stats }: ChartRadarDefaultProps) {
  // Strictly use monthly project stats from the database for all 12 months
  const chartData = useMemo(() => {
    if (stats?.monthlyProjects && stats.monthlyProjects.length > 0) {
      return stats.monthlyProjects;
    }
    // Fallback if stats is still initializing: all 12 months with 0 count
    return ALL_MONTHS.map((month) => ({
      month,
      projects: 0,
    }));
  }, [stats]);

  // Real trend based strictly on actual project counts
  const trend = useMemo(() => {
    if (chartData.length < 2) {
      return { text: "No activity recorded", type: "neutral" as const };
    }
    // Compare current calendar month vs previous month
    const currentMonthIndex = new Date().getMonth();
    const current = chartData[currentMonthIndex]?.projects ?? 0;
    const prevMonthIndex = currentMonthIndex === 0 ? 11 : currentMonthIndex - 1;
    const previous = chartData[prevMonthIndex]?.projects ?? 0;

    if (current === 0 && previous === 0) {
      return { text: "No new projects this month", type: "neutral" as const };
    }

    if (previous === 0) {
      return {
        text: `+${current} new project${current > 1 ? "s" : ""} this month`,
        type: "up" as const,
      };
    }

    const diff = ((current - previous) / previous) * 100;
    const absDiff = Math.abs(Math.round(diff * 10) / 10);

    if (diff > 0) {
      return { text: `Trending up by ${absDiff}% this month`, type: "up" as const };
    } else if (diff < 0) {
      return { text: `Down by ${absDiff}% this month`, type: "down" as const };
    }
    return { text: "Same project volume as last month", type: "neutral" as const };
  }, [chartData]);

  const totalPeriodProjects = useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.projects, 0);
  }, [chartData]);

  const currentYear = new Date().getFullYear();

  return (
    <Card className="flex flex-col border-border/80 bg-card/60 backdrop-blur-xs shadow-sm transition-all hover:border-amber-500/30">
      <CardHeader className="items-center pb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
            <FolderKanban className="h-4 w-4" />
          </div>
          <CardTitle className="text-base font-semibold">Projects by Month</CardTitle>
        </div>
        <CardDescription className="text-xs text-muted-foreground">
          Full 12-month overview (January - December {currentYear})
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-0 flex-1 flex items-center justify-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-h-[300px]"
        >
          <RadarChart
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius="66%"
            margin={{ top: 10, right: 25, bottom: 10, left: 25 }}
          >
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <PolarAngleAxis
              dataKey="month"
              tick={{
                fill: "var(--muted-foreground)",
                fontSize: 10,
                fontWeight: 500,
              }}
            />
            <PolarGrid stroke="currentColor" className="text-border/60" />
            <Radar
              name="Projects"
              dataKey="projects"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="#f59e0b"
              fillOpacity={0.45}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>

      <CardFooter className="flex-col gap-2 pt-2 text-sm border-t border-border/50">
        <div className="flex items-center gap-2 font-medium text-xs sm:text-sm">
          {trend.type === "up" && (
            <span className="flex items-center gap-1.5 text-emerald-500">
              {trend.text} <TrendingUp className="h-4 w-4" />
            </span>
          )}
          {trend.type === "down" && (
            <span className="flex items-center gap-1.5 text-amber-500">
              {trend.text} <TrendingDown className="h-4 w-4" />
            </span>
          )}
          {trend.type === "neutral" && (
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {trend.text} <Minus className="h-4 w-4" />
            </span>
          )}
        </div>
        <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
          <span>January - December {currentYear}</span>
          <span className="font-medium text-foreground">
            Total Projects: {totalPeriodProjects}
          </span>
        </div>
      </CardFooter>
    </Card>
  );
}
