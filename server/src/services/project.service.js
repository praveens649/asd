import prisma from "../config/db.js";

export const createProject = async (userId, data) => {
  return prisma.project.create({
    data: {
      ...data,
      userId,
    },
  });
};

export const getProjects = async (userId, filters = {}) => {
  const { search, status } = filters;

  const where = {
    userId,
  };

  if (search) {
    where.name = {
      contains: search,
      mode: "insensitive",
    };
  }

  if (status) {
    where.status = status;
  }

  return prisma.project.findMany({
    where,
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getProjectById = async (userId, projectId) => {
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
    include: {
      tasks: true,
    },
  });

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return project;
};

export const updateProject = async (
  userId,
  projectId,
  data
) => {
  const existingProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!existingProject) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return prisma.project.update({
    where: {
      id: projectId,
    },
    data,
  });
};

export const deleteProject = async (userId, projectId) => {
  const existingProject = await prisma.project.findFirst({
    where: {
      id: projectId,
      userId,
    },
  });

  if (!existingProject) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  await prisma.project.delete({
    where: {
      id: projectId,
    },
  });
};