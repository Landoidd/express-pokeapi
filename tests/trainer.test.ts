import request from "supertest";
import app from "../app";
import { mockTrainer } from "./setup";
import { pokeAPI } from "../utils/pokeapi";
import { authenticateToken, AuthenticatedRequest } from "../utils/middleware";
import { Response, NextFunction } from "express";

const mockPokeAPI = pokeAPI as jest.Mocked<typeof pokeAPI>;
const mockAuthenticateToken = authenticateToken as jest.MockedFunction<
  typeof authenticateToken
>;

describe("Trainer Routes", () => {
  const mockToken = "mock-jwt-token";
  const mockTrainerId = "trainer123";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/trainer", () => {
    it("should return trainer profile when authenticated", async () => {
      const mockTrainerData = {
        _id: mockTrainerId,
        name: "test-name",
        email: "test-email@example.com",
        badges: [],
        pokemon: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockTrainer.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockTrainerData),
      } as any);

      const response = await request(app)
        .get("/api/trainer")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("trainer");
      expect(response.body.trainer.name).toBe("test-name");
      expect(mockTrainer.findById).toHaveBeenCalledWith(mockTrainerId);
    });

    it("should return 401 when no token provided", async () => {
      mockAuthenticateToken.mockImplementationOnce(
        async (
          req: AuthenticatedRequest,
          res: Response,
          next: NextFunction
        ) => {
          res.status(401).json({ message: "Access token required" });
        }
      );

      const response = await request(app).get("/api/trainer");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("message", "Access token required");
    });

    it("should return 404 when trainer not found", async () => {
      mockTrainer.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      } as any);

      const response = await request(app)
        .get("/api/trainer")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Trainer not found");
    });
  });

  describe("POST /api/trainer/pokemon/add", () => {
    it("should add a pokemon to trainer's team", async () => {
      const mockTrainerData = {
        _id: mockTrainerId,
        pokemon: [],
        save: jest.fn().mockResolvedValue(true),
      };

      const mockPokemonData = {
        id: 25,
        name: "pikachu",
        types: [{ type: { name: "electric" } }],
      };

      mockTrainer.findById.mockResolvedValue(mockTrainerData as any);
      mockPokeAPI.getPokemon.mockResolvedValue(mockPokemonData as any);

      const response = await request(app)
        .post("/api/trainer/pokemon/add")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ name: "pikachu" });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty(
        "message",
        "Pokemon added to team successfully"
      );
      expect(response.body).toHaveProperty("team");
      expect(mockPokeAPI.getPokemon).toHaveBeenCalledWith("pikachu");
      expect(mockTrainerData.save).toHaveBeenCalled();
    });

    it("should return 400 when team is full (6 pokemon)", async () => {
      const mockTrainerData = {
        _id: mockTrainerId,
        pokemon: new Array(6).fill({ pokemonId: 1 }),
      };

      mockTrainer.findById.mockResolvedValue(mockTrainerData as any);

      const response = await request(app)
        .post("/api/trainer/pokemon/add")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ name: "pikachu" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Cannot have more than 6 Pokemon in your team"
      );
    });

    it("should return 400 when pokemon already in team", async () => {
      const mockTrainerData = {
        _id: mockTrainerId,
        pokemon: [{ pokemonId: 25 }],
      };

      const mockPokemonData = {
        id: 25,
        name: "pikachu",
        types: [{ type: { name: "electric" } }],
      };

      mockTrainer.findById.mockResolvedValue(mockTrainerData as any);
      mockPokeAPI.getPokemon.mockResolvedValue(mockPokemonData as any);

      const response = await request(app)
        .post("/api/trainer/pokemon/add")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ name: "pikachu" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "This Pokemon is already in your team"
      );
    });

    it("should return 400 when pokemon not found in PokeAPI", async () => {
      const mockTrainerData = {
        _id: mockTrainerId,
        pokemon: [],
      };

      mockTrainer.findById.mockResolvedValue(mockTrainerData as any);
      mockPokeAPI.getPokemon.mockRejectedValue(
        new Error("Failed to fetch Pokemon data")
      );

      const response = await request(app)
        .post("/api/trainer/pokemon/add")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ name: "invalidpokemon" });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty(
        "message",
        "Pokemon not found in PokeAPI"
      );
    });
  });

  describe("PUT /api/trainer/pokemon/update/:pokemonId", () => {
    it("should update pokemon nickname and level", async () => {
      const mockTrainerData = {
        _id: mockTrainerId,
        pokemon: [
          {
            pokemonId: 25,
            name: "pikachu",
            nickname: "",
            level: 1,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      mockTrainer.findById.mockResolvedValue(mockTrainerData as any);

      const response = await request(app)
        .put("/api/trainer/pokemon/update/25")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ nickname: "test-nickname", level: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Pokemon updated successfully"
      );
      expect(response.body.pokemon.nickname).toBe("test-nickname");
      expect(response.body.pokemon.level).toBe(10);
      expect(mockTrainerData.save).toHaveBeenCalled();
    });

    it("should return 404 when pokemon not found in team", async () => {
      const mockTrainerData = {
        _id: mockTrainerId,
        pokemon: [],
      };

      mockTrainer.findById.mockResolvedValue(mockTrainerData as any);

      const response = await request(app)
        .put("/api/trainer/pokemon/update/25")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ nickname: "test-nickname" });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Pokemon not found in your team"
      );
    });

    it("should update only nickname when level not provided", async () => {
      const mockTrainerData = {
        _id: mockTrainerId,
        pokemon: [
          {
            pokemonId: 25,
            name: "pikachu",
            nickname: "",
            level: 5,
          },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      mockTrainer.findById.mockResolvedValue(mockTrainerData as any);

      const response = await request(app)
        .put("/api/trainer/pokemon/update/25")
        .set("Authorization", `Bearer ${mockToken}`)
        .send({ nickname: "test-nickname" });

      expect(response.status).toBe(200);
      expect(response.body.pokemon.nickname).toBe("test-nickname");
      expect(response.body.pokemon.level).toBe(5);
    });
  });

  describe("DELETE /api/trainer/pokemon/remove/:pokemonId", () => {
    it("should remove pokemon from team", async () => {
      const mockTrainerData = {
        _id: mockTrainerId,
        pokemon: [
          { pokemonId: 25, name: "pikachu" },
          { pokemonId: 1, name: "bulbasaur" },
        ],
        save: jest.fn().mockResolvedValue(true),
      };

      mockTrainerData.pokemon.splice = jest.fn();

      mockTrainer.findById.mockResolvedValue(mockTrainerData as any);

      const response = await request(app)
        .delete("/api/trainer/pokemon/remove/25")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty(
        "message",
        "Pokemon removed from team successfully"
      );
      expect(response.body).toHaveProperty("team");
      expect(mockTrainerData.pokemon.splice).toHaveBeenCalledWith(0, 1);
      expect(mockTrainerData.save).toHaveBeenCalled();
    });

    it("should return 404 when pokemon not found in team", async () => {
      const mockTrainerData = {
        _id: mockTrainerId,
        pokemon: [{ pokemonId: 1, name: "bulbasaur" }],
      };

      mockTrainer.findById.mockResolvedValue(mockTrainerData as any);

      const response = await request(app)
        .delete("/api/trainer/pokemon/remove/25")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        "message",
        "Pokemon not found in your team"
      );
    });

    it("should return 404 when trainer not found", async () => {
      mockTrainer.findById.mockResolvedValue(null);

      const response = await request(app)
        .delete("/api/trainer/pokemon/remove/25")
        .set("Authorization", `Bearer ${mockToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("message", "Trainer not found");
    });
  });
});