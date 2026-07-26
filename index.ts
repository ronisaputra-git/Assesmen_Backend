import { Hono } from "hono";
import prisma from "./src/lib/prisma";
import auth from "./src/routes/auth";
import { authMiddleware } from "./src/middleware/auth";
import type { AuthUser } from "./src/middleware/auth";
import projects from "./src/routes/projects";
import tasks from "./src/routes/tasks";



type Variables = {user: AuthUser;};
const app = new Hono <{Variables : Variables}>();
app.route("/auth", auth);
app.route("/projects", projects);
app.route("/tasks", tasks );

app.get("/", (c) => {
  return c.text("NodeWave Assessment API is running!");
});

app.get("/health", async (c) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return c.json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    return c.json(
      {
        status: "error",
        database: "disconnected",
      },
      500,
    );
  }
});

export default {
  port: 3000,
  fetch: app.fetch,
};
app.get("/protected", authMiddleware, (c) => {
  const user = c.get("user");

  return c.json({
    message: "You can access this protected route",
    user,
  });
});