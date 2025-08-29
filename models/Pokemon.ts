import mongoose from "mongoose";

export const pokemonSchema = new mongoose.Schema({
    pokemonId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    nickname: {
      type: String,
    },
    level: {
      type: Number,
      min: 1,
      max: 100,
      default: 1,
    },
    types: {
      type: [String],
      required: true,
    },
    dateAdded: {
      type: Date,
      default: Date.now,
    },
  });