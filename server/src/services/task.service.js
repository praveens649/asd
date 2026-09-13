import prisma from "../config/db.js";

const verifyProjectOwnership = async (userId, projectId) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return project;
};

export const createTask = async (userId, data) => {
  await verifyProjectOwnership(userId, data.projectId);

  return prisma.task.create({
    data,
  });
};

export const getTasks = async (userId, filters = {}) => {
  const { search, status, priority, projectId } = filters;

  const where = {
    project: {
      userId,
    },
  };

  if (projectId) {
    where.projectId = projectId;
  }

  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (status) {
    where.status = status;
  }

  if (priority) {
    where.priority = priority;
  }

  return prisma.task.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getTaskById = async (userId, taskId) => {
  const task = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        userId,
      },
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!task) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  return task;
};

export const updateTask = async (
  userId,
  taskId,
  data
) => {
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        userId,
      },
    },
  });

  if (!existingTask) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.task.update({
    where: {
      id: taskId,
    },
    data,
  });
};

export const deleteTask = async (userId, taskId) => {
  const existingTask = await prisma.task.findFirst({
    where: {
      id: taskId,
      project: {
        userId,
      },
    },
  });

  if (!existingTask) {
    const error = new Error("Task not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.task.delete({
    where: {
      id: taskId,
    },
  });
};