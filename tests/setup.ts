import { Trainer } from "../models/Trainer.js";

process.env.JWT_SECRET = "test-jwt-secret";
process.env.PORT = "3000";

jest.mock("dotenv", () => ({
  config: jest.fn(),
}));

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
}));

jest.mock("jsonwebtoken", () => ({
  sign: jest.fn(),
}));

jest.mock("../models/Trainer", () => ({
  Trainer: {
    create: jest.fn(),
    findOne: jest.fn(),
  },
}));

const mockTrainer = Trainer as jest.Mocked<typeof Trainer>;

export { mockTrainer };
