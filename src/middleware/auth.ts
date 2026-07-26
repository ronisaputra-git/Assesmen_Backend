import type { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import type { AppVariables } from "../types/hono";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";

export type AuthUser = {
  userId: string;
  role: string;
  department: string | null;
};

export async function authMiddleware(c: Context<{ Variables: AppVariables }>,next: Next,) {
  const authHeader = c.req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        message: "Unauthorized",
      },
      401,
    );
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    c.set("user", decoded);

    await next();
  } catch (error) {
    return c.json(
      {
        message: "Invalid or expired token",
      },
      401,
    );
  }
}