import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./src/config/db.js";

import userRoutes from "./src/routes/userRoute.js";
import pharmacyRoutes from "./src/routes/pharmacyRoute.js";


dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

connectDB();


app.use("/api/users", userRoutes);
app.use("/api/pharmacy", pharmacyRoutes
);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
