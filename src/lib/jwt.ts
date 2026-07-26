import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "development-secret";

export function generateToken(payload: {
  userId: string;
  role: string;
  department: string | null;
}) {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1d",
  });
}