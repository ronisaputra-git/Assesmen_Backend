import type { z } from "zod";

export function validationError(error: z.ZodError) {
  return {
    success: false,
    message: "Validation error",
    errors: error.issues,
  };
}