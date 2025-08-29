import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export const loginSchema = z.object({
  email: z.email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" }),
});

export const addPokemonSchema = z.object({
  name: z.string().min(1, { message: "Pokemon name is required" }),
});

export const updatePokemonSchema = z.object({
  nickname: z.string().optional(),
  level: z.number().min(1).max(100).optional(),
});

export const createGymSchema = z.object({
  gymName: z
    .string()
    .min(2, { message: "Gym name must be at least 2 characters" }),
  gymLeader: z
    .string()
    .min(2, { message: "Gym leader name must be at least 2 characters" }),
  gymBadge: z
    .string()
    .min(2, { message: "Badge name must be at least 2 characters" }),
});

export const assignBadgeSchema = z.object({
  trainerId: z.string().min(1, { message: "Trainer ID is required" }),
  gymId: z.string().min(1, { message: "Gym ID is required" }),
});
