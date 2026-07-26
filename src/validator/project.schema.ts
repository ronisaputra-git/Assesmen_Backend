import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required"),

  description: z.string().optional(),

  clientId: z.string().uuid("Invalid clientId"),
});
export const updateProjectSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),

  description: z.string().optional(),
});
export const projectIdSchema = z.object({
  id: z.string().uuid("Invalid project ID"),
});