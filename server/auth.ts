import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "recallguard_secret";

export function generateToken(userId: number) {
  return jwt.sign({ userId }, SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): { userId: number } | null {
  try {
    return jwt.verify(token, SECRET) as { userId: number };
  } catch {
    return null;
  }
}