import { z } from "zod";

const projectStatus = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
]);

const projectFields = {
  name: z
    .string()
    .trim()
    .min(1, "Project name is required")
    .max(150, "Project name must not exceed 150 characters"),

  description: z
    .string()
    .trim()
    .max(1000, "Description must not exceed 1000 characters")
    .optional(),

  status: projectStatus.optional(),

  startDate: z.coerce.date({
    error: "Start date must be a valid date",
  }),

  endDate: z.coerce.date({
    error: "End date must be a valid date",
  }),
};

export const createProjectSchema = z
  .object(projectFields)
  .refine(
    (data) => data.endDate >= data.startDate,
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }
  );

export const updateProjectSchema = z
  .object({
    name: projectFields.name.optional(),

    description: projectFields.description,

    status: projectStatus.optional(),

    startDate: projectFields.startDate.optional(),

    endDate: projectFields.endDate.optional(),
  })
  .refine(
    (data) => {
      // If both dates are supplied, validate their relationship.
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }

      return true;
    },
    {
      message: "End date must be on or after start date",
      path: ["endDate"],
    }
  );