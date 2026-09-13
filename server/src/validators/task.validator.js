import { z } from "zod";

const taskPriority = z.enum([
  "LOW",
  "MEDIUM",
  "HIGH",
]);

const taskStatus = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
]);

export const createTaskSchema = z.object({
  projectId: z
    .string()
    .min(1, "Project ID is required"),

  name: z
    .string()
    .trim()
    .min(1, "Task name is required")
    .max(150, "Task name must not exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),

  priority: taskPriority.optional(),

  status: taskStatus.optional(),

  dueDate: z.coerce.date({
    error: "Due date must be a valid date",
  }),
});

export const updateTaskSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Task name is required")
    .max(150, "Task name must not exceed 150 characters")
    .optional(),

  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),

  priority: taskPriority.optional(),

  status: taskStatus.optional(),

  dueDate: z.coerce.date({
    error: "Due date must be a valid date",
  }).optional(),
});