import { Hono } from "hono";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { requireRole } from "../middleware/role";
import { createTaskSchema,updateTaskStatusSchema, assignTaskSchema, taskIdSchema } from "../validator/task.schema";
import { validationError } from "../utils/validation";

const tasks = new Hono();

tasks.post("/", authMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    const result = createTaskSchema.safeParse(body);
      if (!result.success) {
        return c.json(validationError(result.error), 400);
      }
    const {
      title,
      description,
      projectId,
      assigneeId,
    } = result.data;
    
    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return c.json(
        {
          message: "Project not found",
        },
        404,
      );
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId: assigneeId || null,
      },
    });

    return c.json(
      {
        message: "Task created successfully",
        task,
      },
      201,
    );
  } catch (error) {
    console.error(error);

    return c.json(
      {
        message: "Internal server error",
      },
      500,
    );
  }
});
tasks.patch("/:id/assign", authMiddleware, async (c) => {
  try {
    const taskId = c.req.param("id");
    const taskIdResult = taskIdSchema.safeParse({
      id: taskId,
    });

    if (!taskIdResult.success) {
      return c.json(
        {
          success: false,
          message: "Validation error",
          errors: taskIdResult.error.issues,
        },
        400,
      );
    }
    const body = await c.req.json();
    const result = assignTaskSchema.safeParse(body);

      if (!result.success) {
        return c.json(validationError(result.error), 400);
      }

    const { assigneeId } = result.data;

    const user = await prisma.user.findUnique({
      where: {
        id: assigneeId,
      },
    });

    if (!user || user.role !== "INTERNAL") {
      return c.json(
        {
          message: "Assignee must be an INTERNAL user",
        },
        400,
      );
    }

    const task = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        assigneeId,
      },
    });

    return c.json({
      message: "Task assigned successfully",
      task,
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        message: "Internal server error",
      },
      500,
    );
  }
});
tasks.patch("/:id/status", authMiddleware, async (c) => {
  try {
    const taskId = c.req.param("id");
    const taskIdResult = taskIdSchema.safeParse({
      id: taskId,
    });

    if (!taskIdResult.success) {
      return c.json(
        {
          success: false,
          message: "Validation error",
          errors: taskIdResult.error.issues,
        },
        400,
      );
    }
    const body = await c.req.json();
    const result = updateTaskStatusSchema.safeParse(body);
    if (!result.success) {
      return c.json(
        {
          success: false,
          message: "Validation error",
          errors: result.error.issues,
        },
        400,
      );
    }
    const { status } = result.data;

    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      return c.json(
        {
          message: "Task not found",
        },
        404,
      );
    }
    const user = c.get("user");

    if (task.assigneeId !== user.userId) {
      return c.json(
        {
          message: "You are not assigned to this task",
        },
        403,
      );
    }

    const updatedTask = await prisma.task.update({
      where: {
        id: taskId,
      },
      data: {
        status,
      },
    });

    return c.json({
      message: "Task status updated successfully",
      task: updatedTask,
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        message: "Internal server error",
      },
      500,
    );
  }
})

tasks.get("/", authMiddleware, async (c) => {
  try {
    const status = c.req.query("status");
    const search = c.req.query("search");
    const page = Number(c.req.query("page")) || 1;
    const limit = Number(c.req.query("limit")) || 10;
    const skip = (page - 1) * limit;
    const total = await prisma.task.count({
      where: {
        ...(status && {
          status: status as any,
        }),
        ...(search && {
          title: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
    });
    const tasks = await prisma.task.findMany({
      where: {
        ...(status && {
          status: status as any,
        }),

        ...(search && {
          title: {
            contains: search,
            mode: "insensitive",
          },
        }),
      },
        skip,
        take: limit,
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
              },
            },
          },
        });

    return c.json({
      success: true,
      message: "Tasks retrieved successfully",
      data: tasks,

      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        success: false,
        message: "Internal server error",
      },
      500,
    );
      }
});;
tasks.get("/:id", authMiddleware, async (c) => {
  try {
    const taskId = c.req.param("id");
    const taskIdResult = taskIdSchema.safeParse({
      id: taskId,
    });

    if (!taskIdResult.success) {
      return c.json(
        {
          success: false,
          message: "Validation error",
          errors: taskIdResult.error.issues,
        },
        400,
      );
    }
    const task = await prisma.task.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
          },
        },
      },
    });

    if (!task) {
      return c.json(
        {
          message: "Task not found",
        },
        404,
      );
    }

    return c.json({
      message: "Task retrieved successfully",
      task,
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        message: "Internal server error",
      },
      500,
    );
  }
});
tasks.delete("/:id", authMiddleware, requireRole("PM"), async (c) => {
    try {
      const taskId = c.req.param("id");
      const taskIdResult = taskIdSchema.safeParse({id: taskId,});

      if (!taskIdResult.success) {
        return c.json(
          {
            success: false,
            message: "Validation error",
            errors: taskIdResult.error.issues,
          },
          400,
        );
      }

      const task = await prisma.task.findUnique({
        where: {
          id: taskId,
        },
      });

      if (!task) {
        return c.json(
          {
            message: "Task not found",
          },
          404,
        );
      }

      await prisma.task.delete({
        where: {
          id: taskId,
        },
      });

      return c.json({
        message: "Task deleted successfully",
      });
    } catch (error) {
      console.error(error);

      return c.json(
        {
          message: "Internal server error",
        },
        500,
      );
    }
  },
);

export default tasks;