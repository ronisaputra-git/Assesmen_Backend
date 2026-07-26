import { Hono } from "hono";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import {requireRole}  from "../middleware/role";
import { createProjectSchema, updateProjectSchema, projectIdSchema } from "../validator/project.schema";
import { validationError } from "../utils/validation";

const projects = new Hono();

projects.post("/", authMiddleware, requireRole("PM"), async (c) => {
    try {
      const body = await c.req.json();
      const result = createProjectSchema.safeParse(body);
      if (!result.success) {
        return c.json(validationError(result.error), 400);
      }

      const {
        name,
        description,
        clientId,
      } = result.data;

      const client = await prisma.user.findUnique({
        where: {
          id: clientId,
        },
      });

      if (!client || client.role !== "CLIENT") {
        return c.json(
          {
            message: "Invalid client",
          },
          400,
        );
      }

      const project = await prisma.project.create({
        data: {
          name,
          description,
          clientId,
        },
      });

      return c.json(
        {
          message: "Project created successfully",
          project,
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
  },
);
projects.get("/", authMiddleware, async (c) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
              },
            },
          },
        },
      },
    });

    return c.json({
      message: "Projects retrieved successfully",
      projects,
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
projects.get("/:id", authMiddleware, async (c) => {
  try {
    const projectId = c.req.param("id");

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
              },
            },
          },
        },
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

    return c.json({
      message: "Project retrieved successfully",
      project,
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
projects.patch("/:id", authMiddleware, requireRole("PM"), async (c) => {
  try {
    const projectId = c.req.param("id");
    const body = await c.req.json();
    const result = updateProjectSchema.safeParse(body);
      if (!result.success) {
        return c.json(validationError(result.error), 400);
      }

    const { name, description } = result.data;
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

    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        name: name ?? project.name,
        description: description ?? project.description,
      },
    });

    return c.json({
      message: "Project updated successfully",
      project: updatedProject,
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
projects.delete("/:id", authMiddleware, requireRole("PM"), async (c) => {
    try {
      const projectId = c.req.param("id");
      const result = projectIdSchema.safeParse({id: projectId,});
      if (!result.success) {
        return c.json(validationError(result.error), 400);
      }
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

      await prisma.task.deleteMany({
        where: {projectId,},
      })
      await prisma.project.delete({
        where: {
          id: projectId,
        },
      });

      return c.json({
        message: "Project deleted successfully",
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
export default projects;