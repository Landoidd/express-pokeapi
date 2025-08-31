import request from "supertest";
import app from "../app";
import { mockTrainer, mockGym } from "./setup";
import { authenticateToken, AuthenticatedRequest } from "../utils/middleware";
import { Response, NextFunction } from "express";

const mockAuthenticateToken = authenticateToken as jest.MockedFunction<
  typeof authenticateToken
>;

describe("Gym Routes", () => {
  const mockToken = "mock-jwt-token";
  const mockTrainerId = "trainer123";
  const mockGymId = "gym123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/gyms", () => {
    it("should return paginated list of gyms", async () => {
      const mockGyms = [
        {
          _id: "gym1",
          gymName: "Pewter Gym",
          gymLeader: "Brock",
          gymBadge: "Rock Badge",
          gymMembers: [],
        },
        {
          _id: "gym2",
          gymName: "Cerulean Gym",
          gymLeader: "Misty",
          gymBadge: "Water Badge",
          gymMembers: [],
        },
      ];

      mockGym.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockGyms),
            }),
          }),
        }),
      } as any);

      mockGym.countDocuments.mockResolvedValue(2);

      const response = await request(app).get("/api/gyms");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("gyms");
      expect(response.body).toHaveProperty("pagination");
      expect(response.body.gyms).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it("should handle search query", async () => {
      const mockGyms = [
        {
          _id: "gym1",
          gymName: "Pewter Gym",
          gymLeader: "Brock",
          gymBadge: "Boulder Badge",
          gymMembers: [],
        },
      ];

      mockGym.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockGyms),
            }),
          }),
        }),
      } as any);

      mockGym.countDocuments.mockResolvedValue(1);

      const response = await request(app).get("/api/gyms?search=Pewter");

      expect(response.status).toBe(200);
      expect(mockGym.find).toHaveBeenCalledWith({
        $or: [
          { gymName: { $regex: "Pewter", $options: "i" } },
          { gymLeader: { $regex: "Pewter", $options: "i" } },
          { gymBadge: { $regex: "Pewter", $options: "i" } },
        ],
      });
    });

    it("should handle pagination parameters", async () => {
      const mockGyms: any[] = [];

      mockGym.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockGyms),
            }),
          }),
        }),
      } as any);

      mockGym.countDocuments.mockResolvedValue(0);

      const response = await request(app).get("/api/gyms?page=2&limit=5");

      expect(response.status).toBe(200);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
    });

    it("should handle database errors", async () => {
      mockGym.find.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get("/api/gyms");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message", "Internal server error");
    });
  });

  describe("GET /api/gyms/:id", () => {
    it("should return specific gym by id", async () => {
      const mockGymData = {
        _id: mockGymId,
        gymName: "Pewter Gym",
        gymLeader: "Brock",
        gymBadge: "Rock Badge",
        gymMembers: [
          {
            _id: "member1",
            name: "Trainer 1",
            email: "trainer1@example.com",
            badges: [],
            pokemon: [],
          },
        ],
      };

      mockGym.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGymData),
      } as any);

      const response = await request(app).get(`/api/gyms/${mockGymId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("gym");
      expect(response.body.gym.gymName).toBe("Pewter Gym");
      expect(mockGym.findById).toHaveBeenCalledWith(mockGymId);
    });

    it("should return 404 when gym not found", async () => {
      mockGym.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      } as any);

      const response = await request(app).get(`/api/gyms/${mockGymId}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Gym not found");
    });

    it("should handle database errors", async () => {
      mockGym.findById.mockImplementation(() => {
        throw new Error("Database error");
      });

      const response = await request(app).get(`/api/gyms/${mockGymId}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("message", "Internal server error");
    });
  });

  describe("POST /api/gyms", () => {
    it("should create a new gym when authenticated", async () => {
      const newGymData = {
        gymName: "Test Gym",
        gymLeader: "Test Leader",
        gymBadge: "Test Badge",
      };

      const createdGym = {
        _id: "newgym123",
        ...newGymData,
        gymMembers: [],
      };

      mockGym.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      mockGym.create.mockResolvedValue(createdGym as any);

      const response = await request(app)
        .post("/api/gyms")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(newGymData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "Gym created successfully"
      );
      expect(response.body).toHaveProperty("gym");
      expect(response.body.gym.gymName).toBe("Test Gym");
      expect(mockGym.create).toHaveBeenCalledWith({
        gymName: "Test Gym",
        gymLeader: "Test Leader",
        gymBadge: "Test Badge",
        gymMembers: [],
      });
    });

    it("should return 400 when gym name already exists", async () => {
      const newGymData = {
        gymName: "Existing Gym",
        gymLeader: "Test Leader",
        gymBadge: "Test Badge",
      };

      mockGym.findOne.mockResolvedValueOnce({ gymName: "Existing Gym" } as any);

      const response = await request(app)
        .post("/api/gyms")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(newGymData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Gym name already exists"
      );
    });

    it("should return 400 when badge name already exists", async () => {
      const newGymData = {
        gymName: "New Gym",
        gymLeader: "Test Leader",
        gymBadge: "Existing Badge",
      };

      mockGym.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ gymBadge: "Existing Badge" } as any);

      const response = await request(app)
        .post("/api/gyms")
        .set("Authorization", `Bearer ${mockToken}`)
        .send(newGymData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Badge name already exists"
      );
    });

    it("should return 401 when not authenticated", async () => {
      mockAuthenticateToken.mockImplementationOnce(
        async (
          req: AuthenticatedRequest,
          res: Response,
          next: NextFunction
        ) => {
          res.status(401).json({ message: "Access token required" });
        }
      );

      const response = await request(app).post("/api/gyms").send({
        gymName: "Test Gym",
        gymLeader: "Test Leader",
        gymBadge: "Test Badge",
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Access token required");
    });
  });

  describe("POST /api/gyms/:id/join", () => {
    it("should allow trainer to join gym", async () => {
      const mockGymData = {
        _id: mockGymId,
        gymName: "Test Gym",
        gymMembers: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockGym.findById.mockResolvedValue(mockGymData as any);

      const response = await request(app)
        .post(`/api/gyms/${mockGymId}/join`)
        .set("Authorization", `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Successfully joined Test Gym"
      );
      expect(mockGymData.gymMembers).toContain(mockTrainerId);
      expect(mockGymData.save).toHaveBeenCalled();
    });

    it("should return 400 when trainer is already a member", async () => {
      const mockGymData = {
        _id: mockGymId,
        gymName: "Test Gym",
        gymMembers: [mockTrainerId],
      };

      mockGym.findById.mockResolvedValue(mockGymData as any);

      const response = await request(app)
        .post(`/api/gyms/${mockGymId}/join`)
        .set("Authorization", `Bearer ${mockToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "You are already a member of this gym"
      );
    });

    it("should return 404 when gym not found", async () => {
      mockGym.findById.mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/gyms/${mockGymId}/join`)
        .set("Authorization", `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Gym not found");
    });
  });

  describe("POST /api/gyms/:id/leave", () => {
    it("should allow trainer to leave gym", async () => {
      const mockGymData = {
        _id: mockGymId,
        gymName: "Test Gym",
        gymMembers: [mockTrainerId, "other-trainer"],
        save: jest.fn().mockResolvedValue(true),
      };

      mockGymData.gymMembers.splice = jest.fn();

      mockGym.findById.mockResolvedValue(mockGymData as any);

      const response = await request(app)
        .post(`/api/gyms/${mockGymId}/leave`)
        .set("Authorization", `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Successfully left Test Gym"
      );
      expect(mockGymData.gymMembers.splice).toHaveBeenCalledWith(0, 1);
      expect(mockGymData.save).toHaveBeenCalled();
    });

    it("should return 400 when trainer is not a member", async () => {
      const mockGymData = {
        _id: mockGymId,
        gymName: "Test Gym",
        gymMembers: ["other-trainer"],
      };

      mockGym.findById.mockResolvedValue(mockGymData as any);

      const response = await request(app)
        .post(`/api/gyms/${mockGymId}/leave`)
        .set("Authorization", `Bearer ${mockToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "You are not a member of this gym"
      );
    });

    it("should return 404 when gym not found", async () => {
      mockGym.findById.mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/gyms/${mockGymId}/leave`)
        .set("Authorization", `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Gym not found");
    });
  });

  describe("POST /api/gyms/:id/claim", () => {
    it("should assign badge to target trainer", async () => {
      const targetTrainerId = "target-trainer-123";
      const mockGymData = {
        _id: mockGymId,
        gymName: "Test Gym",
        gymLeader: "Test Leader",
        gymBadge: "Test Badge",
      };

      const mockTargetTrainer = {
        _id: targetTrainerId,
        name: "Target Trainer",
        badges: [],
        save: jest.fn().mockResolvedValue(true),
      };

      mockGym.findById.mockResolvedValue(mockGymData as any);
      mockTrainer.findById.mockResolvedValue(mockTargetTrainer as any);

      const response = await request(app)
        .post(`/api/gyms/${mockGymId}/claim`)
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ trainerId: targetTrainerId });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Successfully assigned Test Badge badge to Target Trainer"
      );
      expect(response.body).toHaveProperty("badges");
      expect(mockTargetTrainer.badges).toHaveLength(1);
      expect(mockTargetTrainer.badges[0]).toMatchObject({
        name: "Test Badge",
        gymName: "Test Gym",
        gymLeader: "Test Leader",
      });
      expect(mockTargetTrainer.save).toHaveBeenCalled();
    });

    it("should return 400 when trainer already has the badge", async () => {
      const targetTrainerId = "target-trainer-123";
      const mockGymData = {
        _id: mockGymId,
        gymName: "Test Gym",
        gymLeader: "Test Leader",
        gymBadge: "Test Badge",
      };

      const mockTargetTrainer = {
        _id: targetTrainerId,
        name: "Target Trainer",
        badges: [
          {
            name: "Test Badge",
            gymName: "Test Gym",
            gymLeader: "Test Leader",
            dateEarned: new Date(),
          },
        ],
      };

      mockGym.findById.mockResolvedValue(mockGymData as any);
      mockTrainer.findById.mockResolvedValue(mockTargetTrainer as any);

      const response = await request(app)
        .post(`/api/gyms/${mockGymId}/claim`)
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ trainerId: targetTrainerId });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Trainer already has this badge"
      );
    });

    it("should return 404 when gym not found", async () => {
      mockGym.findById.mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/gyms/${mockGymId}/claim`)
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ trainerId: "target-trainer-123" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Gym not found");
    });

    it("should return 404 when target trainer not found", async () => {
      const targetTrainerId = "nonexistent-trainer";
      const mockGymData = {
        _id: mockGymId,
        gymName: "Test Gym",
        gymLeader: "Test Leader",
        gymBadge: "Test Badge",
      };

      mockGym.findById.mockResolvedValue(mockGymData as any);
      mockTrainer.findById.mockResolvedValue(null);

      const response = await request(app)
        .post(`/api/gyms/${mockGymId}/claim`)
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ trainerId: targetTrainerId });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Target trainer not found"
      );
    });
  });
});
