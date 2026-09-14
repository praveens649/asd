import prisma from "../config/db.js";

export const getDashboardStats = async (userId) => {
  const monthNames = [
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

  const [
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    projectsInProgress,
    highPriorityTasks,
    mediumPriorityTasks,
    lowPriorityTasks,
    userProjects,
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

    prisma.task.count({
      where: {
        status: "IN_PROGRESS",
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

    prisma.task.count({
      where: {
        priority: "HIGH",
        project: {
          userId,
        },
      },
    }),

    prisma.task.count({
      where: {
        priority: "MEDIUM",
        project: {
          userId,
        },
      },
    }),

    prisma.task.count({
      where: {
        priority: "LOW",
        project: {
          userId,
        },
      },
    }),

    prisma.project.findMany({
      where: {
        userId,
      },
      select: {
        createdAt: true,
        startDate: true,
      },
    }),
  ]);

  // Generate stats for all 12 months of the current year
  const now = new Date();
  const currentYear = now.getFullYear();

  const monthlyProjects = monthNames.map((monthName, mIndex) => {
    const count = userProjects.filter((p) => {
      const pDate = new Date(p.createdAt || p.startDate);
      return pDate.getFullYear() === currentYear && pDate.getMonth() === mIndex;
    }).length;

    return {
      month: monthName,
      projects: count,
    };
  });

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    projectsInProgress,
    highPriorityTasks,
    mediumPriorityTasks,
    lowPriorityTasks,
    monthlyProjects,
  };
};