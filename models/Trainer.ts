import mongoose from "mongoose";
import { pokemonSchema } from "./Pokemon.js";
import { badgeSchema } from "./Badge.js";

const trainerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  badges: {
    type: [badgeSchema],
    default: [],
  },
  pokemon: {
    type: [pokemonSchema],
    default: [],
    validate: {
      validator: function (pokemon: any[]) {
        return pokemon.length <= 6;
      },
      message: "A trainer can have at most 6 Pokemon in their team",
    },
  },
});

trainerSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const Trainer = mongoose.model("Trainer", trainerSchema);
