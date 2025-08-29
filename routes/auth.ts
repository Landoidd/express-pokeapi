import express from "express";
import { Trainer } from "../models/Trainer.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema } from "../utils/validation.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = registerSchema.parse(req.body);
    const hashedPassword = await bcrypt.hash(password, 10);
    await Trainer.create({ name, email, password: hashedPassword });
    res.status(201).json({ message: "Trainer created successfully" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Invalid request" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const trainer = await Trainer.findOne({ email });
    if (!trainer) {
        return res.status(401).json({ message: "Trainer not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, trainer.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const token = jwt.sign(
      { id: trainer._id },
      process.env.JWT_SECRET as string
    );
    res.status(200).json({ token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
