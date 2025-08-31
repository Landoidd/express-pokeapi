import mongoose from "mongoose";

export const badgeSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
    },
    gymName: {
      type: String,
      required: true,
    },
    dateEarned: {
      type: Date,
      default: Date.now,
    },
    gymLeader: {
      type: String,
      required: true,
    },
  });