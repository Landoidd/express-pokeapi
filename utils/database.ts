import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is not defined in environment variables");
}

export const connectDB = async (): Promise<void> => {
  try {
    console.log("Connecting to MongoDB...");
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB Disconnected");
  } catch (error) {
    console.error("Error disconnecting from MongoDB:", error);
  }
};

mongoose.connection.on("connected", () => {
  console.log("Mongoose connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error("Mongoose connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("Mongoose disconnected from MongoDB");
});

process.on("SIGINT", async () => {
  await disconnectDB();
  process.exit(0);
});
