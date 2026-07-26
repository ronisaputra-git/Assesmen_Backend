import { z } from "zod";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required"),

  description: z
    .string()
    .optional(),

  projectId: z
    .string()
    .uuid("Invalid projectId"),

  assigneeId: z
    .string()
    .uuid("Invalid assigneeId")
    .optional(),
});
export const updateTaskStatusSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE", "BLOCKED"]),
});
export const assignTaskSchema = z.object({
  assigneeId: z.string().uuid("Invalid assigneeId"),
});
export const taskIdSchema = z.object({
  id: z.string().uuid("Invalid task ID"),
});