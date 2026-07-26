import type { AuthUser } from "../middleware/auth";

export type AppVariables = {
  user: AuthUser;
};