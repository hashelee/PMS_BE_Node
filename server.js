import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js"; // ✅ Ensure you add .js extension

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

// Connect to MongoDB
connectDB();

app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
