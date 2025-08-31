import request from "supertest";
import app from "../app";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { mockTrainer } from "./setup";

describe("Auth Routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /api/auth/register", () => {
    it("should register a new trainer successfully", async () => {
      const mockTrainerData = {
        name: "test-name",
        email: "test-email@",
        password: "hashedpassword",
      };

      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedpassword123");
      mockTrainer.create.mockResolvedValue(mockTrainerData as any);

      const response = await request(app).post("/api/auth/register").send({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "Trainer created successfully"
      );
      expect(mockTrainer.create).toHaveBeenCalledWith({
        name: "John Doe",
        email: "john@example.com",
        password: "hashedpassword123",
      });
    });

    it("should return 400 for invalid registration data", async () => {
      const response = await request(app).post("/api/auth/register").send({
        name: "",
        email: "invalid-email",
        password: "123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Invalid request");
    });

    it("should handle database errors during registration", async () => {
      mockTrainer.create.mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/api/auth/register").send({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("message", "Invalid request");
    });
  });

  describe("POST /api/auth/login", () => {
    it("should login successfully with valid credentials", async () => {
      const mockTrainerData = {
        _id: "trainer123",
        name: "John Doe",
        email: "john@example.com",
        password: "hashedpassword",
      };

      mockTrainer.findOne.mockResolvedValue(mockTrainerData as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue("mock-jwt-token");

      const response = await request(app).post("/api/auth/login").send({
        email: "john@example.com",
        password: "password123",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token", "mock-jwt-token");
      expect(mockTrainer.findOne).toHaveBeenCalledWith({
        email: "john@example.com",
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        "password123",
        "hashedpassword"
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: "trainer123" },
        process.env.JWT_SECRET as string
      );
    });

    it("should return 401 for non-existent user", async () => {
      mockTrainer.findOne.mockResolvedValue(null);

      const response = await request(app).post("/api/auth/login").send({
        email: "nonexistent@example.com",
        password: "password123",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Trainer not found");
    });

    it("should return 401 for invalid password", async () => {
      const mockTrainerData = {
        _id: "trainer123",
        email: "john@example.com",
        password: "hashedpassword",
      };

      mockTrainer.findOne.mockResolvedValue(mockTrainerData as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app).post("/api/auth/login").send({
        email: "john@example.com",
        password: "wrongpassword",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Invalid credentials");
    });

    it("should return 400 for invalid login data", async () => {
      const response = await request(app).post("/api/auth/login").send({
        email: "invalid-email",
        password: "",
      });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message", "Internal server error");
    });

    it("should handle database errors during login", async () => {
      mockTrainer.findOne.mockRejectedValue(new Error("Database error"));

      const response = await request(app).post("/api/auth/login").send({
        email: "john@example.com",
        password: "password123",
      });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message", "Internal server error");
    });
  });
});
