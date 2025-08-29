import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { Trainer } from "../models/Trainer.js";

export interface AuthenticatedRequest extends Request {
  trainer?: any;
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Access token required" });
      return;
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) {
      res.status(500).json({ message: "JWT secret not configured" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    const trainer = await Trainer.findById(decoded.id).select("-password");

    if (!trainer) {
      res.status(401).json({ message: "Invalid token" });
      return;
    }

    req.trainer = trainer;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(403).json({ message: "Invalid or expired token" });
  }
};
