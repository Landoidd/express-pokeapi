import { Trainer } from "../models/Trainer.js";
import { Gym } from "../models/Gym.js";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.PORT = "3000";

jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

jest.mock("../models/Trainer", () => ({
  Trainer: {
    create: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock("../models/Gym", () => ({
  Gym: {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    countDocuments: jest.fn(),
  },
}));

jest.mock("../utils/pokeapi", () => ({
  pokeAPI: {
    getPokemon: jest.fn(),
  },
}));

jest.mock("../utils/database", () => ({
  connectDB: jest.fn().mockResolvedValue(undefined),
  disconnectDB: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("../utils/middleware", () => ({
  authenticateToken: jest.fn((req: any, res: any, next: any) => {
    req.trainer = { _id: "trainer123" };
    next();
  }),
}));

const mockTrainer = Trainer as jest.Mocked<typeof Trainer>;
const mockGym = Gym as jest.Mocked<typeof Gym>;

export { mockTrainer, mockGym };
