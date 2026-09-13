import prisma from "../config/db.js";

export const getDashboardStats = async (userId) => {
  const [
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    projectsInProgress,
  ] = await Promise.all([
    prisma.project.count({
      where: {
        userId,
      },
    }),

    prisma.task.count({
      where: {
        project: {
          userId,
        },
      },
    }),

    prisma.task.count({
      where: {
        status: "COMPLETED",
        project: {
          userId,
        },
      },
    }),

    prisma.task.count({
      where: {
        status: "PENDING",
        project: {
          userId,
        },
      },
    }),

    prisma.project.count({
      where: {
        userId,
        status: "IN_PROGRESS",
      },
    }),
  ]);

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    projectsInProgress,
  };
};