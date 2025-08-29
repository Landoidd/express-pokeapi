import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/auth.js";
import trainerRoutes from "./routes/trainer.js";
import gymRoutes from "./routes/gym.js";
import { connectDB } from "./utils/database.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT;

if (!PORT) {
  throw new Error("PORT is not defined");
}

await connectDB();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/trainer", trainerRoutes);
app.use("/api/gyms", gymRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
