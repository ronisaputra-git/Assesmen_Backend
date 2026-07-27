import { Hono } from "hono";
import bcrypt from "bcryptjs";
import prisma from "../lib/prisma";
import { generateToken } from "../lib/jwt";

const auth = new Hono();

auth.post("/register", async (c) => {
  try {
    const body = await c.req.json();

    const { name, email, password, role, department } = body;

    if (!name || !email || !password || !role) {
      return c.json(
        {
          message: "Name, email, password, and role are required",
        },
        400,
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return c.json(
        {
          message: "Email already registered",
        },
        409,
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        department: department || null,
      },
    });

    return c.json(
      {
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          department: user.department,
        },
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

auth.post("/login", async (c) => {
  try {
    const body = await c.req.json();

    const { email, password } = body;

    if (!email || !password) {
      return c.json(
        {
          message: "Email and password are required",
        },
        400,
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return c.json(
        {
          message: "Invalid email or password",
        },
        401,
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return c.json(
        {
          message: "Invalid email or password",
        },
        401,
      );
    }

    const token = generateToken({
      userId: user.id,
      role: user.role,
      department: user.department,
    });

    return c.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
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
auth.post("/register", async (c) => {
  try {
    const body = await c.req.json();

    const { name, email, password } = body;

    if (!name || !email || !password) {
      return c.json(
        {
          message: "Name, email, and password are required",
        },
        400,
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return c.json(
        {
          message: "Email already registered",
        },
        409,
      );
    }

    const hashedPassword = await Bun.password.hash(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    return c.json(
      {
        message: "Registration successful",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
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
export default auth;